import { useId } from "react";

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
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {layoutOptions.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-stone-700"
            key={option.value}
          >
            <input
              checked={layout === option.value}
              className="accent-brand size-4 cursor-pointer"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
};
