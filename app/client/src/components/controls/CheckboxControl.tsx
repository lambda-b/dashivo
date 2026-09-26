import type { CheckboxControlDefinition } from "@shared/dashboard";
import { Checkbox } from "@/components/primitives/Checkbox";

interface CheckboxControlProps {
  control: CheckboxControlDefinition;
  onChange: (value: string[]) => void;
  value: string[];
}

export const CheckboxControl = ({ control, onChange, value }: CheckboxControlProps) => (
  <fieldset>
    <legend className="mb-2 text-xs font-semibold text-stone-500">{control.displayName}</legend>
    <Checkbox
      layout={control.layout}
      name={control.key}
      onChange={(options) =>
        onChange(options.filter((option) => option.checked).map((option) => option.value))
      }
      options={control.options.map((option) => ({
        ...option,
        checked: value.includes(option.value),
      }))}
    />
  </fieldset>
);
