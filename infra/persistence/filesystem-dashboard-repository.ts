import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { DashboardAssetCatalog } from "@dashlet/shared/api";
import type { DashboardSchema } from "@dashlet/shared/dashboard";
import { DashboardRevisionConflict } from "@dashlet/server/models/dashboard-revision-conflict";
import { DashboardNotFound } from "@dashlet/server/models/dashboard-not-found";
import type {
  DashboardRepository,
  PythonLogicRegistration,
} from "@dashlet/server/models/dashboard-repository";

const dashboardDirectory = (projectRoot: string) =>
  path.join(projectRoot, "dashboard", "definitions");
const legacyDashboardId = "sales-overview";
const legacyDashboardPath = (projectRoot: string) =>
  path.join(projectRoot, "dashboard", "dashboard.json");
const dashboardPath = (projectRoot: string, id: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Invalid dashboard id");
  return path.join(dashboardDirectory(projectRoot), `${id}.json`);
};

const emptyDashboard = (title: string): DashboardSchema => ({
  title,
  description: "",
  analysis: { inputs: [], logic: [] },
  controls: [],
  tabs: [{ id: "overview", label: "概要", contents: [] }],
});

const dashboardIdFromTitle = (title: string) =>
  title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "dashboard";

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

const readPython = (projectRoot: string, sourcePath: string) =>
  fs.readFile(resolvePythonPath(projectRoot, sourcePath), "utf8");

const writePython = async (projectRoot: string, sourcePath: string, source: string) => {
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

const createPython = async (projectRoot: string, sourcePath: string, source: string) => {
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" });
};

const deletePython = (projectRoot: string, sourcePath: string) =>
  fs.unlink(resolvePythonPath(projectRoot, sourcePath));

const readInput = (projectRoot: string, sourcePath: string) =>
  fs.readFile(resolveInputPath(projectRoot, sourcePath), "utf8");

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

const createDashboard = async (projectRoot: string, title: string) => {
  const directory = dashboardDirectory(projectRoot);
  await fs.mkdir(directory, { recursive: true });
  const baseId = dashboardIdFromTitle(title);
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
        `${JSON.stringify(emptyDashboard(title), null, 2)}\n`,
        { encoding: "utf8", flag: "wx" },
      );
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      id = `${baseId}-${suffix++}`;
    }
  }
  const info = await fs.stat(dashboardPath(projectRoot, id));
  return { id, title, updatedAt: info.mtime.toISOString() };
};

const registerPythonLogic = async (
  projectRoot: string,
  id: string,
  { dashboard, expectedVersion, logic }: PythonLogicRegistration,
) => {
  // Local files cannot provide a multi-file transaction; compensate if updating the definition fails.
  await createPython(projectRoot, logic.path, logic.source);

  try {
    await writeDashboard(projectRoot, id, dashboard, expectedVersion);
  } catch (error) {
    await deletePython(projectRoot, logic.path);
    throw error;
  }
};

const listAssets = async (projectRoot: string): Promise<DashboardAssetCatalog> => {
  const dashboardRoot = path.join(projectRoot, "dashboard");
  const [csv, python] = await Promise.all([
    listFiles(dashboardRoot, "data/**/*.csv"),
    listFiles(dashboardRoot, "logic/**/*.py"),
  ]);

  return { csv, python };
};

export const createFilesystemDashboardRepository = (projectRoot: string): DashboardRepository => ({
  listDashboards: () => listDashboards(projectRoot),
  createDashboard: (title) => createDashboard(projectRoot, title),
  listAssets: () => listAssets(projectRoot),
  readDashboard: (id) => readDashboardById(projectRoot, id),
  writeDashboard: (id, dashboard, expectedVersion) =>
    writeDashboard(projectRoot, id, dashboard, expectedVersion),
  readInput: (sourcePath) => readInput(projectRoot, sourcePath),
  readPython: (sourcePath) => readPython(projectRoot, sourcePath),
  writePython: (sourcePath, source) => writePython(projectRoot, sourcePath, source),
  createPython: (sourcePath, source) => createPython(projectRoot, sourcePath, source),
  deletePython: (sourcePath) => deletePython(projectRoot, sourcePath),
  registerPythonLogicAtomically: (id, registration) =>
    registerPythonLogic(projectRoot, id, registration),
});
