import { apiErrorSchema } from "@shared/api";

const readError = async (response: Response, fallback: string) => {
  const body: unknown = await response.json().catch(() => undefined);
  return apiErrorSchema.safeParse(body).data?.error ?? fallback;
};

export const requestJson = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
): Promise<unknown> => {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(await readError(response, fallback));
  return response.json();
};

export const requestBlob = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
) => {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(await readError(response, fallback));
  return response.blob();
};

export const request = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
) => {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(await readError(response, fallback));
};
