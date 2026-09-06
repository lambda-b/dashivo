import { useMemo } from "react";
import type { ContentDefinition, DashboardSchema } from "@/schema/dashboard";

export type ContentType = ContentDefinition["type"];

const createContentId = (dashboard: DashboardSchema, type: ContentType) => {
  const ids = new Set(dashboard.tabs.flatMap((tab) => tab.contents.map((content) => content.id)));
  let index = 1;
  while (ids.has(`${type}-${index}`)) index += 1;
  return `${type}-${index}`;
};

const createContent = (dashboard: DashboardSchema, type: ContentType): ContentDefinition => {
  const id = createContentId(dashboard, type);

  switch (type) {
    case "metric":
      return {
        id,
        type,
        title: "新しい指標",
        metric: "metric_name",
        format: "number",
        emphasis: "accent",
      };
    case "chart":
      return {
        id,
        type,
        title: "新しいグラフ",
        dataset: "dataset_name",
        chart: { type: "line", x: "x", y: ["y"] },
      };
    case "table":
      return {
        id,
        type,
        title: "新しいテーブル",
        dataset: "dataset_name",
        columns: [{ key: "column", label: "列" }],
      };
  }
};

const moveItem = <Item>(items: Item[], index: number, direction: -1 | 1) => {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const nextItems = [...items];
  [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
  return nextItems;
};

export const useContentActions = (
  draft: DashboardSchema,
  editDashboard: (dashboard: DashboardSchema) => void,
) =>
  useMemo(() => {
    const editContents = (
      tabIndex: number,
      update: (contents: ContentDefinition[]) => ContentDefinition[],
    ) =>
      editDashboard({
        ...draft,
        tabs: draft.tabs.map((tab, index) =>
          index === tabIndex ? { ...tab, contents: update(tab.contents) } : tab,
        ),
      });

    return {
      add: (tabIndex: number, type: ContentType) => {
        const content = createContent(draft, type);
        editContents(tabIndex, (contents) => [...contents, content]);
        return content;
      },
      update: (tabIndex: number, contentIndex: number, content: ContentDefinition) =>
        editContents(tabIndex, (contents) =>
          contents.map((current, index) => (index === contentIndex ? content : current)),
        ),
      move: (tabIndex: number, contentIndex: number, direction: -1 | 1) =>
        editContents(tabIndex, (contents) => moveItem(contents, contentIndex, direction)),
      remove: (tabIndex: number, contentIndex: number) =>
        editContents(tabIndex, (contents) => contents.filter((_, index) => index !== contentIndex)),
    };
  }, [draft, editDashboard]);
