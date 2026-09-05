import clsx from "clsx";
import type { DashboardSchema } from "@/schema/dashboard";

interface ControlPanelProps {
  controls: DashboardSchema["controls"];
  params: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const ControlPanel = ({ controls, params, onChange }: ControlPanelProps) => {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-stone-300 bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between"
      aria-label="絞り込み条件"
    >
      {controls.map((control) => (
        <fieldset className="contents" key={control.key}>
          <legend className="text-sm font-semibold">{control.label}</legend>
          <div className="flex gap-1 rounded-xl bg-stone-200 p-1">
            {control.options.map((option) => (
              <button
                className={clsx(
                  "cursor-pointer rounded-lg px-4 py-2 text-sm text-stone-500 transition",
                  params[control.key] === option.value && "bg-white text-stone-900 shadow-sm",
                )}
                key={option.value}
                onClick={() => onChange(control.key, option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </section>
  );
};
