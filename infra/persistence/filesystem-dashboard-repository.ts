import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { DashboardAssetCatalog } from "@dashlet/shared/api";
import type { DashboardSchema } from "@dashlet/shared/dashboard";
import { DashboardRevisionConflict } from "@dashlet/server/models/dashboard-revision-conflict";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

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

const readDashboard = async (projectRoot: string) => {
  const source = await fs.readFile(path.join(projectRoot, "dashboard/dashboard.json"), "utf8");

  return {
    dashboard: JSON.parse(source) as unknown,
    version: createHash("sha256").update(source).digest("hex"),
  };
};

const writeDashboard = async (
  projectRoot: string,
  dashboard: DashboardSchema,
  expectedVersion: string,
) => {
  const destination = path.join(projectRoot, "dashboard", "dashboard.json");
  const serialized = `${JSON.stringify(dashboard, null, 2)}\n`;
  const current = await fs.readFile(destination, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });

  const currentVersion = current && createHash("sha256").update(current).digest("hex");
  if (currentVersion !== expectedVersion) throw new DashboardRevisionConflict();
  if (current === serialized) return;

  await fs.writeFile(destination, serialized, "utf8");
};

const registerPythonLogic = async (
  projectRoot: string,
  {
    dashboard,
    expectedVersion,
    logic,
  }: Parameters<DashboardRepository["registerPythonLogicAtomically"]>[0],
) => {
  // Local files cannot provide a multi-file transaction; compensate if updating the definition fails.
  await createPython(projectRoot, logic.path, logic.source);

  try {
    await writeDashboard(projectRoot, dashboard, expectedVersion);
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
  listAssets: () => listAssets(projectRoot),
  readDashboard: () => readDashboard(projectRoot),
  writeDashboard: (dashboard, expectedVersion) =>
    writeDashboard(projectRoot, dashboard, expectedVersion),
  readInput: (sourcePath) => readInput(projectRoot, sourcePath),
  readPython: (sourcePath) => readPython(projectRoot, sourcePath),
  writePython: (sourcePath, source) => writePython(projectRoot, sourcePath, source),
  createPython: (sourcePath, source) => createPython(projectRoot, sourcePath, source),
  deletePython: (sourcePath) => deletePython(projectRoot, sourcePath),
  registerPythonLogicAtomically: (registration) => registerPythonLogic(projectRoot, registration),
});
