import { Plus } from "lucide-react";
import { EditButton } from "@/components/primitives/EditButton";
import { MetricCard } from "@/components/contents/MetricCard";
import { ChartPanel } from "@/components/contents/chart/ChartPanel";
import { DataTable } from "@/components/contents/table/DataTable";
import type {
  AnalysisResult,
  AnalysisResults,
  ContentDefinition,
  TabDefinition,
} from "@/schema/dashboard";

interface DashboardContentProps {
  onAddContent?: () => void;
  onEditContent?: (contentIndex: number) => void;
  tab: TabDefinition;
  results: AnalysisResults;
}

interface ContentProps {
  content: ContentDefinition;
  result: AnalysisResult;
}

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
  results,
}: DashboardContentProps) => (
  <section className="grid grid-cols-1 gap-5">
    {tab.contents.length > 0 ? (
      tab.contents.map((content, contentIndex) => (
        <div className="relative min-w-0" key={content.id}>
          <Content content={content} result={results[content.logic]} />
          {onEditContent && (
            <div className="absolute top-3 right-3 z-10 drop-shadow-sm">
              <EditButton
                ariaLabel={`${content.title}を編集`}
                onClick={() => onEditContent(contentIndex)}
                size="compact"
              >
                編集
              </EditButton>
            </div>
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
