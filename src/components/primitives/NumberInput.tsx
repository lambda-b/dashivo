interface NumberInputProps {
  ariaLabel?: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

export const NumberInput = ({ ariaLabel, max, min, onChange, step, value }: NumberInputProps) => (
  <input
    aria-label={ariaLabel}
    className="focus:border-brand min-w-0 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
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
