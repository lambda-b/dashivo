import { useMemo } from "react";
import type { DashboardSchema, TabDefinition } from "@/schema/dashboard";

const createTabId = (dashboard: DashboardSchema) => {
  const ids = new Set(dashboard.tabs.map((tab) => tab.id));
  let index = dashboard.tabs.length + 1;
  while (ids.has(`tab-${index}`)) index += 1;
  return `tab-${index}`;
};

const moveItem = <Item>(items: Item[], index: number, direction: -1 | 1) => {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
  return nextItems;
};

export const useTabActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editTabs = (tabs: DashboardSchema["tabs"]) => editDashboard({ ...draft, tabs });

    return {
      add: () =>
        editTabs([
          ...draft.tabs,
          {
            id: createTabId(draft),
            label: "新しいタブ",
            layout: { type: "grid", columns: 1 },
            contents: [],
          },
        ]),
      update: (index: number, tab: TabDefinition) =>
        editTabs(draft.tabs.map((current, tabIndex) => (tabIndex === index ? tab : current))),
      move: (index: number, direction: -1 | 1) => editTabs(moveItem(draft.tabs, index, direction)),
      remove: (index: number) => editTabs(draft.tabs.filter((_, tabIndex) => tabIndex !== index)),
    };
  }, [draft, editDashboard]);
