import type { AxisFormattingDefinition, ChartFormattingDefinition } from "@/schema/dashboard";

export const formatChartValue = (value: unknown, format: AxisFormattingDefinition["format"]) => {
  if (format === "auto") return String(value ?? "");
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  if (format === "currency") {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(number);
  }
  if (format === "percent") {
    return new Intl.NumberFormat("ja-JP", { style: "percent", maximumFractionDigits: 2 }).format(
      number,
    );
  }
  return new Intl.NumberFormat("ja-JP").format(number);
};

export const getAxisDomain = (
  axis: AxisFormattingDefinition,
): [number | "auto", number | "auto"] => [axis.minimum ?? "auto", axis.maximum ?? "auto"];

export const getLegendProps = (legend: ChartFormattingDefinition["legend"]) =>
  legend.position === "left" || legend.position === "right"
    ? ({ align: legend.position, layout: "vertical", verticalAlign: "middle" } as const)
    : ({ align: "center", layout: "horizontal", verticalAlign: legend.position } as const);
