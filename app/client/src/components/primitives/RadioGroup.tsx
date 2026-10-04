import { twMerge } from "tailwind-merge";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  className?: string;
  ariaLabel?: string;
  labelVisibility?: "visible" | "hidden";
  layout: "horizontal" | "vertical";
  name: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<RadioOption>;
  value: string;
}

export const RadioGroup = ({
  className,
  ariaLabel,
  labelVisibility = "visible",
  layout,
  name,
  onChange,
  options,
  value,
}: RadioGroupProps) => (
  <div
    aria-label={ariaLabel}
    className={twMerge(
      layout === "horizontal" ? "flex flex-wrap gap-x-4 gap-y-2" : "grid gap-2",
      className,
    )}
    role="radiogroup"
  >
    {options.map((option) => (
      <label
        className={
          labelVisibility === "visible"
            ? "flex cursor-pointer items-center gap-2 text-sm text-stone-700"
            : "grid h-[2.375rem] cursor-pointer place-items-center"
        }
        key={option.value}
      >
        <input
          checked={value === option.value}
          className="accent-brand size-4 cursor-pointer"
          name={name}
          onChange={() => onChange(option.value)}
          type="radio"
          value={option.value}
        />
        <span className={labelVisibility === "visible" ? undefined : "sr-only"}>
          {option.label}
        </span>
      </label>
    ))}
  </div>
);
