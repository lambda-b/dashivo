import { useMutation, useQuery, useSuspenseQuery } from "@dashivo/shared-lib/query";

// 型チェック専用。実行せず、指定漏れとライブラリの型推論を検証する。
export const useQueryTypeChecks = () => {
  const queryKey = ["notification-types"] as const;
  const queryFn = async () => ({ count: 1 });

  // @ts-expect-error meta 自体の省略は禁止。
  useQuery({ queryKey, queryFn });
  // @ts-expect-error errorMessage の省略は禁止。
  useQuery({ queryKey, queryFn, meta: {} });
  // @ts-expect-error meta 自体の省略は禁止。
  useSuspenseQuery({ queryKey, queryFn });
  // @ts-expect-error errorMessage の省略は禁止。
  useSuspenseQuery({ queryKey, queryFn, meta: {} });
  // @ts-expect-error meta 自体の省略は禁止。
  useMutation({ mutationFn: queryFn });
  // @ts-expect-error errorMessage の省略は禁止。
  useMutation({ mutationFn: queryFn, meta: {} });

  const selected: string | undefined = useQuery({
    queryKey,
    queryFn,
    select: (data) => String(data.count),
    meta: { errorMessage: "取得に失敗しました。" },
  }).data;

  const initial: string = useQuery({
    queryKey,
    queryFn,
    initialData: () => ({ count: 0 }),
    select: (data) => String(data.count),
    meta: { errorMessage: false },
  }).data;

  const suspense: number = useSuspenseQuery({
    queryKey,
    queryFn,
    select: (data) => data.count,
    meta: { errorMessage: "取得に失敗しました。", errorBoundary: true },
  }).data;

  const mutation = useMutation({
    mutationFn: async (value: number) => String(value),
    meta: { errorMessage: false },
    onSuccess: (data, value) => {
      const output: string = data;
      const input: number = value;
      void [output, input];
    },
  });
  mutation.mutate(1);
  // @ts-expect-error mutationFn の引数型も維持する。
  mutation.mutate("1");

  void [selected, initial, suspense];
};
