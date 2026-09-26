import { RadioGroup } from "@/components/primitives/RadioGroup";
import type { RadioControlDefinition } from "@dashlet/shared/dashboard";

interface RadioControlProps {
  control: RadioControlDefinition;
  value: string;
  onChange: (value: string) => void;
}

export const RadioControl = ({ control, value, onChange }: RadioControlProps) => (
  <fieldset>
    <legend className="mb-2 text-xs font-semibold text-stone-500">{control.displayName}</legend>
    <RadioGroup
      layout={control.layout}
      name={control.key}
      onChange={onChange}
      options={control.options}
      value={value}
    />
  </fieldset>
);
