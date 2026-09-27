import { dashboardDownloadEndpoint } from "@shared/api";
import { requestBlob } from "@/builder/api/request";

export const downloadDashboardFile = async (id: string) => {
  return requestBlob(
    dashboardDownloadEndpoint(id),
    { method: "POST" },
    "HTMLを生成できませんでした。",
  );
};
