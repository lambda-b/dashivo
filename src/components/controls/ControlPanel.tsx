import { CheckboxControl } from "@/components/controls/CheckboxControl";
import { DateRangeControl } from "@/components/controls/DateRangeControl";
import { RadioControl } from "@/components/controls/RadioControl";
import { SelectControl } from "@/components/controls/SelectControl";
import type { DashboardSchema, ParameterValue } from "@/schema/dashboard";

interface ControlPanelProps {
  controls: DashboardSchema["controls"];
  onChange: (key: string, value: ParameterValue) => void;
  params: Record<string, ParameterValue>;
}

export const ControlPanel = ({ controls, params, onChange }: ControlPanelProps) => (
  <section aria-label="パラメータ" className="flex flex-col gap-5">
    {controls.map((control) => {
      const value = params[control.key] ?? control.defaultValue;

      switch (control.type) {
        case "radio":
          return (
            <RadioControl
              control={control}
              key={control.key}
              onChange={(nextValue) => onChange(control.key, nextValue)}
              value={typeof value === "string" ? value : control.defaultValue}
            />
          );
        case "select":
          return (
            <SelectControl
              control={control}
              key={control.key}
              onChange={(nextValue) => onChange(control.key, nextValue)}
              value={typeof value === "string" ? value : control.defaultValue}
            />
          );
        case "checkbox":
          return (
            <CheckboxControl
              control={control}
              key={control.key}
              onChange={(nextValue) => onChange(control.key, nextValue)}
              value={typeof value === "boolean" ? value : control.defaultValue}
            />
          );
        case "date-range":
          return (
            <DateRangeControl
              control={control}
              key={control.key}
              onChange={(nextValue) => onChange(control.key, nextValue)}
              value={typeof value === "object" ? value : control.defaultValue}
            />
          );
      }
    })}
  </section>
);
