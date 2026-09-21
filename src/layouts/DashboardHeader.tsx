import clsx from "clsx";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";
export const DashboardHeader = ({
  onEditHeader,
  analysis,
}: {
  onEditHeader?: () => void;
  analysis: { isPending: boolean; isError: boolean };
}) => {
  const dashboard = useDashboard();
  return (
    <header className="border-b border-stone-200 bg-white/85 px-5 py-6 backdrop-blur-sm sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 max-sm:flex-col">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-brand grid size-7 place-items-center rounded-md text-[0.625rem] font-black text-white">
              D
            </span>
            <p className="text-brand text-[0.6875rem] font-bold tracking-[0.16em]">
              DASHLET{import.meta.env.DEV && " · BUILDER PREVIEW"}
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{dashboard.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{dashboard.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:justify-start">
          {onEditHeader && <EditButton onClick={onEditHeader}>ヘッダーを編集</EditButton>}
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
            <i
              className={clsx(
                "h-2 w-2 rounded-full",
                analysis.isPending
                  ? "animate-pulse bg-amber-500"
                  : analysis.isError
                    ? "bg-red-600"
                    : "bg-emerald-600 shadow-[0_0_0_3px_#dcece4]",
              )}
            />
            {analysis.isPending
              ? "Pythonを準備中"
              : analysis.isError
                ? "実行エラー"
                : "オフライン実行中"}
          </span>
        </div>
      </div>
    </header>
  );
};
