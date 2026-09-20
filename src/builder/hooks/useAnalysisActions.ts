import { useMemo } from "react";
import type {
  AnalysisLogicDefinition,
  ContentDefinition,
  DashboardSchema,
} from "@/schema/dashboard";
import { createUniqueIndexedName } from "@/utils/createUniqueIndexedName";

export const useAnalysisActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editAnalysis = (analysis: DashboardSchema["analysis"]) =>
      editDashboard({ ...draft, analysis });

    return {
      addInput: (path: string) =>
        editAnalysis({
          ...draft.analysis,
          inputs: [
            ...draft.analysis.inputs,
            {
              id: createUniqueIndexedName(
                draft.analysis.inputs.map((input) => input.id),
                "input-",
              ),
              type: "csv",
              path,
            },
          ],
        }),
      updateInput: (index: number, input: DashboardSchema["analysis"]["inputs"][number]) => {
        editAnalysis({
          ...draft.analysis,
          inputs: draft.analysis.inputs.map((current, inputIndex) =>
            inputIndex === index ? input : current,
          ),
        });
      },
      removeInput: (index: number) =>
        editAnalysis({
          ...draft.analysis,
          inputs: draft.analysis.inputs.filter((_, inputIndex) => inputIndex !== index),
        }),
      addLogic: (path: string, content: ContentDefinition) => {
        const id = createUniqueIndexedName(
          draft.analysis.logic.map((logic) => logic.id),
          "logic-",
        );
        const definition: AnalysisLogicDefinition = {
          id,
          type: "python",
          path,
          content,
        };
        editAnalysis({ ...draft.analysis, logic: [...draft.analysis.logic, definition] });
        return id;
      },
      updateLogic: (index: number, logic: AnalysisLogicDefinition) => {
        const previousId = draft.analysis.logic[index]?.id;
        editDashboard({
          ...draft,
          analysis: {
            ...draft.analysis,
            logic: draft.analysis.logic.map((current, logicIndex) =>
              logicIndex === index ? logic : current,
            ),
          },
          tabs: draft.tabs.map((tab) => ({
            ...tab,
            contents: tab.contents.map((content) =>
              content.logic === previousId ? { ...content, logic: logic.id } : content,
            ),
          })),
        });
      },
      removeLogic: (index: number) =>
        editAnalysis({
          ...draft.analysis,
          logic: draft.analysis.logic.filter((_, logicIndex) => logicIndex !== index),
        }),
    };
  }, [draft, editDashboard]);
