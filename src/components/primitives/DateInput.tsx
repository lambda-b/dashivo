interface DateInputProps {
  ariaLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}

export const DateInput = ({ ariaLabel, disabled, onChange, value }: DateInputProps) => (
  <input
    aria-label={ariaLabel}
    className="focus:border-brand min-w-0 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none disabled:bg-stone-100 disabled:text-stone-400"
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    type="date"
    value={value}
  />
);
