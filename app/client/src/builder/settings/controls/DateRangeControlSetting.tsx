import { ControlSettingCard } from "@/builder/settings/components/ControlSettingCard";
import { ControlIdentityFields } from "@/builder/settings/components/ControlIdentityFields";
import { DateInput } from "@/components/primitives/DateInput";
import { FormField } from "@/components/primitives/FormField";
import type { DateRangeControlDefinition } from "@shared/dashboard";

interface DateRangeControlSettingProps {
  control: DateRangeControlDefinition;
  onChange: (control: DateRangeControlDefinition) => void;
  onRemove: () => void;
}

export const DateRangeControlSetting = ({
  control,
  onChange,
  onRemove,
}: DateRangeControlSettingProps) => (
  <ControlSettingCard
    controlDisplayName={control.displayName}
    onRemove={onRemove}
    typeLabel="DATE RANGE PARAMETER"
  >
    <div className="space-y-3">
      <ControlIdentityFields
        control={control}
        onChange={(identity) => onChange({ ...control, ...identity })}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="開始日のデフォルト">
          <DateInput
            onChange={(from) =>
              onChange({
                ...control,
                defaultValue: { ...control.defaultValue, from },
              })
            }
            value={control.defaultValue.from}
          />
        </FormField>

        <FormField label="終了日のデフォルト">
          <DateInput
            onChange={(to) =>
              onChange({
                ...control,
                defaultValue: { ...control.defaultValue, to },
              })
            }
            value={control.defaultValue.to}
          />
        </FormField>
      </div>
    </div>
  </ControlSettingCard>
);
