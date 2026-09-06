import clsx from "clsx";
import { Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { DashboardSchema } from "@/schema/dashboard";

interface DashboardTabsProps {
  tabs: DashboardSchema["tabs"];
  onEdit?: () => void;
}

export const DashboardTabs = ({ tabs, onEdit }: DashboardTabsProps) => (
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
      {onEdit && (
        <button
          className="hover:text-brand flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-white"
          onClick={onEdit}
          type="button"
        >
          <Settings2 aria-hidden="true" className="size-3.5" />
          タブを編集
        </button>
      )}
    </div>
  </nav>
);
