interface SelectListOption {
  label: string;
  value: string;
}

interface SelectListProps {
  ariaLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectListOption>;
  value: string;
}

export const SelectList = ({ ariaLabel, disabled, onChange, options, value }: SelectListProps) => (
  <select
    aria-label={ariaLabel}
    className="focus:border-brand min-w-0 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none disabled:bg-stone-100 disabled:text-stone-400"
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
