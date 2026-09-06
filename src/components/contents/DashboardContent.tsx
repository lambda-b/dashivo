import { Plus } from "lucide-react";
import { EditButton } from "@/components/EditButton";
import { MetricCard } from "@/components/contents/MetricCard";
import { ChartPanel } from "@/components/contents/chart/ChartPanel";
import { DataTable } from "@/components/contents/table/DataTable";
import type { AnalysisResult, ContentDefinition, TabDefinition } from "@/schema/dashboard";

interface DashboardContentProps {
  onAddContent?: () => void;
  onEditContent?: (contentIndex: number) => void;
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

export const DashboardContent = ({
  onAddContent,
  onEditContent,
  tab,
  result,
}: DashboardContentProps) => (
  <section className={`grid gap-5 ${gridColumns[tab.layout.columns]}`}>
    {tab.contents.length > 0 ? (
      tab.contents.map((content, contentIndex) => (
        <div className="relative min-w-0" key={content.id}>
          <Content content={content} result={result} />
          {onEditContent && (
            <EditButton
              ariaLabel={`${content.title}を編集`}
              className="absolute top-3 right-3 z-10 px-2 py-1 shadow-sm"
              onClick={() => onEditContent(contentIndex)}
            >
              編集
            </EditButton>
          )}
        </div>
      ))
    ) : (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
        このタブにはコンテンツがありません。
      </p>
    )}
    {onAddContent && (
      <button
        aria-label={`${tab.label}にコンテンツを追加`}
        className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-6 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
        onClick={onAddContent}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        コンテンツを追加
      </button>
    )}
  </section>
);
