import { useMutation } from "@tanstack/react-query";
import { messages } from "@/messages";

export const useCopyReference = () => {
  const copy = useMutation({
    meta: { errorMessage: messages.clipboard.copyFailed },
    mutationFn: async (reference: string) => {
      await navigator.clipboard.writeText(reference);
      return reference;
    },
  });

  return {
    copyReference: (reference: string) => copy.mutate(reference),
    copied: copy.isSuccess ? copy.data : undefined,
    isPending: copy.isPending,
  };
};
