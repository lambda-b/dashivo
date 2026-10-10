import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/storage/context";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { messages } from "@/messages";

export const useDashboardActions = () => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { storage, queryKey } = useWorkspace();
  const create = useMutation({
    mutationKey: ["workspace"],
    meta: { errorMessage: messages.dashboard.createFailed },
    mutationFn: storage.createDashboard,
    onSuccess: async (dashboard) => {
      await client.invalidateQueries({ queryKey: queryKey("dashboards") });
      await client.invalidateQueries({ queryKey: queryKey(...dashboardQueryKey) });
      navigate(`/d/${dashboard.id}`);
    },
  });

  return {
    createDashboard: (title: string) => create.mutate(title),
    isPending: create.isPending,
  };
};
