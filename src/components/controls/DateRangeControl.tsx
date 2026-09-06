import type { DateRangeControlDefinition } from "@/schema/dashboard";

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
        <input
          className="focus:border-brand mt-1 min-w-0 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          type="date"
          value={value.from}
        />
      </label>
      <label className="min-w-0 text-xs text-stone-500">
        終了日
        <input
          className="focus:border-brand mt-1 min-w-0 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          type="date"
          value={value.to}
        />
      </label>
    </div>
  </fieldset>
);
