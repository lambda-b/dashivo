import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@dashivo/shared-lib/query";
import { useNavigate } from "react-router-dom";
import { registerTrial } from "@/storage/browser";
import { messages } from "@/messages";

export const useRegisterTrial = (authenticated: boolean, scope: string) => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const registration = useMutation({
    mutationKey: ["workspace", "register-trial"],
    scope: { id: `register-trial:${scope}` },
    mutationFn: () => registerTrial(scope),
    meta: { errorMessage: messages.dashboard.registerFailed },
    onSuccess: async (dashboard) => {
      await client.invalidateQueries({ queryKey: ["workspace", scope, "dashboards"] });
      if (dashboard) navigate(`/d/${dashboard.id}`, { replace: true });
    },
  });
  const { mutate } = registration;

  useEffect(() => {
    if (authenticated) mutate();
  }, [authenticated, mutate]);

  return { ...registration, register: mutate };
};
