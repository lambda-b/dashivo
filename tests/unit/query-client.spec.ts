import { expect, test } from "@playwright/test";
import { createQueryClient } from "@dashlet/shared-lib/query-client";

const createTestClient = (shouldRetry = () => false) => {
  const notifications: { error: unknown; message: string; id: string }[] = [];
  const client = createQueryClient({
    notifyError: (error, message, id) => notifications.push({ error, message, id }),
    shouldRetry,
  });

  return { client, notifications };
};

for (const retryable of [true, false]) {
  test(`retries only eligible queries and notifies once (retryable=${retryable})`, async () => {
    const { client, notifications } = createTestClient(() => retryable);
    const error = new Error("Request failed");
    let attempts = 0;

    try {
      await expect(
        client.fetchQuery({
          queryKey: ["retry"],
          queryFn: async () => {
            attempts++;
            throw error;
          },
          retryDelay: 0,
          meta: { errorMessage: "取得に失敗しました。" },
        }),
      ).rejects.toBe(error);

      expect(attempts).toBe(retryable ? 3 : 1);
      expect(notifications).toEqual([
        { error, message: "取得に失敗しました。", id: 'query:["retry"]' },
      ]);
    } finally {
      client.clear();
    }
  });
}

test("does not retry or notify cancelled queries and mutations", async () => {
  const { client, notifications } = createTestClient(() => true);
  const error = new DOMException("Cancelled", "AbortError");
  let attempts = 0;
  const operation = async () => {
    attempts++;
    throw error;
  };

  try {
    await expect(
      client.fetchQuery({
        queryKey: ["cancelled"],
        queryFn: operation,
        retryDelay: 0,
        meta: { errorMessage: "取得に失敗しました。" },
      }),
    ).rejects.toBe(error);

    const mutation = client.getMutationCache().build(client, {
      mutationFn: operation,
      meta: { errorMessage: "保存に失敗しました。" },
    });
    await expect(mutation.execute(undefined)).rejects.toBe(error);
    expect(attempts).toBe(2);
    expect(notifications).toEqual([]);
  } finally {
    client.clear();
  }
});

test("suppresses initial boundary failures but notifies background failures without losing data", async () => {
  const { client, notifications } = createTestClient();
  const error = new Error("Request failed");
  const options = {
    queryKey: ["boundary"],
    queryFn: async () => {
      throw error;
    },
    meta: { errorMessage: "取得に失敗しました。", errorBoundary: true },
  };

  try {
    await expect(client.fetchQuery(options)).rejects.toBe(error);
    expect(notifications).toEqual([]);

    client.setQueryData(options.queryKey, { saved: true });
    await expect(client.fetchQuery(options)).rejects.toBe(error);
    expect(client.getQueryData(options.queryKey)).toEqual({ saved: true });
    expect(notifications).toEqual([
      { error, message: "取得に失敗しました。", id: 'query:["boundary"]' },
    ]);
  } finally {
    client.clear();
  }
});

test("allows explicitly handling query and mutation errors locally", async () => {
  const { client, notifications } = createTestClient();
  const error = new Error("Handled locally");
  const operation = async () => {
    throw error;
  };

  try {
    await expect(
      client.fetchQuery({
        queryKey: ["local-error"],
        queryFn: operation,
        meta: { errorMessage: false },
      }),
    ).rejects.toBe(error);

    const mutation = client.getMutationCache().build(client, {
      mutationFn: operation,
      meta: { errorMessage: false },
    });
    await expect(mutation.execute(undefined)).rejects.toBe(error);
    expect(notifications).toEqual([]);
  } finally {
    client.clear();
  }
});

test("notifies mutation failures using the configured message and operation ID", async () => {
  const { client, notifications } = createTestClient();
  const error = new Error("Save failed");

  try {
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => {
        throw error;
      },
      meta: { errorMessage: "保存に失敗しました。" },
    });
    await expect(mutation.execute(undefined)).rejects.toBe(error);
    expect(notifications).toEqual([
      { error, message: "保存に失敗しました。", id: `mutation:${mutation.mutationId}` },
    ]);
  } finally {
    client.clear();
  }
});
