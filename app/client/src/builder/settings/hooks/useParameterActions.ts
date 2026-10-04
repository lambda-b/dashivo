import { createUniqueIndexedName } from "@dashivo/shared-utils/createUniqueIndexedName";
import type { ControlDefinition, DashboardSchema } from "@shared/dashboard";

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
    case "slider":
      return {
        type,
        key,
        displayName: "新しい数値条件",
        defaultValue: [50],
        min: 0,
        max: 100,
        step: 1,
      };
  }
};

export const useParameterActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) => {
  const editControls = (controls: DashboardSchema["controls"]) =>
    editDashboard({ ...draft, controls });

  return {
    add: (type: ControlDefinition["type"]) => {
      const key = createUniqueIndexedName(
        draft.controls.map((control) => control.key),
        "control_",
      );
      editControls([...draft.controls, createControl(type, key)]);
    },
    update: (index: number, control: ControlDefinition) =>
      editControls(
        draft.controls.map((current, controlIndex) => (controlIndex === index ? control : current)),
      ),
    remove: (index: number) =>
      editControls(draft.controls.filter((_, controlIndex) => controlIndex !== index)),
  };
};
