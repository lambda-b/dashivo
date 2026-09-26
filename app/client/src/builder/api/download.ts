import { apiErrorSchema, buildEndpoint } from "@dashlet/shared/api";

export const buildDashboardFile = async () => {
  const response = await fetch(buildEndpoint, { method: "POST" });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => undefined);
    throw new Error(apiErrorSchema.safeParse(result).data?.error ?? "HTMLを生成できませんでした。");
  }

  return response.blob();
};
