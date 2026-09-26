import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { saveDashboard } from "@/builder/api/dashboard";
import { useDashboardId } from "@/app/context/useDashboard";
import type { DashboardDefinitionChange } from "@shared/dashboard";

export const useSaveDashboard = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const queryKey = [...dashboardQueryKey, dashboardId] as const;

  return useMutation({
    mutationFn: (change: DashboardDefinitionChange) => saveDashboard(dashboardId, change),
    scope: { id: `dashboard-save:${dashboardId}` },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
      void client.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
};
