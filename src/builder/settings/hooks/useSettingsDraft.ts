import { useState } from "react";
import { useSavedDashboard, getDashboard } from "@/app/context/useDashboard";
import type { DashboardSchema } from "@/schema/dashboard";

export const settingsOf = ({ analysis: _analysis, ...settings }: DashboardSchema) => settings;

export const useSettingsDraft = () => {
  const saved = useSavedDashboard();
  const [settings, setSettings] = useState(() => settingsOf(saved));

  return {
    draft: { ...settings, analysis: saved.analysis },
    update: (dashboard: DashboardSchema) => setSettings(settingsOf(dashboard)),
    reset: () => setSettings(settingsOf(getDashboard())),
  };
};
