import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashlet/shared-lib/query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { saveDashboard } from "@/api/dashboard";
import { useDashboardId } from "@/app/context/useDashboard";
import type { DashboardDefinitionChange, DashboardSchema } from "@shared/dashboard";
import { messages } from "@/messages";

export const useSaveDashboard = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const queryKey = [...dashboardQueryKey, dashboardId] as const;

  return useMutation({
    meta: { errorMessage: messages.dashboard.saveFailed },
    mutationFn: (
      change:
        | DashboardDefinitionChange
        | ((dashboard: DashboardSchema) => DashboardDefinitionChange),
    ) => {
      if (typeof change !== "function") return saveDashboard(dashboardId, change);

      const dashboard = client.getQueryData<DashboardSchema>(queryKey);
      if (!dashboard) throw new Error("Dashboard is not loaded.");

      return saveDashboard(dashboardId, change(dashboard));
    },
    scope: { id: `dashboard-save:${dashboardId}` },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
      void client.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
};
