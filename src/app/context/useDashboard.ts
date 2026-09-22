import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import source from "#dashboard/dashboard.json";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

export const dashboardQueryKey = ["dashboard"] as const;

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

export const useSavedDashboard = () =>
  useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => dashboardSchema.parse(source),
    initialData: () => dashboardSchema.parse(source),
    enabled: false,
    staleTime: Infinity,
  }).data;

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard;
};
