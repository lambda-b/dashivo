import { createContext, useContext } from "react";
import { useQuery } from "@dashivo/shared-lib/query";
import source from "#dashboard/dashboard.json";
import { dashboardSchema, type DashboardSchema } from "@shared/dashboard";
import { messages } from "@/messages";

const bundledDashboard = dashboardSchema.parse(source);

export const dashboardQueryKey = ["dashboard"] as const;
export const DashboardIdContext = createContext("");
export const useDashboardId = () => useContext(DashboardIdContext);

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

const useEditorDashboard = () => {
  const id = useDashboardId();
  return useQuery({
    queryKey: [...dashboardQueryKey, id],
    queryFn: async ({ signal }) => (await import("@/api/dashboard")).loadDashboard(id, { signal }),
    initialData: () => bundledDashboard,
    staleTime: Infinity,
    meta: { errorMessage: messages.dashboard.loadFailed, errorBoundary: true },
  }).data;
};

export const useSavedDashboard =
  import.meta.env.MODE === "viewer" ? () => bundledDashboard : useEditorDashboard;

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard ?? bundledDashboard;
};
