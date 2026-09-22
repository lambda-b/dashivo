import fs from "node:fs/promises";
import path from "node:path";
import { format } from "oxfmt";
import {
  dashboardChangeSchema,
  dashboardSchema,
  type DashboardSchema,
} from "../../src/schema/dashboard.ts";
import { withDashboardOperation } from "./dashboard-operation.ts";
import type { DashboardAssetCatalog, DashboardRepository } from "./dashboard-repository.ts";

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

const listDashboardFiles = async (dashboardRoot: string, pattern: string) => {
  const files: string[] = [];

  for await (const file of fs.glob(pattern, { cwd: dashboardRoot })) files.push(file);

  return files.toSorted();
};

export const readPythonSource = (projectRoot: string, sourcePath: string) =>
  fs.readFile(resolvePythonPath(projectRoot, sourcePath), "utf8");

export const writePythonSource = async (
  projectRoot: string,
  sourcePath: string,
  source: string,
) => {
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, "utf8");
};

export const createPythonSource = async (
  projectRoot: string,
  sourcePath: string,
  source: string,
) => {
  const destination = resolvePythonPath(projectRoot, sourcePath);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, source, { encoding: "utf8", flag: "wx" });
};

export const readDashboardFile = async (projectRoot: string) =>
  dashboardSchema.parse(
    JSON.parse(await fs.readFile(path.join(projectRoot, "dashboard/dashboard.json"), "utf8")),
  );

export const writeDashboardFile = async (
  projectRoot: string,
  source: unknown,
): Promise<DashboardSchema> => {
  const dashboard = dashboardSchema.parse(source);
  const destination = path.join(projectRoot, "dashboard", "dashboard.json");
  const currentSource = await fs
    .readFile(destination, "utf8")
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });

  if (currentSource) {
    const current = dashboardSchema.safeParse(JSON.parse(currentSource));

    if (current.success && JSON.stringify(current.data) === JSON.stringify(dashboard)) {
      return dashboard;
    }
  }

  const formatted = await format(destination, JSON.stringify(dashboard));

  await fs.writeFile(destination, formatted.code, "utf8");

  return dashboard;
};

export const updateDashboardFile = (projectRoot: string, source: unknown) => {
  const change = dashboardChangeSchema.parse(source);

  return withDashboardOperation(async () => {
    const current = await readDashboardFile(projectRoot);

    if ("settings" in change) {
      return writeDashboardFile(projectRoot, { ...change.settings, analysis: current.analysis });
    }

    if ("analysis" in change) {
      return writeDashboardFile(projectRoot, { ...current, analysis: change.analysis });
    }

    const { id, path: sourcePath, source: pythonSource } = change.logic;
    const next = dashboardSchema.parse({
      ...current,
      analysis: {
        ...current.analysis,
        logic: [...current.analysis.logic, { id, path: sourcePath, type: "python" }],
      },
    });

    await createPythonSource(projectRoot, sourcePath, pythonSource);

    try {
      return await writeDashboardFile(projectRoot, next);
    } catch (error) {
      await fs.unlink(resolvePythonPath(projectRoot, sourcePath));
      throw error;
    }
  });
};

const listDashboardAssets = async (projectRoot: string): Promise<DashboardAssetCatalog> => {
  const dashboardRoot = path.join(projectRoot, "dashboard");
  const [csv, python] = await Promise.all([
    listDashboardFiles(dashboardRoot, "data/**/*.csv"),
    listDashboardFiles(dashboardRoot, "logic/**/*.py"),
  ]);

  return { csv, python };
};

export const createFilesystemDashboardRepository = (projectRoot: string): DashboardRepository => ({
  listAssets: () => listDashboardAssets(projectRoot),
  readDashboard: () => readDashboardFile(projectRoot),
  readPython: (sourcePath) => readPythonSource(projectRoot, sourcePath),
  updateDashboard: (change) => updateDashboardFile(projectRoot, change),
  writePython: (sourcePath, source) =>
    withDashboardOperation(() => writePythonSource(projectRoot, sourcePath, source)),
});
