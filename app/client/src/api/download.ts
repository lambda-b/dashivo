import { dashboardDownloadEndpoint, dashboardDownloadResponseSchema } from "@shared/api";
import { requestJson } from "@/api/request";
import { messages } from "@/messages";

export const downloadDashboardFile = async (id: string) => {
  const response = await requestJson(
    dashboardDownloadEndpoint(id),
    { method: "POST" },
    messages.dashboard.downloadFailed,
  );

  return dashboardDownloadResponseSchema.parse(response).url;
};
