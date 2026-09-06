import { MetricCard } from "@/components/contents/MetricCard";
import { ChartPanel } from "@/components/contents/chart/ChartPanel";
import { DataTable } from "@/components/contents/table/DataTable";
import type { AnalysisResult, ContentDefinition, TabDefinition } from "@/schema/dashboard";

interface DashboardContentProps {
  tab: TabDefinition;
  result: AnalysisResult;
}

interface ContentProps {
  content: ContentDefinition;
  result: AnalysisResult;
}

const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
} as const;

const Content = ({ content, result }: ContentProps) => {
  switch (content.type) {
    case "metric":
      return <MetricCard definition={content} value={result.metrics[content.metric] ?? 0} />;
    case "chart":
      return <ChartPanel definition={content} data={result.datasets[content.dataset] ?? []} />;
    case "table":
      return <DataTable definition={content} data={result.datasets[content.dataset] ?? []} />;
  }
};

export const DashboardContent = ({ tab, result }: DashboardContentProps) => (
  <section className={`grid gap-5 ${gridColumns[tab.layout.columns]}`}>
    {tab.contents.map((content) => (
      <Content content={content} key={content.id} result={result} />
    ))}
  </section>
);
