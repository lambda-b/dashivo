import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { createPythonLogic } from "@/api/python";
import { useDashboardId } from "@/app/context/useDashboard";
import type { PythonLogicCreate } from "@shared/dashboard";
import { messages } from "@/messages";

export const useCreatePythonLogic = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const queryKey = [...dashboardQueryKey, dashboardId] as const;

  return useMutation({
    meta: { errorMessage: messages.logic.createFailed },
    mutationFn: (definition: PythonLogicCreate) => createPythonLogic(dashboardId, definition),
    scope: { id: `dashboard-save:${dashboardId}` },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
    },
  });
};
