import { useId } from "react";
import { RadioGroup } from "@/components/primitives/RadioGroup";

interface ControlLayoutFieldProps {
  layout: "horizontal" | "vertical";
  onChange: (layout: "horizontal" | "vertical") => void;
}

const layoutOptions = [
  { label: "横並び（自動折り返し）", value: "horizontal" },
  { label: "縦並び", value: "vertical" },
] as const;

export const ControlLayoutField = ({ layout, onChange }: ControlLayoutFieldProps) => {
  const name = `control-layout-${useId()}`;

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-stone-600">表示方向</legend>
      <RadioGroup
        layout="horizontal"
        name={name}
        onChange={(value) => onChange(value === "vertical" ? "vertical" : "horizontal")}
        options={layoutOptions}
        value={layout}
      />
    </fieldset>
  );
};
