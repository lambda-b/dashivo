import { SelectList } from "@/components/primitives/SelectList";
import { FormField } from "@/components/primitives/FormField";
import type { SelectControlDefinition } from "@shared/dashboard";

interface SelectControlProps {
  control: SelectControlDefinition;
  onChange: (value: string) => void;
  value: string;
}

export const SelectControl = ({ control, onChange, value }: SelectControlProps) => (
  <FormField label={control.displayName}>
    <SelectList onChange={onChange} options={control.options} value={value} />
  </FormField>
);
