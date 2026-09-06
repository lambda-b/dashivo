import { useMemo } from "react";
import type { ContentDefinition, DashboardSchema } from "@/schema/dashboard";

export type ContentType = ContentDefinition["type"];

const createContentId = (dashboard: DashboardSchema, type: ContentType) => {
  const ids = new Set(dashboard.tabs.flatMap((tab) => tab.contents.map((content) => content.id)));
  let index = 1;
  while (ids.has(`${type}-${index}`)) index += 1;
  return `${type}-${index}`;
};

export const createContent = (dashboard: DashboardSchema, type: ContentType): ContentDefinition => {
  const id = createContentId(dashboard, type);
  const outputType = type === "metric" ? "metrics" : "datasets";
  const logic =
    dashboard.analysis.logic.find((candidate) => candidate.outputs[outputType].length > 0) ??
    dashboard.analysis.logic[0];
  const logicId = logic?.id ?? "logic";
  const output = logic?.outputs[outputType][0] ?? (type === "metric" ? "metric" : "dataset");

  switch (type) {
    case "metric":
      return {
        id,
        type,
        title: "新しい指標",
        logic: logicId,
        metric: output,
        format: "number",
        emphasis: "accent",
      };
    case "chart":
      return {
        id,
        type,
        title: "新しいグラフ",
        logic: logicId,
        dataset: output,
        formatting: {
          colors: ["#ca2420", "#e85d3f", "#f59e0b", "#78716c"],
          legend: { visible: false, position: "bottom" },
          gridLines: true,
          xAxis: { title: "", format: "auto", minimum: null, maximum: null },
          yAxis: { title: "", format: "number", minimum: null, maximum: null },
        },
        chart: { type: "line", x: "x", y: ["y"] },
      };
    case "table":
      return {
        id,
        type,
        title: "新しいテーブル",
        logic: logicId,
        dataset: output,
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
