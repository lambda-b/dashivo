import type { CheckboxControlDefinition } from "@/schema/dashboard";

interface CheckboxControlProps {
  control: CheckboxControlDefinition;
  onChange: (value: string[]) => void;
  value: string[];
}

export const CheckboxControl = ({ control, onChange, value }: CheckboxControlProps) => (
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
            checked={value.includes(option.value)}
            className="accent-brand size-4 cursor-pointer"
            name={`${control.key}[]`}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...value, option.value]
                  : value.filter((current) => current !== option.value),
              )
            }
            type="checkbox"
            value={option.value}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
);
