import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import source from "#dashboard/dashboard.json";
import { loadDashboard } from "@/builder/api/dashboard";
import { appTarget } from "virtual:dashlet/app-target";
import { dashboardSchema, type DashboardSchema } from "@shared/dashboard";

export const dashboardQueryKey = ["dashboard"] as const;
export const DashboardIdContext = createContext("sales-overview");
export const useDashboardId = () => useContext(DashboardIdContext);

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

export const useSavedDashboard = () => {
  const id = useDashboardId();
  return useQuery({
    queryKey: [...dashboardQueryKey, id],
    queryFn: ({ signal }) => loadDashboard(id, { signal }),
    initialData: () => dashboardSchema.parse(source),
    enabled: appTarget === "editor",
    staleTime: Infinity,
  }).data;
};

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard ?? dashboardSchema.parse(source);
};
