import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createDashboard } from "@/api/dashboards";
import { dashboardQueryKey } from "@/app/context/useDashboard";
import { messages } from "@/messages";

export const useDashboardActions = () => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    meta: { errorMessage: messages.dashboard.createFailed },
    mutationFn: createDashboard,
    onSuccess: async (dashboard) => {
      await client.invalidateQueries({ queryKey: ["dashboards"] });
      await client.invalidateQueries({ queryKey: dashboardQueryKey });
      navigate(`/d/${dashboard.id}`);
    },
  });

  return {
    createDashboard: (title: string) => create.mutate(title),
    isPending: create.isPending,
  };
};
