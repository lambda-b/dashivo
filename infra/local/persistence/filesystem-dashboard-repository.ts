import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { DashboardAssetCatalog } from "@dashivo/shared-schema/api";
import { dashboardIdSchema, type DashboardSchema } from "@dashivo/shared-schema/dashboard";
import { DashboardRevisionConflict } from "@dashivo/server/models/dashboard-revision-conflict";
import { DashboardNotFound } from "@dashivo/server/models/dashboard-not-found";
import { InputSourceConflict } from "@dashivo/server/models/input-source-conflict";
import type {
  DashboardRepository,
  PythonLogicRegistration,
} from "@dashivo/server/models/dashboard-repository";

const dashboardDirectory = (projectRoot: string) =>
  path.join(projectRoot, "dashboard", "definitions");
const legacyDashboardId = "sales-overview";
const legacyDashboardPath = (projectRoot: string) =>
  path.join(projectRoot, "dashboard", "dashboard.json");
const dashboardPath = (projectRoot: string, id: string) => {
  const dashboardId = dashboardIdSchema.parse(id);
  return path.join(dashboardDirectory(projectRoot), `${dashboardId}.json`);
};

const resolvePythonPath = (projectRoot: string, sourcePath: string) => {
  const logicRoot = path.join(projectRoot, "dashboard", "logic");
  const destination = path.resolve(projectRoot, "dashboard", sourcePath);
  const relativePath = path.relative(logicRoot, destination);

  if (
    !sourcePath.startsWith("logic/") ||
    path.extname(destination) !== ".py" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Python source must be a .py file under dashboard/logic");
  }

  return destination;
};

const resolveInputPath = (projectRoot: string, sourcePath: string) => {
  const dataRoot = path.join(projectRoot, "dashboard", "data");
  const destination = path.resolve(projectRoot, "dashboard", sourcePath);
  const relativePath = path.relative(dataRoot, destination);

  if (
    !sourcePath.startsWith("data/") ||
    path.extname(destination) !== ".csv" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Input source must be a .csv file under dashboard/data");
  }

  return destination;
};

const listFiles = async (dashboardRoot: string, pattern: string) => {
  const files: string[] = [];

  for await (const file of fs.glob(pattern, { cwd: dashboardRoot })) files.push(file);

  return files.toSorted();
};

const readPython = async (projectRoot: string, id: string, sourcePath: string) => {
  await readDashboardById(projectRoot, id);
  return fs.readFile(resolvePythonPath(projectRoot, sourcePath), "utf8");
};

const writePython = async (projectRoot: string, id: string, sourcePath: string, source: string) => {
  await readDashboardById(projectRoot, id);
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

const createPython = async (
  projectRoot: string,
  id: string,
  sourcePath: string,
  source: string,
) => {
  await readDashboardById(projectRoot, id);
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" });
};

const deletePython = async (projectRoot: string, id: string, sourcePath: string) => {
  await readDashboardById(projectRoot, id);
  await fs.unlink(resolvePythonPath(projectRoot, sourcePath));
};

const readInput = async (projectRoot: string, id: string, sourcePath: string) => {
  await readDashboardById(projectRoot, id);
  if (!sourcePath.startsWith(`data/${id}/`)) {
    throw new Error("Input source must belong to the requested dashboard");
  }
  return fs.readFile(resolveInputPath(projectRoot, sourcePath), "utf8");
};

const createInput = async (projectRoot: string, id: string, fileName: string, source: string) => {
  await readDashboardById(projectRoot, id);
  const sourcePath = `data/${id}/${fileName}`;
  const destination = resolveInputPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new InputSourceConflict();
    throw error;
  });

  return sourcePath;
};

const readDashboardById = async (projectRoot: string, id: string) => {
  const filePath = dashboardPath(projectRoot, id);
  const source = await fs.readFile(filePath, "utf8").catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    if (id !== legacyDashboardId) throw new DashboardNotFound(id);
    return fs
      .readFile(legacyDashboardPath(projectRoot), "utf8")
      .catch((legacyError: NodeJS.ErrnoException) => {
        if (legacyError.code === "ENOENT") throw new DashboardNotFound(id);
        throw legacyError;
      });
  });

  return {
    dashboard: JSON.parse(source) as unknown,
    version: createHash("sha256").update(source).digest("hex"),
  };
};

const writeDashboard = async (
  projectRoot: string,
  id: string,
  dashboard: DashboardSchema,
  expectedVersion: string,
) => {
  const destination = dashboardPath(projectRoot, id);
  const serialized = `${JSON.stringify(dashboard, null, 2)}\n`;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const current = await fs
    .readFile(destination, "utf8")
    .catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      if (id === legacyDashboardId) {
        return fs
          .readFile(legacyDashboardPath(projectRoot), "utf8")
          .catch((legacyError: NodeJS.ErrnoException) => {
            if (legacyError.code === "ENOENT") return undefined;
            throw legacyError;
          });
      }
      return undefined;
    });

  const currentVersion = current && createHash("sha256").update(current).digest("hex");
  if (currentVersion !== expectedVersion) throw new DashboardRevisionConflict();
  if (current === serialized) return;

  await fs.writeFile(destination, serialized, "utf8");
};

const listDashboards = async (projectRoot: string) => {
  const directory = dashboardDirectory(projectRoot);
  await fs.mkdir(directory, { recursive: true });
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const dashboards = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const id = path.basename(entry.name, ".json");
        const [snapshot, info] = await Promise.all([
          readDashboardById(projectRoot, id),
          fs.stat(path.join(directory, entry.name)),
        ]);
        const definition = snapshot.dashboard as DashboardSchema;
        return { id, title: definition.title, updatedAt: info.mtime.toISOString() };
      }),
  );

  if (!dashboards.some((dashboard) => dashboard.id === legacyDashboardId)) {
    const info = await fs.stat(legacyDashboardPath(projectRoot));
    const snapshot = await readDashboardById(projectRoot, legacyDashboardId);
    dashboards.push({
      id: legacyDashboardId,
      title: (snapshot.dashboard as DashboardSchema).title,
      updatedAt: info.mtime.toISOString(),
    });
  }

  return dashboards.toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
};

const createDashboard = async (
  projectRoot: string,
  preferredId: string,
  dashboard: DashboardSchema,
) => {
  const directory = dashboardDirectory(projectRoot);
  await fs.mkdir(directory, { recursive: true });
  const baseId = dashboardIdSchema.parse(preferredId);
  let id = baseId;
  let suffix = 2;
  while (true) {
    if (id === legacyDashboardId) {
      try {
        await fs.access(legacyDashboardPath(projectRoot));
        id = `${baseId}-${suffix++}`;
        continue;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }

    try {
      await fs.writeFile(
        dashboardPath(projectRoot, id),
        `${JSON.stringify(dashboard, null, 2)}\n`,
        { encoding: "utf8", flag: "wx" },
      );
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      id = `${baseId}-${suffix++}`;
    }
  }
  const info = await fs.stat(dashboardPath(projectRoot, id));
  return { id, title: dashboard.title, updatedAt: info.mtime.toISOString() };
};

const registerPythonLogic = async (
  projectRoot: string,
  id: string,
  { dashboard, expectedVersion, logic }: PythonLogicRegistration,
) => {
  // Local files cannot provide a multi-file transaction; compensate if updating the definition fails.
  await createPython(projectRoot, id, logic.path, logic.source);

  try {
    await writeDashboard(projectRoot, id, dashboard, expectedVersion);
  } catch (error) {
    await deletePython(projectRoot, id, logic.path);
    throw error;
  }
};

const listAssets = async (projectRoot: string, id: string): Promise<DashboardAssetCatalog> => {
  await readDashboardById(projectRoot, id);
  const dashboardRoot = path.join(projectRoot, "dashboard");
  const [csv, python] = await Promise.all([
    listFiles(dashboardRoot, `data/${id}/**/*.csv`),
    listFiles(dashboardRoot, "logic/**/*.py"),
  ]);

  return { csv, python };
};

export const createFilesystemDashboardRepository = (projectRoot: string): DashboardRepository => ({
  listDashboards: () => listDashboards(projectRoot),
  createDashboard: (preferredId, dashboard) => createDashboard(projectRoot, preferredId, dashboard),
  listAssets: (id) => listAssets(projectRoot, id),
  readDashboard: (id) => readDashboardById(projectRoot, id),
  writeDashboard: (id, dashboard, expectedVersion) =>
    writeDashboard(projectRoot, id, dashboard, expectedVersion),
  readInput: (id, sourcePath) => readInput(projectRoot, id, sourcePath),
  createInput: (id, fileName, source) => createInput(projectRoot, id, fileName, source),
  readPython: (id, sourcePath) => readPython(projectRoot, id, sourcePath),
  writePython: (id, sourcePath, source) => writePython(projectRoot, id, sourcePath, source),
  createPython: (id, sourcePath, source) => createPython(projectRoot, id, sourcePath, source),
  deletePython: (id, sourcePath) => deletePython(projectRoot, id, sourcePath),
  registerPythonLogicAtomically: (id, registration) =>
    registerPythonLogic(projectRoot, id, registration),
});
