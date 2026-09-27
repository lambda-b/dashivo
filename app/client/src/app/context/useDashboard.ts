import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import source from "#dashboard/dashboard.json";
import { dashboardSchema, type DashboardSchema } from "@shared/dashboard";

const bundledDashboard = dashboardSchema.parse(source);

export const dashboardQueryKey = ["dashboard"] as const;
export const DashboardIdContext = createContext("");
export const useDashboardId = () => useContext(DashboardIdContext);

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

const useEditorDashboard = () => {
  const id = useDashboardId();
  return useQuery({
    queryKey: [...dashboardQueryKey, id],
    queryFn: async ({ signal }) =>
      (await import("@/builder/api/dashboard")).loadDashboard(id, { signal }),
    initialData: () => bundledDashboard,
    staleTime: Infinity,
  }).data;
};

export const useSavedDashboard =
  import.meta.env.MODE === "viewer" ? () => bundledDashboard : useEditorDashboard;

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard ?? bundledDashboard;
};
