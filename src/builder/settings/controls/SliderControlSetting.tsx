import { Plus, Trash2 } from "lucide-react";
import { ControlSettingCard } from "@/builder/settings/components/ControlSettingCard";
import { ControlIdentityFields } from "@/builder/settings/components/ControlIdentityFields";
import { IconButton } from "@/components/primitives/IconButton";
import { NumberInput } from "@/components/primitives/NumberInput";
import { Slider } from "@/components/primitives/Slider";
import type { SliderControlDefinition } from "@/schema/dashboard";

interface SliderControlSettingProps {
  control: SliderControlDefinition;
  onChange: (control: SliderControlDefinition) => void;
  onRemove: () => void;
}

export const SliderControlSetting = ({
  control,
  onChange,
  onRemove,
}: SliderControlSettingProps) => {
  const canPreview =
    control.min < control.max &&
    control.step > 0 &&
    control.defaultValue.every((value) => value >= control.min && value <= control.max);

  const updateDefaultValue = (index: number, value: number) =>
    onChange({
      ...control,
      defaultValue: control.defaultValue
        .map((current, valueIndex) => (valueIndex === index ? value : current))
        .toSorted((left, right) => left - right),
    });

  const addDefaultValue = () => {
    const previous = control.defaultValue[control.defaultValue.length - 1];
    const value = Math.min(control.max, Math.max(control.min, previous + control.step));
    onChange({ ...control, defaultValue: [...control.defaultValue, value] });
  };

  const removeDefaultValue = (index: number) =>
    onChange({
      ...control,
      defaultValue: control.defaultValue.filter((_, valueIndex) => valueIndex !== index),
    });

  return (
    <ControlSettingCard
      controlDisplayName={control.displayName}
      onRemove={onRemove}
      typeLabel="SLIDER PARAMETER"
    >
      <div className="grid gap-4">
        <ControlIdentityFields
          control={control}
          onChange={(identity) => onChange({ ...control, ...identity })}
        />

        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs font-medium text-stone-600">
            最小値
            <span className="mt-1 block">
              <NumberInput
                ariaLabel="最小値"
                onChange={(min) => onChange({ ...control, min })}
                step={control.step}
                value={control.min}
              />
            </span>
          </label>
          <label className="text-xs font-medium text-stone-600">
            最大値
            <span className="mt-1 block">
              <NumberInput
                ariaLabel="最大値"
                onChange={(max) => onChange({ ...control, max })}
                step={control.step}
                value={control.max}
              />
            </span>
          </label>
          <label className="text-xs font-medium text-stone-600">
            刻み幅
            <span className="mt-1 block">
              <NumberInput
                ariaLabel="刻み幅"
                min={Number.MIN_VALUE}
                onChange={(step) => onChange({ ...control, step })}
                value={control.step}
              />
            </span>
          </label>
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-stone-600">デフォルト値</span>
          {control.defaultValue.map((value, index) => (
            <div className="grid grid-cols-[1fr_2.25rem] items-center gap-2" key={index}>
              <NumberInput
                ariaLabel={`デフォルト値${index + 1}`}
                max={control.max}
                min={control.min}
                onChange={(nextValue) => updateDefaultValue(index, nextValue)}
                step={control.step}
                value={value}
              />
              <IconButton
                disabled={control.defaultValue.length === 1}
                icon={Trash2}
                label={`デフォルト値${index + 1}を削除`}
                onClick={() => removeDefaultValue(index)}
                variant="danger"
              />
            </div>
          ))}
          <button
            className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
            onClick={addDefaultValue}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            値を追加
          </button>
        </div>

        {canPreview && (
          <div className="rounded-lg bg-stone-50 px-4 py-3">
            <Slider
              ariaLabel={`${control.displayName}のプレビュー`}
              max={control.max}
              min={control.min}
              name={`${control.key}-preview`}
              onChange={(defaultValue) => onChange({ ...control, defaultValue })}
              step={control.step}
              value={control.defaultValue}
            />
          </div>
        )}
      </div>
    </ControlSettingCard>
  );
};
