import { createUniqueIndexedName } from "@dashivo/shared-utils/createUniqueIndexedName";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";

import { ControlSettingCard } from "@/builder/settings/components/ControlSettingCard";
import { ControlIdentityFields } from "@/builder/settings/components/ControlIdentityFields";
import { ControlLayoutField } from "@/builder/settings/components/ControlLayoutField";
import { IconButton } from "@/components/primitives/IconButton";
import { RadioGroup } from "@/components/primitives/RadioGroup";
import { Trash2 } from "lucide-react";
import type { ChoiceControlDefinition } from "@shared/dashboard";

interface ChoiceControlSettingProps {
  control: ChoiceControlDefinition;
  onChange: (control: ChoiceControlDefinition) => void;
  onRemove: () => void;
}

export const ChoiceControlSetting = ({
  control,
  onChange,
  onRemove,
}: ChoiceControlSettingProps) => {
  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const previousValue = control.options[index].value;
    const options = control.options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [field]: value } : option,
    );
    onChange({
      ...control,
      options,
      defaultValue:
        field === "value" && control.defaultValue === previousValue ? value : control.defaultValue,
    });
  };

  const removeOption = (index: number) => {
    const options = control.options.filter((_, optionIndex) => optionIndex !== index);
    onChange({
      ...control,
      options,
      defaultValue: options.some((option) => option.value === control.defaultValue)
        ? control.defaultValue
        : options[0].value,
    });
  };

  const addOption = () => {
    const value = createUniqueIndexedName(
      control.options.map((option) => option.value),
      "option-",
    );
    onChange({ ...control, options: [...control.options, { label: "新しい選択肢", value }] });
  };

  return (
    <ControlSettingCard
      controlDisplayName={control.displayName}
      onRemove={onRemove}
      typeLabel={control.type === "radio" ? "RADIO PARAMETER" : "SELECT PARAMETER"}
    >
      <ControlIdentityFields
        control={control}
        onChange={(identity) => onChange({ ...control, ...identity })}
      />

      <div className="mt-4 grid gap-2">
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
                <TextInput
                  ariaLabel={`選択肢${index + 1}の値`}
                  monospace
                  onChange={(value) => updateOption(index, "value", value)}
                  value={option.value}
                />
                <TextInput
                  ariaLabel={`選択肢${index + 1}のラベル`}
                  onChange={(value) => updateOption(index, "label", value)}
                  value={option.label}
                />
              </div>
            ))}
          </div>
          <RadioGroup
            ariaLabel="デフォルト値"
            labelVisibility="hidden"
            layout="vertical"
            name={`${control.key}-default`}
            onChange={(defaultValue) => onChange({ ...control, defaultValue })}
            options={control.options.map((option, index) => ({
              label: `選択肢${index + 1}をデフォルトに設定`,
              value: option.value,
            }))}
            value={control.defaultValue}
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
        <Button onClick={addOption} variant="dashed">
          選択肢を追加
        </Button>
      </div>

      {control.type === "radio" && (
        <div className="mt-4">
          <ControlLayoutField
            layout={control.layout}
            onChange={(layout) => onChange({ ...control, layout })}
          />
        </div>
      )}
    </ControlSettingCard>
  );
};
