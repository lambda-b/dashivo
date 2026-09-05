import clsx from "clsx";
import type { ControlDefinition } from "@/schema/dashboard";

interface RadioControlProps {
  control: ControlDefinition;
  value: string;
  onChange: (value: string) => void;
}

export const RadioControl = ({ control, value, onChange }: RadioControlProps) => (
  <fieldset className="contents">
    <legend className="text-sm font-semibold">{control.label}</legend>
    <div className="flex gap-1 rounded-xl bg-stone-200 p-1">
      {control.options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={clsx(
            "cursor-pointer rounded-lg px-4 py-2 text-sm text-stone-500 transition",
            value === option.value && "bg-white text-stone-900 shadow-sm",
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
