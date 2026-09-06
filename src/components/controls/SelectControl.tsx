import type { SelectControlDefinition } from "@/schema/dashboard";

interface SelectControlProps {
  control: SelectControlDefinition;
  onChange: (value: string) => void;
  value: string;
}

export const SelectControl = ({ control, onChange, value }: SelectControlProps) => (
  <label className="text-xs font-medium text-stone-600">
    {control.displayName}
    <select
      className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {control.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
