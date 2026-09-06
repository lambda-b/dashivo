import { useMemo } from "react";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

const createControlKey = (dashboard: DashboardSchema) => {
  const keys = new Set(dashboard.controls.map((control) => control.key));
  let index = dashboard.controls.length + 1;
  while (keys.has(`control_${index}`)) index += 1;
  return `control_${index}`;
};

export const useParameterActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editControls = (controls: DashboardSchema["controls"]) =>
      editDashboard({ ...draft, controls });

    return {
      addRadio: () => {
        const key = createControlKey(draft);
        editControls([
          ...draft.controls,
          {
            type: "radio",
            key,
            label: "新しい条件",
            defaultValue: "option-1",
            options: [{ label: "選択肢1", value: "option-1" }],
          },
        ]);
      },
      update: (index: number, control: ControlDefinition) =>
        editControls(
          draft.controls.map((current, controlIndex) =>
            controlIndex === index ? control : current,
          ),
        ),
      remove: (index: number) =>
        editControls(draft.controls.filter((_, controlIndex) => controlIndex !== index)),
    };
  }, [draft, editDashboard]);
