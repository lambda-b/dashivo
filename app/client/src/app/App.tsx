import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  DashboardIdContext,
  dashboardQueryKey,
  useDashboard,
  useDashboardId,
} from "@/app/context/useDashboard";
import { DashboardBuilder, type BuilderActions } from "@/builder/DashboardBuilder";
import { createDashboard, loadDashboards } from "@/builder/api/dashboards";
import { loadDashboard } from "@/builder/api/dashboard";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { ParameterArea } from "@/layouts/ParameterArea";
import { LogicArea } from "@/layouts/LogicArea";
import { ContentArea } from "@/layouts/ContentArea";
import { DashboardSidebar } from "@/layouts/DashboardSidebar";
import { analysisPort } from "@/ports/analysis";
import type { ParameterValue } from "@shared/dashboard";
import { validateContentBindings } from "@/schema/validation";
import { appTarget } from "virtual:dashlet/app-target";

const Dashboard = ({
  actions,
  params,
  onParameterChange,
}: {
  actions?: BuilderActions;
  params: Record<string, ParameterValue>;
  onParameterChange: (key: string, value: ParameterValue) => void;
}) => {
  const dashboard = useDashboard();
  const dashboardId = useDashboardId();
  const values = Object.fromEntries(
    dashboard.controls.map((control) => [control.key, params[control.key] ?? control.defaultValue]),
  );

  const analysis = useQuery({
    queryKey: ["analysis", dashboard.analysis, values],
    queryFn: () => analysisPort.execute(values, dashboard.analysis, dashboardId),
    select: (result) => validateContentBindings(dashboard, result),
    retry: false,
  });

  return (
    <main className="min-h-screen bg-stone-100">
      <DashboardHeader
        analysis={analysis}
        download={actions?.download}
        downloadError={actions?.downloadError}
        downloadPending={actions?.downloadPending}
        onEditHeader={actions?.openHeader}
      />
      <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="grid gap-4 lg:sticky lg:top-5">
            <ParameterArea
              params={values}
              onChange={onParameterChange}
              onEditParameters={actions?.openParameters}
            />
            {actions && <LogicArea onEditAnalysis={actions.openAnalysis} />}
          </div>
          <ContentArea
            analysis={analysis}
            onAddContent={actions?.addContent}
            onEditContent={actions?.editContent}
            onEditTabs={actions?.openTabs}
          />
        </div>
      </div>
    </main>
  );
};

const DashboardWorkspace = ({ dashboardId }: { dashboardId: string }) => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  const selected = useQuery({
    queryKey: [...dashboardQueryKey, dashboardId],
    queryFn: ({ signal }) => loadDashboard(dashboardId, { signal }),
    enabled: appTarget === "editor",
    staleTime: Infinity,
    refetchOnMount: "always",
  });

  const onParameterChange = (key: string, value: ParameterValue) =>
    setParams((current) => ({ ...current, [key]: value }));

  if (appTarget === "editor" && selected.isFetching) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-stone-500">
        ダッシュボードを読み込み中…
      </div>
    );
  }

  if (appTarget === "editor" && selected.error) {
    return (
      <div role="alert" className="p-8 text-sm text-red-700">
        {selected.error.message}
      </div>
    );
  }

  return (
    <DashboardIdContext.Provider value={dashboardId}>
      {appTarget === "editor" ? (
        <DashboardBuilder>
          {(actions) => (
            <Dashboard
              key={dashboardId}
              actions={actions}
              params={params}
              onParameterChange={onParameterChange}
            />
          )}
        </DashboardBuilder>
      ) : (
        <Dashboard key={dashboardId} params={params} onParameterChange={onParameterChange} />
      )}
    </DashboardIdContext.Provider>
  );
};

const App = () => {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dashboards = useQuery({
    queryKey: ["dashboards"],
    queryFn: loadDashboards,
    enabled: appTarget === "editor",
  });
  const create = useMutation({
    mutationFn: createDashboard,
    onSuccess: async (dashboard) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      navigate(`/d/${dashboard.id}`);
    },
  });

  useEffect(() => {
    if (!dashboardId && dashboards.data?.[0])
      navigate(`/d/${dashboards.data[0].id}`, { replace: true });
  }, [dashboardId, dashboards.data, navigate]);

  if (appTarget !== "editor") {
    return <DashboardWorkspace dashboardId="sales-overview" />;
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {appTarget === "editor" && (
        <DashboardSidebar
          activeId={dashboardId}
          open={sidebarOpen}
          dashboards={dashboards.data}
          error={dashboards.error?.message}
          loading={dashboards.isLoading}
          createError={create.error?.message}
          creating={create.isPending}
          onCreate={(title) => create.mutate(title)}
          onOpenChange={setSidebarOpen}
          onSelect={(id) => navigate(`/d/${id}`)}
        />
      )}
      <div className={appTarget === "editor" ? (sidebarOpen ? "lg:ml-72" : "ml-12") : ""}>
        {dashboardId ? (
          <DashboardWorkspace key={dashboardId} dashboardId={dashboardId} />
        ) : (
          <div className="grid min-h-screen place-items-center text-sm text-stone-500">
            {dashboards.isLoading
              ? "ダッシュボードを読み込み中…"
              : "ダッシュボードを作成してください。"}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
