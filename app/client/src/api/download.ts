import { dashboardDownloadEndpoint } from "@shared/api";
import { requestBlob } from "@/api/request";
import { messages } from "@/messages";

export const downloadDashboardFile = async (id: string) => {
  return requestBlob(
    dashboardDownloadEndpoint(id),
    { method: "POST" },
    messages.dashboard.downloadFailed,
  );
};
