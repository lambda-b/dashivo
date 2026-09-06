interface ControlIdentity {
  key: string;
  label: string;
}

interface ControlIdentityFieldsProps {
  control: ControlIdentity;
  onChange: (control: ControlIdentity) => void;
}

export const ControlIdentityFields = ({ control, onChange }: ControlIdentityFieldsProps) => (
  <div className="grid grid-cols-2 gap-3">
    <label className="text-xs font-medium text-stone-600">
      キー
      <input
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
        onChange={(event) => onChange({ key: event.target.value, label: control.label })}
        value={control.key}
      />
    </label>
    <label className="text-xs font-medium text-stone-600">
      ラベル
      <input
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
        onChange={(event) => onChange({ key: control.key, label: event.target.value })}
        value={control.label}
      />
    </label>
  </div>
);
