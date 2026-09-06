import { useMemo } from "react";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

const createParameterKey = (dashboard: DashboardSchema) => {
  const keys = new Set(dashboard.controls.map((control) => control.key));
  let index = dashboard.controls.length + 1;
  while (keys.has(`control_${index}`)) index += 1;
  return `control_${index}`;
};

const createControl = (type: ControlDefinition["type"], key: string): ControlDefinition => {
  switch (type) {
    case "radio":
      return {
        type,
        key,
        displayName: "新しい条件",
        defaultValue: "option-1",
        options: [{ label: "選択肢1", value: "option-1" }],
        layout: "horizontal",
      };
    case "select":
      return {
        type,
        key,
        displayName: "新しい条件",
        defaultValue: "option-1",
        options: [{ label: "選択肢1", value: "option-1" }],
      };
    case "checkbox":
      return {
        type,
        key,
        displayName: "新しい条件",
        defaultValue: [],
        options: [{ label: "選択肢1", value: "option-1" }],
        layout: "horizontal",
      };
    case "date-range":
      return { type, key, displayName: "新しい条件", defaultValue: { from: "", to: "" } };
  }
};

export const useParameterActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editControls = (controls: DashboardSchema["controls"]) =>
      editDashboard({ ...draft, controls });

    return {
      add: (type: ControlDefinition["type"]) => {
        const key = createParameterKey(draft);
        editControls([...draft.controls, createControl(type, key)]);
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
