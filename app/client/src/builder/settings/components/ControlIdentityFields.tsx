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
    <label className="text-xs font-medium text-stone-600">
      キー
      <input
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none"
        onChange={(event) =>
          onChange({ displayName: control.displayName, key: event.target.value })
        }
        value={control.key}
      />
    </label>
    <label className="text-xs font-medium text-stone-600">
      表示名
      <input
        className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
        onChange={(event) => onChange({ displayName: event.target.value, key: control.key })}
        value={control.displayName}
      />
    </label>
  </div>
);
