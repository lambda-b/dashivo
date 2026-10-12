import {
  useQuery as useTanstackQuery,
  useSuspenseQuery as useTanstackSuspenseQuery,
  useMutation as useTanstackMutation,
  type DefaultError,
  type QueryKey,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export interface NotificationMeta extends Record<string, unknown> {
  // false は利用側でエラーを表示する場合の、明示的な通知抑制。
  errorMessage: string | false;
  errorBoundary?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: NotificationMeta;
    mutationMeta: NotificationMeta;
  }
}

type WithRequiredMeta<T extends { meta?: unknown }> = T & Required<Pick<T, "meta">>;

export const useQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequiredMeta<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
) => useTanstackQuery(options);

export const useSuspenseQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequiredMeta<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
) => useTanstackSuspenseQuery(options);

export const useMutation = <
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: WithRequiredMeta<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
) => useTanstackMutation(options);
