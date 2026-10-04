import clsx from "clsx";
import { twMerge } from "tailwind-merge";

interface TextInputProps {
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
  maxLength?: number;
  monospace?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export const TextInput = ({
  className,
  ariaLabel,
  disabled,
  id,
  maxLength,
  monospace,
  onChange,
  placeholder,
  value,
}: TextInputProps) => (
  <input
    aria-label={ariaLabel}
    className={twMerge(clsx("form-input", monospace && "font-mono"), className)}
    disabled={disabled}
    id={id}
    maxLength={maxLength}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    type="text"
    value={value}
  />
);
