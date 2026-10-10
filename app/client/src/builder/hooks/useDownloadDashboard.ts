import { useMutation } from "@dashivo/shared-lib/query";
import { useWorkspace } from "@/storage/context";
import { ApiError } from "@/api/request";
import { useDashboardId } from "@/app/context/useDashboard";
import { messages } from "@/messages";

export const useDownloadDashboard = () => {
  const dashboardId = useDashboardId();
  const { authenticated, storage } = useWorkspace();

  const download = useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.dashboard.downloadFailed },
    mutationFn: () => {
      if (!authenticated) throw new ApiError(messages.auth.downloadRequiresLogin, 401);
      return storage.downloadDashboardFile(dashboardId);
    },
    onSuccess: (url) => {
      const link = document.createElement("a");

      link.href = url;
      link.download = `${dashboardId}.html`;
      link.referrerPolicy = "no-referrer";
      document.body.append(link);
      link.click();
      link.remove();
    },
  });

  return {
    download: authenticated ? () => download.mutate() : undefined,
    isPending: download.isPending,
  };
};
