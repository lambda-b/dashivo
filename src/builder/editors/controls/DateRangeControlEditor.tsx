import { ControlEditorCard } from "@/builder/components/ControlEditorCard";
import { ControlIdentityFields } from "@/builder/components/ControlIdentityFields";
import type { DateRangeControlDefinition } from "@/schema/dashboard";

interface DateRangeControlEditorProps {
  control: DateRangeControlDefinition;
  onChange: (control: DateRangeControlDefinition) => void;
  onRemove: () => void;
}

export const DateRangeControlEditor = ({
  control,
  onChange,
  onRemove,
}: DateRangeControlEditorProps) => (
  <ControlEditorCard
    controlLabel={control.label}
    onRemove={onRemove}
    typeLabel="DATE RANGE PARAMETER"
  >
    <div className="space-y-3">
      <ControlIdentityFields
        control={control}
        onChange={(identity) => onChange({ ...control, ...identity })}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          開始日のデフォルト
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...control,
                defaultValue: { ...control.defaultValue, from: event.target.value },
              })
            }
            placeholder="YYYY-MM-DD"
            type="date"
            value={control.defaultValue.from}
          />
        </label>

        <label className="text-xs font-medium text-stone-600">
          終了日のデフォルト
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              onChange({
                ...control,
                defaultValue: { ...control.defaultValue, to: event.target.value },
              })
            }
            placeholder="YYYY-MM-DD"
            type="date"
            value={control.defaultValue.to}
          />
        </label>
      </div>
    </div>
  </ControlEditorCard>
);
