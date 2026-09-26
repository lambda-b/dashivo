import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { createPythonLogic } from "@/builder/api/python";

export const useCreatePythonLogic = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: createPythonLogic,
    scope: { id: "dashboard-save" },
    onMutate: () => client.cancelQueries({ queryKey: dashboardQueryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(dashboardQueryKey, dashboard);
    },
  });
};
