import { Trash2 } from "lucide-react";
import { ControlSettingCard } from "@/builder/settings/components/ControlSettingCard";
import { ControlIdentityFields } from "@/builder/settings/components/ControlIdentityFields";
import { ControlLayoutField } from "@/builder/settings/components/ControlLayoutField";
import { Checkbox } from "@/components/primitives/Checkbox";
import { IconButton } from "@/components/primitives/IconButton";
import type { CheckboxControlDefinition } from "@/schema/dashboard";

interface CheckboxControlSettingProps {
  control: CheckboxControlDefinition;
  onChange: (control: CheckboxControlDefinition) => void;
  onRemove: () => void;
}

const createOptionValue = (control: CheckboxControlDefinition) => {
  const values = new Set(control.options.map((option) => option.value));
  let index = control.options.length + 1;
  while (values.has(`option-${index}`)) index += 1;
  return `option-${index}`;
};

export const CheckboxControlSetting = ({
  control,
  onChange,
  onRemove,
}: CheckboxControlSettingProps) => {
  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const previousValue = control.options[index]?.value;
    onChange({
      ...control,
      options: control.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
      defaultValue:
        field === "value" && previousValue
          ? control.defaultValue.map((current) => (current === previousValue ? value : current))
          : control.defaultValue,
    });
  };

  const removeOption = (index: number) => {
    const removedValue = control.options[index]?.value;
    onChange({
      ...control,
      options: control.options.filter((_, optionIndex) => optionIndex !== index),
      defaultValue: control.defaultValue.filter((value) => value !== removedValue),
    });
  };

  const addOption = () => {
    const value = createOptionValue(control);
    onChange({ ...control, options: [...control.options, { label: "新しい選択肢", value }] });
  };

  return (
    <ControlSettingCard
      controlDisplayName={control.displayName}
      onRemove={onRemove}
      typeLabel="CHECKBOX PARAMETER"
    >
      <div className="grid gap-4">
        <ControlIdentityFields
          control={control}
          onChange={(identity) => onChange({ ...control, ...identity })}
        />

        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_1fr_5rem_2.25rem] gap-2 text-xs font-medium text-stone-600">
            <span>値</span>
            <span>ラベル</span>
            <span className="text-center">デフォルト</span>
            <span />
          </div>
          <div className="grid grid-cols-[1fr_1fr_5rem_2.25rem] gap-2">
            <div className="col-span-2 grid gap-2">
              {control.options.map((option, index) => (
                <div className="grid grid-cols-2 gap-2" key={index}>
                  <input
                    aria-label={`選択肢${index + 1}の値`}
                    className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
                    onChange={(event) => updateOption(index, "value", event.target.value)}
                    value={option.value}
                  />
                  <input
                    aria-label={`選択肢${index + 1}のラベル`}
                    className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
                    onChange={(event) => updateOption(index, "label", event.target.value)}
                    value={option.label}
                  />
                </div>
              ))}
            </div>
            <Checkbox
              ariaLabel="デフォルト値"
              labelVisibility="hidden"
              layout="vertical"
              name={`${control.key}-default`}
              onChange={(options) =>
                onChange({
                  ...control,
                  defaultValue: options
                    .filter((option) => option.checked)
                    .map((option) => option.value),
                })
              }
              options={control.options.map((option, index) => ({
                checked: control.defaultValue.includes(option.value),
                label: `選択肢${index + 1}をデフォルトでチェック`,
                value: option.value,
              }))}
            />
            <div className="grid gap-2">
              {control.options.map((_, index) => (
                <span className="grid h-[2.375rem] place-items-center" key={index}>
                  <IconButton
                    disabled={control.options.length === 1}
                    icon={Trash2}
                    label={`選択肢${index + 1}を削除`}
                    onClick={() => removeOption(index)}
                    variant="danger"
                  />
                </span>
              ))}
            </div>
          </div>
          <button
            className="mt-1 cursor-pointer rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
            onClick={addOption}
            type="button"
          >
            選択肢を追加
          </button>
        </div>

        <ControlLayoutField
          layout={control.layout}
          onChange={(layout) => onChange({ ...control, layout })}
        />
      </div>
    </ControlSettingCard>
  );
};
