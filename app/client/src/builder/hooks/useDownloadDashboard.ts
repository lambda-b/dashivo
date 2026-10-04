import { useMutation } from "@tanstack/react-query";
import { downloadDashboardFile } from "@/api/download";
import { useDashboardId } from "@/app/context/useDashboard";

export const useDownloadDashboard = () => {
  const dashboardId = useDashboardId();

  return useMutation({
    mutationFn: () => downloadDashboardFile(dashboardId),
    onSuccess: (dashboard) => {
      const url = URL.createObjectURL(dashboard);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${dashboardId}.html`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });
};
