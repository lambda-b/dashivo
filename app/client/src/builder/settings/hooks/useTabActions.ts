import { moveItem } from "@dashivo/shared-utils/moveItem";
import { createUniqueIndexedName } from "@dashivo/shared-utils/createUniqueIndexedName";
import type { DashboardSchema, TabDefinition } from "@shared/dashboard";

export const useTabActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) => {
  const editTabs = (tabs: DashboardSchema["tabs"]) => editDashboard({ ...draft, tabs });

  return {
    add: () =>
      editTabs([
        ...draft.tabs,
        {
          id: createUniqueIndexedName(
            draft.tabs.map((tab) => tab.id),
            "tab-",
          ),
          label: "新しいタブ",
          contents: [],
        },
      ]),
    update: (index: number, tab: TabDefinition) =>
      editTabs(draft.tabs.map((current, tabIndex) => (tabIndex === index ? tab : current))),
    move: (index: number, direction: -1 | 1) => editTabs(moveItem(draft.tabs, index, direction)),
    remove: (index: number) => editTabs(draft.tabs.filter((_, tabIndex) => tabIndex !== index)),
  };
};
