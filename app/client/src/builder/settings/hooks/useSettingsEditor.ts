import { useState } from "react";
import { z } from "zod";
import { dashboardSchema, type DashboardSchema, type DashboardSettings } from "@shared/dashboard";
import { useSaveDashboard } from "@/builder/hooks/useSaveDashboard";
import { useSavedDashboard } from "@/app/context/useDashboard";
import { createContentPlacement } from "@/builder/settings/hooks/useContentActions";
import { messages } from "@/messages";

const settingsOf = ({ analysis: _analysis, ...settings }: DashboardSchema) => settings;

export const useSettingsEditor = () => {
  const saved = useSavedDashboard();
  const [settings, setSettings] = useState(() => settingsOf(saved));
  const save = useSaveDashboard();
  const [preview, setPreview] = useState<DashboardSettings>();
  const [validationError, setValidationError] = useState("");

  const draft = { ...settings, analysis: saved.analysis };
  const update = (dashboard: DashboardSchema) => setSettings(settingsOf(dashboard));

  const validate = (dashboard: DashboardSchema) => {
    const result = dashboardSchema.safeParse(dashboard);
    setValidationError(
      result.success ? "" : messages.settings.invalid(z.prettifyError(result.error)),
    );
    return result.success ? result.data : undefined;
  };

  const applyPreview = () => {
    const dashboard = validate(draft);
    if (dashboard) setPreview(settingsOf(dashboard));
  };

  const saveSettings = () => {
    const dashboard = validate(draft);
    if (dashboard) save.mutate({ settings: settingsOf(dashboard) });
  };

  const addContent = (tabIndex: number, logicId: string) => {
    const content = createContentPlacement(draft, logicId);
    const dashboard = validate({
      ...draft,
      tabs: draft.tabs.map((tab, index) =>
        index === tabIndex ? { ...tab, contents: [...tab.contents, content] } : tab,
      ),
    });
    if (!dashboard) return false;

    update(dashboard);
    setPreview(settingsOf(dashboard));
    return true;
  };

  const resetSettings = () => {
    setSettings(settingsOf(saved));
    setPreview(undefined);
    setValidationError("");
    save.reset();
  };

  return {
    draft,
    preview,
    update,
    addContent,
    applyPreview,
    saveSettings,
    resetSettings,
    validationError,
    isPending: save.isPending,
    isSuccess: save.isSuccess,
  };
};
