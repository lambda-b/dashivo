import { ControlEditorCard } from "@/builder/components/ControlEditorCard";
import { ControlIdentityFields } from "@/builder/components/ControlIdentityFields";
import type { CheckboxControlDefinition } from "@/schema/dashboard";

interface CheckboxControlEditorProps {
  control: CheckboxControlDefinition;
  onChange: (control: CheckboxControlDefinition) => void;
  onRemove: () => void;
}

export const CheckboxControlEditor = ({
  control,
  onChange,
  onRemove,
}: CheckboxControlEditorProps) => (
  <ControlEditorCard
    controlLabel={control.label}
    onRemove={onRemove}
    typeLabel="CHECKBOX PARAMETER"
  >
    <div className="space-y-3">
      <ControlIdentityFields
        control={control}
        onChange={(identity) => onChange({ ...control, ...identity })}
      />

      <label className="flex items-center gap-2">
        <input
          checked={control.defaultValue === true}
          onChange={(event) => onChange({ ...control, defaultValue: event.target.checked })}
          type="checkbox"
        />
        <span className="text-xs font-medium text-stone-600">デフォルトでチェック</span>
      </label>
    </div>
  </ControlEditorCard>
);
