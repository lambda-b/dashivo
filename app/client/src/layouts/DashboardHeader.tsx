import { Button } from "@/components/primitives/Button";
import { AppBrand } from "@/components/AppBrand";

import { Download } from "lucide-react";
import { useDashboard } from "@/app/context/useDashboard";
import { EditButton } from "@/components/primitives/EditButton";
import { useContext } from "react";
import { useQuery } from "@dashivo/shared-lib/query";
import { useDashboardId } from "@/app/context/useDashboard";
import { WorkspaceContext, useWorkspace } from "@/storage/context";
import { messages } from "@/messages";

const SampleBadge = () => {
  const id = useDashboardId();
  const { storage, queryKey } = useWorkspace();
  const { data } = useQuery({
    queryKey: queryKey("dashboards"),
    queryFn: ({ signal }) => storage.loadDashboards({ signal }),
    meta: { errorMessage: messages.dashboard.listLoadFailed },
  });

  return data?.find((item) => item.id === id)?.sample ? (
    <span className="mb-2 inline-block rounded border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-600">
      サンプル
    </span>
  ) : null;
};

export const DashboardHeader = ({
  onEditHeader,
  download,
  downloadPending,
}: {
  onEditHeader?: () => void;
  download?: () => void;
  downloadPending?: boolean;
}) => {
  const dashboard = useDashboard();
  const workspace = useContext(WorkspaceContext);

  return (
    <header className="border-b border-stone-200 bg-white/85 px-5 py-6 backdrop-blur-sm sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 max-sm:flex-col">
        <div>
          <AppBrand
            caption={import.meta.env.MODE !== "viewer" ? "BUILDER PREVIEW" : undefined}
            className="mb-2"
          />
          {workspace && !workspace.authenticated && <SampleBadge />}
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{dashboard.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">{dashboard.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:justify-start">
          {download && (
            <Button
              icon={Download}
              pending={downloadPending}
              onClick={download}
              title="保存済みの設定とPythonから生成します"
            >
              {downloadPending ? "HTMLを生成中…" : "HTMLをダウンロード"}
            </Button>
          )}
          {onEditHeader && <EditButton onClick={onEditHeader}>ヘッダーを編集</EditButton>}
        </div>
      </div>
    </header>
  );
};
