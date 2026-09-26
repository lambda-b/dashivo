import {
  dashboardSchema,
  pythonLogicCreateSchema,
  pythonSourcePathSchema,
  type PythonLogicCreate,
} from "@dashlet/shared/dashboard";
import type { DashboardRepository } from "@dashlet/server/models/dashboard-repository";

export const createPythonLogicService = (repository: DashboardRepository) => ({
  create: async (definition: PythonLogicCreate) => {
    const { id, path, source } = pythonLogicCreateSchema.parse(definition);
    const snapshot = await repository.readDashboard();
    const current = dashboardSchema.parse(snapshot.dashboard);
    const next = dashboardSchema.parse({
      ...current,
      analysis: {
        ...current.analysis,
        logic: [...current.analysis.logic, { id, path, type: "python" }],
      },
    });

    await repository.registerPythonLogicAtomically({
      dashboard: next,
      expectedVersion: snapshot.version,
      logic: { id, path, source },
    });

    return next;
  },
  read: (path: string) => repository.readPython(pythonSourcePathSchema.parse(path)),
  write: (path: string, source: string) =>
    repository.writePython(pythonSourcePathSchema.parse(path), source),
});

export type PythonLogicService = ReturnType<typeof createPythonLogicService>;
