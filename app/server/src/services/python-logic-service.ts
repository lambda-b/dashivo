import {
  dashboardSchema,
  pythonLogicCreateSchema,
  pythonSourcePathSchema,
  type PythonLogicCreate,
} from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export const createPythonLogicService = (repository: DashboardRepository) => ({
  create: async (dashboardId: string, definition: PythonLogicCreate) => {
    const { id, path, source } = pythonLogicCreateSchema.parse(definition);
    const snapshot = await repository.readDashboard(dashboardId);
    const current = dashboardSchema.parse(snapshot.dashboard);
    const next = dashboardSchema.parse({
      ...current,
      analysis: {
        ...current.analysis,
        logic: [...current.analysis.logic, { id, path, type: "python" }],
      },
    });

    await repository.registerPythonLogicAtomically(dashboardId, {
      dashboard: next,
      expectedVersion: snapshot.version,
      logic: { id, path, source },
    });

    return next;
  },
  read: (_dashboardId: string, path: string) =>
    repository.readPython(pythonSourcePathSchema.parse(path)),
  write: (_dashboardId: string, path: string, source: string) =>
    repository.writePython(pythonSourcePathSchema.parse(path), source),
});

export type PythonLogicService = ReturnType<typeof createPythonLogicService>;
