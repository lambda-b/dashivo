import { twMerge } from "tailwind-merge";

interface SelectListOption {
  label: string;
  value: string;
}

interface SelectListProps {
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectListOption>;
  value: string;
}

export const SelectList = ({
  ariaLabel,
  className,
  disabled,
  onChange,
  options,
  value,
}: SelectListProps) => (
  <select
    aria-label={ariaLabel}
    className={twMerge("form-input", className)}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    value={value}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
