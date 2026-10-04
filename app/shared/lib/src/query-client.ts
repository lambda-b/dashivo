import { MutationCache, QueryCache, QueryClient, type DefaultError } from "@tanstack/react-query";
import type { NotificationMeta } from "@dashivo/shared-lib/query";

interface QueryClientOptions {
  notifyError: (error: unknown, message: string, id: string) => void;
  shouldRetry: (error: DefaultError) => boolean;
}

const isCancelled = (error: unknown) => error instanceof Error && error.name === "AbortError";

export const createQueryClient = ({ notifyError, shouldRetry }: QueryClientOptions) => {
  const notifyFailure = (error: unknown, meta: NotificationMeta | undefined, id: string) => {
    if (isCancelled(error) || !meta?.errorMessage) return;
    notifyError(error, meta.errorMessage, id);
  };

  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !isCancelled(error) && failureCount < 2 && shouldRetry(error),
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) => {
        notifyFailure(error, mutation.meta, `mutation:${mutation.mutationId}`);
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        // 初回失敗は境界で表示し、データを保持している再取得失敗だけ通知する。
        if (query.meta?.errorBoundary && query.state.data === undefined) return;
        notifyFailure(error, query.meta, `query:${query.queryHash}`);
      },
    }),
  });
};
