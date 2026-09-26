import type { DashboardSchema } from "@dashlet/shared/dashboard";
import { useTabActions } from "@/builder/settings/hooks/useTabActions";
import { TabItemSetting } from "@/builder/settings/tabs/TabItemSetting";

export const TabSetting = ({
  dashboard,
  onChange,
}: {
  dashboard: DashboardSchema;
  onChange: (dashboard: DashboardSchema) => void;
}) => {
  const actions = useTabActions(dashboard, onChange);

  return (
    <section>
      <div className="mb-3 flex justify-between">
        <h3 className="font-bold">Tabs</h3>
        <button onClick={actions.add}>タブを追加</button>
      </div>
      <div className="grid gap-3">
        {dashboard.tabs.map((tab, index) => (
          <TabItemSetting
            key={index}
            tab={tab}
            index={index}
            canRemove={dashboard.tabs.length > 1}
            isFirst={index === 0}
            isLast={index === dashboard.tabs.length - 1}
            onChange={(next) => actions.update(index, next)}
            onMoveDown={() => actions.move(index, 1)}
            onMoveUp={() => actions.move(index, -1)}
            onRemove={() => actions.remove(index)}
          />
        ))}
      </div>
    </section>
  );
};
