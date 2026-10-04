import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@dashivo/shared-lib/query";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardIdContext, dashboardQueryKey } from "@/app/context/useDashboard";
import { Dashboard } from "@/app/Dashboard";
import { DashboardBuilder } from "@/builder/DashboardBuilder";
import { loadDashboards } from "@/api/dashboards";
import { useDashboardActions } from "@/app/hooks/useDashboardActions";
import { loadDashboard } from "@/api/dashboard";
import { DashboardSidebar } from "@/layouts/DashboardSidebar";
import type { ParameterValue } from "@shared/dashboard";
import { QueryBoundary } from "@/components/feedback/QueryBoundary";
import { messages } from "@/messages";

const DashboardList = () => {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { data: dashboards } = useSuspenseQuery({
    queryKey: ["dashboards"],
    queryFn: loadDashboards,
    meta: { errorMessage: messages.dashboard.listLoadFailed, errorBoundary: true },
  });

  useEffect(() => {
    if (!dashboardId && dashboards[0]) navigate(`/d/${dashboards[0].id}`, { replace: true });
  }, [dashboardId, dashboards, navigate]);

  return dashboards.map((dashboard) => (
    <button
      aria-current={dashboardId === dashboard.id ? "page" : undefined}
      className={`truncate rounded-md px-3 py-2.5 text-left text-sm ${dashboardId === dashboard.id ? "bg-red-50 font-semibold text-red-800" : "text-stone-700 hover:bg-stone-100"}`}
      key={dashboard.id}
      onClick={() => navigate(`/d/${dashboard.id}`)}
      type="button"
    >
      {dashboard.title}
    </button>
  ));
};

const DashboardWorkspace = ({ dashboardId }: { dashboardId: string }) => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  useSuspenseQuery({
    queryKey: [...dashboardQueryKey, dashboardId],
    queryFn: ({ signal }) => loadDashboard(dashboardId, { signal }),
    staleTime: Infinity,
    refetchOnMount: "always",
    meta: { errorMessage: messages.dashboard.loadFailed, errorBoundary: true },
  });

  const onParameterChange = (key: string, value: ParameterValue) =>
    setParams((current) => ({ ...current, [key]: value }));

  return (
    <DashboardIdContext.Provider value={dashboardId}>
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
    </DashboardIdContext.Provider>
  );
};

const EditorApp = () => {
  const { dashboardId } = useParams();
  const { createDashboard, isPending } = useDashboardActions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-stone-100">
      <DashboardSidebar
        open={sidebarOpen}
        creating={isPending}
        onCreate={createDashboard}
        onOpenChange={setSidebarOpen}
      >
        <QueryBoundary errorMessage={messages.dashboard.listLoadFailed}>
          <DashboardList />
        </QueryBoundary>
      </DashboardSidebar>
      <div className={sidebarOpen ? "lg:ml-72" : "ml-12"}>
        {dashboardId ? (
          <QueryBoundary key={dashboardId} errorMessage={messages.dashboard.loadFailed}>
            <DashboardWorkspace dashboardId={dashboardId} />
          </QueryBoundary>
        ) : (
          <div className="grid min-h-screen place-items-center text-sm text-stone-500">
            ダッシュボードを作成してください。
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorApp;
