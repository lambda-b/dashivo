import { useState } from "react";
import { useSuspenseQuery } from "@dashivo/shared-lib/query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardIdContext, dashboardQueryKey } from "@/app/context/useDashboard";
import { Dashboard } from "@/app/Dashboard";
import { DashboardBuilder } from "@/builder/DashboardBuilder";
import { useDashboardActions } from "@/app/hooks/useDashboardActions";
import { WorkspaceContext, useWorkspace } from "@/storage/context";
import { browserStorage } from "@/storage/browser";
import { DashboardSidebar } from "@/layouts/DashboardSidebar";
import type { ParameterValue } from "@shared/dashboard";
import { QueryBoundary } from "@/components/feedback/QueryBoundary";
import { messages } from "@/messages";
import clsx from "clsx";

const useDashboards = () => {
  const { storage, queryKey } = useWorkspace();
  return useSuspenseQuery({
    queryKey: queryKey("dashboards"),
    queryFn: storage.loadDashboards,
    meta: { errorMessage: messages.dashboard.listLoadFailed, errorBoundary: true },
  }).data;
};

const DefaultDashboard = () => {
  const [dashboard] = useDashboards();
  return <Navigate to={`/d/${dashboard.id}`} replace />;
};

const DashboardList = () => {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const dashboards = useDashboards();

  return dashboards.map((dashboard) => (
    <button
      aria-current={dashboardId === dashboard.id ? "page" : undefined}
      className={`truncate rounded-md px-3 py-2.5 text-left text-sm ${dashboardId === dashboard.id ? "bg-red-50 font-semibold text-red-800" : "text-stone-700 hover:bg-stone-100"}`}
      key={dashboard.id}
      onClick={() => navigate(`/d/${dashboard.id}`)}
      type="button"
    >
      {dashboard.title}
      {dashboard.sample && <span className="ml-2 text-xs text-stone-500">サンプル</span>}
    </button>
  ));
};

const DashboardWorkspace = ({ dashboardId }: { dashboardId: string }) => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  const { storage, queryKey } = useWorkspace();
  useSuspenseQuery({
    queryKey: queryKey(...dashboardQueryKey, dashboardId),
    queryFn: ({ signal }) => storage.loadDashboard(dashboardId, { signal }),
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
  const workspace = useWorkspace();
  const { authenticated } = workspace;
  const dashboards = useDashboards();
  const { createDashboard, isPending } = useDashboardActions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentWorkspace =
    authenticated && dashboards.length === 0
      ? { scope: "guest", storage: browserStorage, authenticated: false }
      : workspace;

  return (
    <div className="min-h-screen bg-stone-100">
      {authenticated && (
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
      )}
      <WorkspaceContext.Provider value={contentWorkspace}>
        <div className={clsx(authenticated && (sidebarOpen ? "lg:ml-72" : "ml-12"))}>
          {dashboardId ? (
            <QueryBoundary key={dashboardId} errorMessage={messages.dashboard.loadFailed}>
              <DashboardWorkspace dashboardId={dashboardId} />
            </QueryBoundary>
          ) : (
            <QueryBoundary errorMessage={messages.dashboard.listLoadFailed}>
              <DefaultDashboard />
            </QueryBoundary>
          )}
        </div>
      </WorkspaceContext.Provider>
    </div>
  );
};

export default EditorApp;
