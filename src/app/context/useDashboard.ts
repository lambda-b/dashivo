import { createContext, useContext, useSyncExternalStore } from "react";
import source from "#dashboard/dashboard.json";
import { dashboardSchema, type DashboardSchema } from "@/schema/dashboard";

let saved = dashboardSchema.parse(source);
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getDashboard = () => saved;

export const setDashboard = (dashboard: DashboardSchema) => {
  saved = dashboardSchema.parse(dashboard);
  listeners.forEach((listener) => listener());
};

export const DashboardPreviewContext = createContext<DashboardSchema | null>(null);

export const useSavedDashboard = () => useSyncExternalStore(subscribe, getDashboard);

export const useDashboard = () => {
  const savedDashboard = useSavedDashboard();
  return useContext(DashboardPreviewContext) ?? savedDashboard;
};
