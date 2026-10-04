import { useSaveDashboard } from "@/builder/hooks/useSaveDashboard";
import { useRegisterCsv } from "@/builder/hooks/useRegisterCsv";

export const useDefinitionActions = () => {
  const save = useSaveDashboard();
  const csv = useRegisterCsv();

  const updateInput = (index: number, change: { id?: string; path?: string }) =>
    save.mutate((dashboard) => ({
      analysis: {
        ...dashboard.analysis,
        inputs: dashboard.analysis.inputs.map((input, i) =>
          i === index ? { ...input, ...change } : input,
        ),
      },
    }));

  const removeInput = (index: number) =>
    save.mutate((dashboard) => ({
      analysis: {
        ...dashboard.analysis,
        inputs: dashboard.analysis.inputs.filter((_, i) => i !== index),
      },
    }));

  const removeLogic = (id: string) =>
    save.mutate((dashboard) => ({
      analysis: {
        ...dashboard.analysis,
        logic: dashboard.analysis.logic.filter((logic) => logic.id !== id),
      },
    }));

  return {
    updateInput,
    removeInput,
    removeLogic,
    registerCsv: (file: File) => csv.mutate(file),
    isPending: save.isPending || csv.isPending,
    isRegisteringCsv: csv.isPending,
  };
};
