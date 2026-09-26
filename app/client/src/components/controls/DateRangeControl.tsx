import { DateInput } from "@/components/primitives/DateInput";
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
      <label className="min-w-0 text-xs text-stone-500">
        開始日
        <div className="mt-1">
          <DateInput onChange={(from) => onChange({ ...value, from })} value={value.from} />
        </div>
      </label>
      <label className="min-w-0 text-xs text-stone-500">
        終了日
        <div className="mt-1">
          <DateInput onChange={(to) => onChange({ ...value, to })} value={value.to} />
        </div>
      </label>
    </div>
  </fieldset>
);
