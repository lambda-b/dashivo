import { DateInput } from "@/components/primitives/DateInput";
import { FormField } from "@/components/primitives/FormField";
import type { DateRangeControlDefinition } from "@shared/dashboard";

interface DateRangeControlProps {
  control: DateRangeControlDefinition;
  onChange: (value: DateRangeControlDefinition["defaultValue"]) => void;
  value: DateRangeControlDefinition["defaultValue"];
}

export const DateRangeControl = ({ control, onChange, value }: DateRangeControlProps) => (
  <fieldset className="space-y-2">
    <legend className="text-xs font-medium text-stone-600">{control.displayName}</legend>
    <div className="grid grid-cols-2 gap-2">
      <FormField label="開始日">
        <DateInput onChange={(from) => onChange({ ...value, from })} value={value.from} />
      </FormField>
      <FormField label="終了日">
        <DateInput onChange={(to) => onChange({ ...value, to })} value={value.to} />
      </FormField>
    </div>
  </fieldset>
);
