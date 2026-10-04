import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/api/request";

interface NotificationMeta extends Record<string, unknown> {
  errorMessage?: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: NotificationMeta;
    mutationMeta: NotificationMeta;
  }
}

const notifyError = (error: unknown, message: string, id: string) => {
  if (error instanceof Error && error.name === "AbortError") return;

  toast.error(error instanceof ApiError ? error.message : message, {
    id,
    duration: Infinity,
  });
};

// 移行済みの操作だけ通知する。既存の画面内エラー表示との二重通知を避ける。
export const createQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) => {
        const message = mutation.meta?.errorMessage;
        if (message) notifyError(error, message, `mutation:${mutation.mutationId}`);
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        const message = query.meta?.errorMessage;
        if (message) notifyError(error, message, `query:${query.queryHash}`);
      },
    }),
  });
