import { ControlEditorCard } from "@/builder/components/ControlEditorCard";
import { ControlIdentityFields } from "@/builder/components/ControlIdentityFields";
import { ControlLayoutField } from "@/builder/components/ControlLayoutField";
import { EditorIconButton } from "@/builder/components/EditorIconButton";
import { Trash2 } from "lucide-react";
import type { ChoiceControlDefinition } from "@/schema/dashboard";

interface ChoiceControlEditorProps {
  control: ChoiceControlDefinition;
  onChange: (control: ChoiceControlDefinition) => void;
  onRemove: () => void;
}

const createOptionValue = (control: ChoiceControlDefinition) => {
  const values = new Set(control.options.map((option) => option.value));
  let index = control.options.length + 1;
  while (values.has(`option-${index}`)) index += 1;
  return `option-${index}`;
};

export const ChoiceControlEditor = ({ control, onChange, onRemove }: ChoiceControlEditorProps) => {
  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const previousValue = control.options[index]?.value;
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
        : (options[0]?.value ?? ""),
    });
  };

  const addOption = () => {
    const value = createOptionValue(control);
    onChange({ ...control, options: [...control.options, { label: "新しい選択肢", value }] });
  };

  return (
    <ControlEditorCard
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
        {control.options.map((option, index) => (
          <div className="grid grid-cols-[1fr_1fr_5rem_2.25rem] items-center gap-2" key={index}>
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
            <input
              aria-label={`選択肢${index + 1}をデフォルトに設定`}
              checked={control.defaultValue === option.value}
              className="accent-brand mx-auto size-4 cursor-pointer"
              name={`${control.key}-default`}
              onChange={() => onChange({ ...control, defaultValue: option.value })}
              type="radio"
            />
            <EditorIconButton
              disabled={control.options.length === 1}
              icon={Trash2}
              label={`選択肢${index + 1}を削除`}
              onClick={() => removeOption(index)}
              variant="danger"
            />
          </div>
        ))}
        <button
          className="mt-1 cursor-pointer rounded-md border border-dashed border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
          onClick={addOption}
          type="button"
        >
          選択肢を追加
        </button>
      </div>

      {control.type === "radio" && (
        <div className="mt-4">
          <ControlLayoutField
            layout={control.layout}
            onChange={(layout) => onChange({ ...control, layout })}
          />
        </div>
      )}
    </ControlEditorCard>
  );
};
