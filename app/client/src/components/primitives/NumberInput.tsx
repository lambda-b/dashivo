import { twMerge } from "tailwind-merge";

interface NumberInputProps {
  className?: string;
  ariaLabel?: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

export const NumberInput = ({
  ariaLabel,
  className,
  max,
  min,
  onChange,
  step,
  value,
}: NumberInputProps) => (
  <input
    aria-label={ariaLabel}
    className={twMerge("form-input font-mono", className)}
    max={max}
    min={min}
    onChange={(event) => {
      if (!Number.isNaN(event.target.valueAsNumber)) onChange(event.target.valueAsNumber);
    }}
    step={step}
    type="number"
    value={value}
  />
);
