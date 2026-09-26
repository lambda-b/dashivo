import { apiErrorSchema, downloadEndpoint } from "@shared/api";

export const downloadDashboardFile = async () => {
  const response = await fetch(downloadEndpoint, { method: "POST" });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => undefined);
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "HTMLを生成できませんでした。");
  }

  return response.blob();
};
