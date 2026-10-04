import { twMerge } from "tailwind-merge";

interface DateInputProps {
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}

export const DateInput = ({ ariaLabel, className, disabled, onChange, value }: DateInputProps) => (
  <input
    aria-label={ariaLabel}
    className={twMerge("form-input", className)}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    type="date"
    value={value}
  />
);
