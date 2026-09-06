import type { ControlDefinition } from "@/schema/dashboard";

interface ControlEditorProps {
  control: ControlDefinition;
  onChange: (control: ControlDefinition) => void;
  onRemove: () => void;
}

const createOptionValue = (control: ControlDefinition) => {
  const values = new Set(control.options.map((option) => option.value));
  let index = control.options.length + 1;
  while (values.has(`option-${index}`)) index += 1;
  return `option-${index}`;
};

export const ControlEditor = ({ control, onChange, onRemove }: ControlEditorProps) => {
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
    <fieldset className="rounded-lg border border-stone-200 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <legend className="text-xs font-bold tracking-wide text-stone-500">RADIO PARAMETER</legend>
        <button
          className="cursor-pointer text-xs font-medium text-red-700 hover:underline"
          onClick={onRemove}
          type="button"
        >
          削除
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-stone-600">
          キー
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
            onChange={(event) => onChange({ ...control, key: event.target.value })}
            value={control.key}
          />
        </label>
        <label className="text-xs font-medium text-stone-600">
          ラベル
          <input
            className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
            onChange={(event) => onChange({ ...control, label: event.target.value })}
            value={control.label}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2">
        <span className="text-xs font-medium text-stone-600">選択肢</span>
        {control.options.map((option, index) => (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}>
            <input
              aria-label={`選択肢${index + 1}のラベル`}
              className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
              onChange={(event) => updateOption(index, "label", event.target.value)}
              value={option.label}
            />
            <input
              aria-label={`選択肢${index + 1}の値`}
              className="focus:border-brand min-w-0 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
              onChange={(event) => updateOption(index, "value", event.target.value)}
              value={option.value}
            />
            <button
              aria-label={`選択肢${index + 1}を削除`}
              className="cursor-pointer rounded-md border border-stone-200 px-3 text-stone-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={control.options.length === 1}
              onClick={() => removeOption(index)}
              type="button"
            >
              −
            </button>
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

      <label className="mt-4 block text-xs font-medium text-stone-600">
        初期値
        <select
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...control, defaultValue: event.target.value })}
          value={control.defaultValue}
        >
          {control.options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label || option.value || `選択肢${index + 1}`}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
};
