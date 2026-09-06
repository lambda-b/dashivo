interface CheckboxOption {
  checked: boolean;
  label: string;
  value: string;
}

interface CheckboxProps {
  ariaLabel?: string;
  labelVisibility?: "visible" | "hidden";
  layout: "horizontal" | "vertical";
  name: string;
  onChange: (options: CheckboxOption[]) => void;
  options: CheckboxOption | CheckboxOption[];
}

interface CheckboxItemProps {
  option: CheckboxOption;
  labelVisibility: "visible" | "hidden";
  name: string;
  onChange: (checked: boolean) => void;
}

const CheckboxItem = ({ option, labelVisibility, name, onChange }: CheckboxItemProps) => (
  <label
    className={
      labelVisibility === "visible"
        ? "flex cursor-pointer items-center gap-2 text-sm text-stone-700"
        : "grid h-[2.375rem] cursor-pointer place-items-center"
    }
  >
    <input
      checked={option.checked}
      className="accent-brand size-4 cursor-pointer"
      name={`${name}[]`}
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
      value={option.value}
    />
    <span className={labelVisibility === "visible" ? undefined : "sr-only"}>{option.label}</span>
  </label>
);

export const Checkbox = ({
  ariaLabel,
  labelVisibility = "visible",
  layout,
  name,
  onChange,
  options: optionsSource,
}: CheckboxProps) => {
  const options = Array.isArray(optionsSource) ? [...optionsSource] : [optionsSource];

  return (
    <div
      aria-label={ariaLabel}
      className={layout === "horizontal" ? "flex flex-wrap gap-x-4 gap-y-2" : "grid gap-2"}
      role="group"
    >
      {options.map((option, index) => (
        <CheckboxItem
          key={option.value}
          labelVisibility={labelVisibility}
          name={name}
          onChange={(checked) =>
            onChange(
              options.map((current, optionIndex) =>
                optionIndex === index ? { ...current, checked } : current,
              ),
            )
          }
          option={option}
        />
      ))}
    </div>
  );
};
