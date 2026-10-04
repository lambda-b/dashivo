import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardIdContext, dashboardQueryKey } from "@/app/context/useDashboard";
import { Dashboard } from "@/app/Dashboard";
import { DashboardBuilder } from "@/builder/DashboardBuilder";
import { createDashboard, loadDashboards } from "@/api/dashboards";
import { loadDashboard } from "@/api/dashboard";
import { DashboardSidebar } from "@/layouts/DashboardSidebar";
import type { ParameterValue } from "@shared/dashboard";

const DashboardWorkspace = ({ dashboardId }: { dashboardId: string }) => {
  const [params, setParams] = useState<Record<string, ParameterValue>>({});
  const selected = useQuery({
    queryKey: [...dashboardQueryKey, dashboardId],
    queryFn: ({ signal }) => loadDashboard(dashboardId, { signal }),
    staleTime: Infinity,
    refetchOnMount: "always",
  });

  const onParameterChange = (key: string, value: ParameterValue) =>
    setParams((current) => ({ ...current, [key]: value }));

  if (selected.isFetching) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-stone-500">
        ダッシュボードを読み込み中…
      </div>
    );
  }

  if (selected.error) {
    return (
      <div role="alert" className="p-8 text-sm text-red-700">
        {selected.error.message}
      </div>
    );
  }

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dashboards = useQuery({
    queryKey: ["dashboards"],
    queryFn: loadDashboards,
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

  return (
    <div className="min-h-screen bg-stone-100">
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
      <div className={sidebarOpen ? "lg:ml-72" : "ml-12"}>
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

export default EditorApp;
