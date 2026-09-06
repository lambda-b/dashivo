import clsx from "clsx";
import type { RadioControlDefinition } from "@/schema/dashboard";

interface RadioControlProps {
  control: RadioControlDefinition;
  value: string;
  onChange: (value: string) => void;
}

export const RadioControl = ({ control, value, onChange }: RadioControlProps) => (
  <fieldset>
    <legend className="mb-2 text-xs font-semibold text-stone-500">{control.label}</legend>
    <div className="grid gap-1 rounded-lg bg-stone-100 p-1 max-lg:grid-cols-3">
      {control.options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={clsx(
            "cursor-pointer rounded-md px-3 py-2 text-left text-sm text-stone-500 transition hover:bg-white hover:text-stone-800 max-lg:text-center",
            value === option.value && "text-brand-dark bg-white shadow-sm",
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
);
