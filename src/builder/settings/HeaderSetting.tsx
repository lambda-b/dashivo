import type { DashboardSchema } from "@/schema/dashboard";

interface HeaderSettingProps {
  dashboard: DashboardSchema;
  onChange: (dashboard: DashboardSchema) => void;
}

export const HeaderSetting = ({ dashboard, onChange }: HeaderSettingProps) => (
  <section>
    <div className="grid gap-3">
      <label className="text-xs font-medium text-stone-600">
        タイトル
        <input
          className="focus:border-brand mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...dashboard, title: event.target.value })}
          value={dashboard.title}
        />
      </label>
      <label className="text-xs font-medium text-stone-600">
        リード文
        <textarea
          className="focus:border-brand mt-1 min-h-20 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm outline-none"
          onChange={(event) => onChange({ ...dashboard, description: event.target.value })}
          value={dashboard.description}
        />
      </label>
    </div>
  </section>
);
