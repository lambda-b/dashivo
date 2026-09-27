import { useMemo } from "react";
import type { ContentPlacementDefinition, DashboardSchema } from "@shared/dashboard";
import { createUniqueIndexedName } from "@dashlet/shared/utils/createUniqueIndexedName";

const moveItem = <Item>(items: Item[], index: number, direction: -1 | 1) => {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
  return nextItems;
};

export const createContentPlacement = (
  dashboard: DashboardSchema,
  logic: string,
): ContentPlacementDefinition => {
  const id = createUniqueIndexedName(
    dashboard.tabs.flatMap((tab) => tab.contents.map((content) => content.id)),
    "content-",
  );
  return { id, logic };
};

export const useContentActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editContents = (
      tabIndex: number,
      update: (contents: ContentPlacementDefinition[]) => ContentPlacementDefinition[],
    ) =>
      editDashboard({
        ...draft,
        tabs: draft.tabs.map((tab, index) =>
          index === tabIndex ? { ...tab, contents: update(tab.contents) } : tab,
        ),
      });

    return {
      update: (tabIndex: number, contentIndex: number, content: ContentPlacementDefinition) =>
        editContents(tabIndex, (contents) =>
          contents.map((current, index) => (index === contentIndex ? content : current)),
        ),
      move: (tabIndex: number, contentIndex: number, direction: -1 | 1) =>
        editContents(tabIndex, (contents) => moveItem(contents, contentIndex, direction)),
      remove: (tabIndex: number, contentIndex: number) =>
        editContents(tabIndex, (contents) => contents.filter((_, index) => index !== contentIndex)),
    };
  }, [draft, editDashboard]);
