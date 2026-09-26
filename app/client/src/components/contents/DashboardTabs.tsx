import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { EditButton } from "@/components/primitives/EditButton";
import type { DashboardSchema } from "@shared/dashboard";

interface DashboardTabsProps {
  tabs: DashboardSchema["tabs"];
  onEditTabs?: () => void;
}

export const DashboardTabs = ({ tabs, onEditTabs }: DashboardTabsProps) => (
  <nav aria-label="コンテンツタブ" className="border-b border-stone-200">
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            className={({ isActive }) =>
              clsx(
                "relative shrink-0 px-1 pt-1 pb-3 text-sm font-semibold text-stone-500 transition hover:text-stone-900",
                isActive &&
                  "text-brand after:bg-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
              )
            }
            key={tab.id}
            to={`/${tab.id}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onEditTabs && (
          <EditButton onClick={onEditTabs} size="compact">
            タブを編集
          </EditButton>
        )}
      </div>
    </div>
  </nav>
);
