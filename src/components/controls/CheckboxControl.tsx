import type { CheckboxControlDefinition } from "@/schema/dashboard";

interface CheckboxControlProps {
  control: CheckboxControlDefinition;
  onChange: (value: boolean) => void;
  value: boolean;
}

export const CheckboxControl = ({ control, onChange, value }: CheckboxControlProps) => (
  <label className="flex items-center gap-2">
    <input checked={value} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    <span className="text-sm text-stone-700">{control.label}</span>
  </label>
);
