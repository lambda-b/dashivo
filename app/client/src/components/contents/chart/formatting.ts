import type { AxisFormattingDefinition, ChartFormattingDefinition } from "@shared/dashboard";

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

export const getLegendProps = (legend: ChartFormattingDefinition["legend"]) => ({
  position: legend.position,
  offset: 16,
  wrapperStyle: { fontSize: 12, lineHeight: "20px" },
});

export const chartMargin = { top: 16, bottom: 8, left: 8, right: 24 };

export const getXAxisProps = (axis: AxisFormattingDefinition) => ({
  tickFormatter: (value: unknown) => formatChartValue(value, axis.format),
  tickLine: false,
  axisLine: false,
  tickMargin: 10,
  minTickGap: 32,
  interval: "preserveStartEnd" as const,
  height: axis.title ? 64 : 40,
  label: axis.title
    ? { value: axis.title, position: "insideBottom" as const, offset: 0 }
    : undefined,
});

export const getYAxisProps = (axis: AxisFormattingDefinition) => ({
  domain: getAxisDomain(axis),
  tickFormatter: (value: unknown) => formatChartValue(value, axis.format),
  tickLine: false,
  axisLine: false,
  tickMargin: 10,
  width: axis.title ? 112 : 88,
  label: axis.title
    ? { value: axis.title, angle: -90, position: "insideLeft" as const }
    : undefined,
});
