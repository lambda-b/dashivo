import { SelectList } from "@/components/primitives/SelectList";
import type { SelectControlDefinition } from "@shared/dashboard";

interface SelectControlProps {
  control: SelectControlDefinition;
  onChange: (value: string) => void;
  value: string;
}

export const SelectControl = ({ control, onChange, value }: SelectControlProps) => (
  <label className="text-xs font-medium text-stone-600">
    {control.displayName}
    <div className="mt-1">
      <SelectList onChange={onChange} options={control.options} value={value} />
    </div>
  </label>
);
