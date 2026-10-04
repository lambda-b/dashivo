import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { useDashboardId, useSavedDashboard } from "@/app/context/useDashboard";
import { savePythonSource } from "@/api/python";
import { analysisPort, loadInputs } from "@/ports/analysis";
import { messages } from "@/messages";
import type { ParameterValue } from "@shared/dashboard";

export const usePythonActions = (path: string) => {
  const client = useQueryClient();
  const dashboardId = useDashboardId();
  const dashboard = useSavedDashboard();

  const save = useMutation({
    meta: { errorMessage: messages.logic.saveFailed },
    mutationFn: (source: string) => savePythonSource(dashboardId, path, source),
    onSuccess: (_, source) => {
      client.setQueryData(["python-source", dashboardId, path], source);
      void client.invalidateQueries({ queryKey: ["analysis"] });
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
        sources: await loadInputs(dashboardId, dashboard.analysis),
      }),
  });

  return {
    saveSource: (source: string) => save.mutate(source),
    preview: (source: string, params: Record<string, ParameterValue>) =>
      run.mutate({ source, params }),
    isSaving: save.isPending,
    isPending: save.isPending || run.isPending,
    isPreviewing: run.isPending,
    output: run.data?.output,
    error: run.error,
  };
};
