import { apiErrorSchema, dashboardDownloadEndpoint } from "@shared/api";

export const downloadDashboardFile = async (id: string) => {
  const response = await fetch(dashboardDownloadEndpoint(id), { method: "POST" });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => undefined);
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "HTMLを生成できませんでした。");
  }

  return response.blob();
};
