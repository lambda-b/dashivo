import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";
import { TextArea } from "@/components/primitives/TextArea";

import type { DashboardSchema } from "@shared/dashboard";

interface HeaderSettingProps {
  dashboard: DashboardSchema;
  onChange: (dashboard: DashboardSchema) => void;
}

export const HeaderSetting = ({ dashboard, onChange }: HeaderSettingProps) => (
  <section>
    <div className="grid gap-3">
      <FormField label="タイトル">
        <TextInput
          onChange={(title) => onChange({ ...dashboard, title })}
          value={dashboard.title}
        />
      </FormField>
      <FormField label="リード文">
        <TextArea
          onChange={(description) => onChange({ ...dashboard, description })}
          value={dashboard.description}
        />
      </FormField>
    </div>
  </section>
);
