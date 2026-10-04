import { FormField } from "@/components/primitives/FormField";
import { TextInput } from "@/components/primitives/TextInput";

interface ControlIdentity {
  displayName: string;
  key: string;
}

interface ControlIdentityFieldsProps {
  control: ControlIdentity;
  onChange: (control: ControlIdentity) => void;
}

export const ControlIdentityFields = ({ control, onChange }: ControlIdentityFieldsProps) => (
  <div className="grid grid-cols-2 gap-3">
    <FormField label="キー">
      <TextInput
        monospace
        onChange={(key) => onChange({ displayName: control.displayName, key })}
        value={control.key}
      />
    </FormField>
    <FormField label="表示名">
      <TextInput
        onChange={(displayName) => onChange({ displayName, key: control.key })}
        value={control.displayName}
      />
    </FormField>
  </div>
);
