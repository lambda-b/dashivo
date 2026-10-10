import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { useWorkspace } from "@/storage/context";
import { useDashboardId } from "@/app/context/useDashboard";
import type { DashboardDefinitionChange, DashboardSchema } from "@shared/dashboard";
import { messages } from "@/messages";

export const useSaveDashboard = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const { storage, queryKey: workspaceKey, scope } = useWorkspace();
  const queryKey = workspaceKey(...dashboardQueryKey, dashboardId);

  return useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.dashboard.saveFailed },
    mutationFn: (
      change:
        | DashboardDefinitionChange
        | ((dashboard: DashboardSchema) => DashboardDefinitionChange),
    ) => {
      if (typeof change !== "function") return storage.saveDashboard(dashboardId, change);

      const dashboard = client.getQueryData<DashboardSchema>(queryKey);
      if (!dashboard) throw new Error("Dashboard is not loaded.");

      return storage.saveDashboard(dashboardId, change(dashboard));
    },
    scope: { id: `dashboard-save:${scope}:${dashboardId}` },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
      void client.invalidateQueries({ queryKey: workspaceKey("dashboards") });
    },
  });
};
