import type { ComponentType } from "react";
import { RadioControl } from "@/components/controls/RadioControl";
import type { ControlDefinition, DashboardSchema } from "@/schema/dashboard";

interface ControlComponentProps {
  control: ControlDefinition;
  value: string;
  onChange: (value: string) => void;
}

const controlCatalog = {
  radio: RadioControl,
} satisfies Record<ControlDefinition["type"], ComponentType<ControlComponentProps>>;

interface ControlPanelProps {
  controls: DashboardSchema["controls"];
  params: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const ControlPanel = ({ controls, params, onChange }: ControlPanelProps) => {
  return (
    <section className="flex flex-col gap-5" aria-label="絞り込み条件">
      {controls.map((control) => {
        const Control = controlCatalog[control.type];
        return (
          <Control
            control={control}
            key={control.key}
            onChange={(value) => onChange(control.key, value)}
            value={params[control.key] ?? control.defaultValue}
          />
        );
      })}
    </section>
  );
};
