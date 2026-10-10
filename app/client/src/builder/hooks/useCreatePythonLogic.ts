import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { useWorkspace } from "@/storage/context";
import { useDashboardId } from "@/app/context/useDashboard";
import type { PythonLogicCreate } from "@shared/dashboard";
import { messages } from "@/messages";

export const useCreatePythonLogic = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const { storage, queryKey: workspaceKey, scope } = useWorkspace();
  const queryKey = workspaceKey(...dashboardQueryKey, dashboardId);

  return useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.logic.createFailed },
    mutationFn: (definition: PythonLogicCreate) =>
      storage.createPythonLogic(dashboardId, definition),
    scope: { id: `dashboard-save:${scope}:${dashboardId}` },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
      void client.invalidateQueries({ queryKey: workspaceKey("dashboards") });
    },
  });
};
