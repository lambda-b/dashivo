import {
  dashboardDefinitionChangeSchema,
  dashboardIdSchema,
  dashboardSchema,
  createEmptyDashboard,
  type DashboardDefinitionChange,
  type DashboardSchema,
} from "@dashivo/shared-schema/dashboard";
import type { DashboardDefinitionRepository } from "@dashivo/server/models/dashboard-repository";
import {
  dashboardRegistrationSchema,
  type DashboardRegistration,
} from "@dashivo/shared-schema/api";

export const createDashboardDefinitionService = (repository: DashboardDefinitionRepository) => {
  const list = () => repository.listDashboards();
  const create = (title: string) => {
    const preferredId =
      title
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "dashboard";

    return repository.createDashboard(preferredId, createEmptyDashboard(title));
  };
  const read = async (id: string) => {
    const snapshot = await repository.readDashboard(dashboardIdSchema.parse(id));

    return dashboardSchema.parse(snapshot.dashboard);
  };

  const write = async (id: string, dashboard: DashboardSchema, expectedVersion: string) => {
    const dashboardId = dashboardIdSchema.parse(id);
    const validDashboard = dashboardSchema.parse(dashboard);

    await repository.writeDashboard(dashboardId, validDashboard, expectedVersion);

    return validDashboard;
  };

  const update = async (id: string, change: DashboardDefinitionChange) => {
    const dashboardId = dashboardIdSchema.parse(id);
    const validChange = dashboardDefinitionChangeSchema.parse(change);
    const snapshot = await repository.readDashboard(dashboardId);
    const current = dashboardSchema.parse(snapshot.dashboard);

    if ("settings" in validChange) {
      return write(
        dashboardId,
        { ...validChange.settings, analysis: current.analysis },
        snapshot.version,
      );
    }

    return write(dashboardId, { ...current, analysis: validChange.analysis }, snapshot.version);
  };

  const register = async (registration: DashboardRegistration) => {
    const { revisionId, dashboard, sources } = dashboardRegistrationSchema.parse(registration);
    // Repositoryは認証済みユーザーに紐づく。同じユーザー・版の再送は同じIDへ収束する。
    const id = `draft-${revisionId}`;
    const sourcePath = (path: string) => path.replace(/^(data|logic)\//, `$1/${id}/`);
    const next = dashboardSchema.parse({
      ...dashboard,
      analysis: {
        inputs: dashboard.analysis.inputs.map((input) => ({
          ...input,
          path: sourcePath(input.path),
        })),
        logic: dashboard.analysis.logic.map((logic) => ({
          ...logic,
          path: sourcePath(logic.path),
        })),
      },
    });

    return repository.registerDashboardAtomically(
      id,
      next,
      Object.fromEntries(
        Object.entries(sources).map(([path, source]) => [sourcePath(path), source]),
      ),
    );
  };

  return { list, create, read, update, register };
};

export type DashboardDefinitionService = ReturnType<typeof createDashboardDefinitionService>;
