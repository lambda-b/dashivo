import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { dashboardQueryKey, useDashboardId } from "@/app/context/useDashboard";
import { ApiError } from "@/api/request";
import { useWorkspace } from "@/storage/context";
import { createUniqueIndexedName } from "@dashivo/shared-utils/createUniqueIndexedName";
import type { DashboardSchema } from "@shared/dashboard";
import { messages } from "@/messages";

export const useRegisterCsv = () => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const { storage, queryKey: workspaceKey, scope } = useWorkspace();
  const queryKey = workspaceKey(...dashboardQueryKey, dashboardId);

  return useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.csv.registerFailed },
    scope: { id: `dashboard-save:${scope}:${dashboardId}` },
    retry: false,
    onMutate: () => client.cancelQueries({ queryKey }),
    mutationFn: async (file: File) => {
      // 同じscopeの先行保存が完了した後の定義を使う。
      const dashboard = client.getQueryData<DashboardSchema>(queryKey);
      if (!dashboard) throw new Error("Dashboard is not loaded.");

      const path = await storage.uploadInputSource(dashboardId, file);
      const id = createUniqueIndexedName(
        dashboard.analysis.inputs.map((input) => input.id),
        "input-",
      );

      try {
        return await storage.saveDashboard(dashboardId, {
          analysis: {
            ...dashboard.analysis,
            inputs: [...dashboard.analysis.inputs, { id, type: "csv", path }],
          },
        });
      } catch (cause) {
        throw new ApiError(
          messages.csv.definitionSaveFailed,
          cause instanceof ApiError ? cause.status : undefined,
          { cause },
        );
      }
    },
    onSuccess: (dashboard) => {
      client.setQueryData(queryKey, dashboard);
      void client.invalidateQueries({ queryKey: workspaceKey("dashboards") });
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: workspaceKey("dashboard-assets", dashboardId) }),
  });
};
