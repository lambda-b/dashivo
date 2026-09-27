import {
  dashboardIdSchema,
  dashboardSchema,
  pythonLogicCreateSchema,
  pythonSourcePathSchema,
  type PythonLogicCreate,
} from "@dashlet/shared-schema/dashboard";
import type {
  DashboardDefinitionRepository,
  PythonLogicRepository,
} from "@dashlet/server/models/dashboard-repository";

export const createPythonLogicService = (
  repository: DashboardDefinitionRepository & PythonLogicRepository,
) => ({
  create: async (dashboardId: string, definition: PythonLogicCreate) => {
    const validDashboardId = dashboardIdSchema.parse(dashboardId);
    const { id, path, source } = pythonLogicCreateSchema.parse(definition);
    const snapshot = await repository.readDashboard(validDashboardId);
    const current = dashboardSchema.parse(snapshot.dashboard);
    const next = dashboardSchema.parse({
      ...current,
      analysis: {
        ...current.analysis,
        logic: [...current.analysis.logic, { id, path, type: "python" }],
      },
    });

    await repository.registerPythonLogicAtomically(validDashboardId, {
      dashboard: next,
      expectedVersion: snapshot.version,
      logic: { id, path, source },
    });

    return next;
  },
  read: (dashboardId: string, path: string) =>
    repository.readPython(dashboardIdSchema.parse(dashboardId), pythonSourcePathSchema.parse(path)),
  write: (dashboardId: string, path: string, source: string) =>
    repository.writePython(
      dashboardIdSchema.parse(dashboardId),
      pythonSourcePathSchema.parse(path),
      source,
    ),
});

export type PythonLogicService = ReturnType<typeof createPythonLogicService>;
