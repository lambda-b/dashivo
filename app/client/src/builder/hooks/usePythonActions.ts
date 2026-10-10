import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { useDashboardId, useSavedDashboard } from "@/app/context/useDashboard";
import { useWorkspace } from "@/storage/context";
import { analysisPort, loadInputs } from "@/ports/analysis";
import { messages } from "@/messages";
import type { ParameterValue } from "@shared/dashboard";

export const usePythonActions = (path: string) => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const dashboard = useSavedDashboard();
  const { storage, queryKey } = useWorkspace();

  const save = useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.logic.saveFailed },
    mutationFn: (source: string) => storage.savePythonSource(dashboardId, path, source),
    onSuccess: (_, source) => {
      client.setQueryData(queryKey("python-source", dashboardId, path), source);
      void client.invalidateQueries({ queryKey: queryKey("dashboards") });
      void client.invalidateQueries({ queryKey: queryKey("analysis") });
    },
  });

  const run = useMutation({
    meta: { errorMessage: false },
    mutationFn: async ({
      source,
      params,
    }: {
      source: string;
      params: Record<string, ParameterValue>;
    }) =>
      analysisPort.preview({
        analysisSource: source,
        params,
        sources: await loadInputs(dashboardId, dashboard.analysis, storage),
      }),
  });

  return {
    saveSource: (source: string) => save.mutate(source),
    preview: (source: string, params: Record<string, ParameterValue>) =>
      run.mutate({ source, params }),
    isSaving: save.isPending,
    isPreviewing: run.isPending,
    output: run.data,
    error: run.error,
  };
};
