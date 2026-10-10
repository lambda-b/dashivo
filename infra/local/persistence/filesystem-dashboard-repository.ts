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
const dashboardPath = (projectRoot: string, id: string) => {
  const dashboardId = dashboardIdSchema.parse(id);
  return path.join(dashboardDirectory(projectRoot), `${dashboardId}.json`);
};

const registeredRoot = (projectRoot: string, id: string) =>
  path.join(projectRoot, "dashboard", "registrations", dashboardIdSchema.parse(id));

const locateDashboard = async (projectRoot: string, id: string) => {
  const sourceRoot = registeredRoot(projectRoot, id);
  const filePath = path.join(sourceRoot, "dashboard.json");
  try {
    await fs.access(filePath);
    return { sourceRoot, filePath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      sourceRoot: path.join(projectRoot, "dashboard"),
      filePath: dashboardPath(projectRoot, id),
    };
  }
};

const resolvePythonPath = (sourceRoot: string, sourcePath: string) => {
  const logicRoot = path.join(sourceRoot, "logic");
  const destination = path.resolve(sourceRoot, sourcePath);
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

const resolveInputPath = (sourceRoot: string, sourcePath: string) => {
  const dataRoot = path.join(sourceRoot, "data");
  const destination = path.resolve(sourceRoot, sourcePath);
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
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  return fs.readFile(resolvePythonPath(sourceRoot, sourcePath), "utf8");
};

const writePython = async (projectRoot: string, id: string, sourcePath: string, source: string) => {
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  const destination = resolvePythonPath(sourceRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

const createPython = async (
  projectRoot: string,
  id: string,
  sourcePath: string,
  source: string,
) => {
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  const destination = resolvePythonPath(sourceRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" });
};

const deletePython = async (projectRoot: string, id: string, sourcePath: string) => {
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  await fs.unlink(resolvePythonPath(sourceRoot, sourcePath));
};

const readInput = async (projectRoot: string, id: string, sourcePath: string) => {
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  if (!sourcePath.startsWith(`data/${id}/`)) {
    throw new Error("Input source must belong to the requested dashboard");
  }
  return fs.readFile(resolveInputPath(sourceRoot, sourcePath), "utf8");
};

const createInput = async (projectRoot: string, id: string, fileName: string, source: string) => {
  const { sourceRoot } = await readDashboardById(projectRoot, id);
  const sourcePath = `data/${id}/${fileName}`;
  const destination = resolveInputPath(sourceRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new InputSourceConflict();
    throw error;
  });

  return sourcePath;
};

const readDashboardById = async (projectRoot: string, id: string) => {
  const { filePath, sourceRoot } = await locateDashboard(projectRoot, id);
  const source = await fs.readFile(filePath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    throw new DashboardNotFound(id);
  });

  return {
    filePath,
    sourceRoot,
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
  const { filePath: destination } = await locateDashboard(projectRoot, id);
  const serialized = `${JSON.stringify(dashboard, null, 2)}\n`;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const current = await fs.readFile(destination, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
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
  const registered = await listFiles(
    path.join(projectRoot, "dashboard"),
    "registrations/draft-*/dashboard.json",
  );
  const ids = [
    ...entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.basename(entry.name, ".json")),
    ...registered.map((file) => path.basename(path.dirname(file))),
  ];
  const dashboards = await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const snapshot = await readDashboardById(projectRoot, id);
      const info = await fs.stat(snapshot.filePath);
      const definition = snapshot.dashboard as DashboardSchema;
      return { id, title: definition.title, updatedAt: info.mtime.toISOString() };
    }),
  );

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
    try {
      await fs.writeFile(
        (await locateDashboard(projectRoot, id)).filePath,
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
  const { sourceRoot: dashboardRoot } = await readDashboardById(projectRoot, id);
  const [csv, python] = await Promise.all([
    listFiles(dashboardRoot, `data/${id}/**/*.csv`),
    listFiles(dashboardRoot, "logic/**/*.py"),
  ]);

  return { csv, python };
};

const registerDashboard = async (
  projectRoot: string,
  id: string,
  dashboard: DashboardSchema,
  sources: Record<string, string>,
) => {
  const destination = registeredRoot(projectRoot, id);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const staging = await fs.mkdtemp(path.join(path.dirname(destination), ".pending-"));
  try {
    for (const [sourcePath, source] of Object.entries(sources)) {
      const filePath = sourcePath.startsWith("data/")
        ? resolveInputPath(staging, sourcePath)
        : resolvePythonPath(staging, sourcePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, source, "utf8");
    }
    await fs.writeFile(path.join(staging, "dashboard.json"), JSON.stringify(dashboard), "utf8");
    // 全ファイルが揃ったディレクトリを一度に公開する。同時登録は先に成功した版を返す。
    await fs.rename(staging, destination).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST" && error.code !== "ENOTEMPTY") throw error;
    });
    const snapshot = await readDashboardById(projectRoot, id);
    const info = await fs.stat(snapshot.filePath);
    return {
      id,
      title: (snapshot.dashboard as DashboardSchema).title,
      updatedAt: info.mtime.toISOString(),
    };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
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
  registerDashboardAtomically: (id, dashboard, sources) =>
    registerDashboard(projectRoot, id, dashboard, sources),
});
