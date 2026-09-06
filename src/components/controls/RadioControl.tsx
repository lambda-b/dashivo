import type { RadioControlDefinition } from "@/schema/dashboard";

interface RadioControlProps {
  control: RadioControlDefinition;
  value: string;
  onChange: (value: string) => void;
}

export const RadioControl = ({ control, value, onChange }: RadioControlProps) => (
  <fieldset>
    <legend className="mb-2 text-xs font-semibold text-stone-500">{control.displayName}</legend>
    <div
      className={control.layout === "horizontal" ? "flex flex-wrap gap-x-4 gap-y-2" : "grid gap-2"}
    >
      {control.options.map((option) => (
        <label
          className="flex cursor-pointer items-center gap-2 text-sm text-stone-700"
          key={option.value}
        >
          <input
            checked={value === option.value}
            className="accent-brand size-4 cursor-pointer"
            name={control.key}
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
);
