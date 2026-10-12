import { createContext, useContext } from "react";
import { useSuspenseQuery } from "@dashivo/shared-lib/query";
import { dashboard as bundledDashboard } from "virtual:dashivo/dashboard";
import type { DashboardSchema } from "@shared/dashboard";
import { messages } from "@/messages";
import { useWorkspace } from "@/storage/context";

export const dashboardQueryKey = ["dashboard"] as const;
export const DashboardIdContext = createContext("");
export const useDashboardId = () => useContext(DashboardIdContext);

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

const useEditorDashboard = () => {
  const id = useDashboardId();
  const { storage, queryKey } = useWorkspace();
  return useSuspenseQuery({
    queryKey: queryKey(...dashboardQueryKey, id),
    queryFn: ({ signal }) => storage.loadDashboard(id, { signal }),
    staleTime: Infinity,
    meta: { errorMessage: messages.dashboard.loadFailed, errorBoundary: true },
  }).data;
};

export const useSavedDashboard =
  import.meta.env.MODE === "viewer" ? () => bundledDashboard : useEditorDashboard;

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard;
};
