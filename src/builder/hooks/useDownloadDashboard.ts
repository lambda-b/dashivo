import { useMutation } from "@tanstack/react-query";
import { buildDashboardFile } from "@/builder/api/download";

export const useDownloadDashboard = () =>
  useMutation({
    mutationFn: buildDashboardFile,
    onSuccess: (dashboard) => {
      const url = URL.createObjectURL(dashboard);
      const link = document.createElement("a");

      link.href = url;
      link.download = "dashboard.html";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });
