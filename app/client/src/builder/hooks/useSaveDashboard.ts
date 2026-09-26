import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { saveDashboard } from "@/builder/api/dashboard";

export const useSaveDashboard = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: saveDashboard,
    scope: { id: "dashboard-save" },
    onMutate: () => client.cancelQueries({ queryKey: dashboardQueryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(dashboardQueryKey, dashboard);
    },
  });
};
