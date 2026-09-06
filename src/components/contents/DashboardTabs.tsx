import clsx from "clsx";
import { NavLink } from "react-router-dom";
import type { DashboardSchema } from "@/schema/dashboard";

interface DashboardTabsProps {
  tabs: DashboardSchema["tabs"];
}

export const DashboardTabs = ({ tabs }: DashboardTabsProps) => (
  <nav aria-label="コンテンツタブ" className="border-b border-stone-200">
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
  </nav>
);
