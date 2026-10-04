import { apiErrorSchema } from "@shared/api";
import { messages } from "@/messages";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

const readError = async (response: Response, fallback: string) => {
  const body: unknown = await response.json().catch(() => undefined);
  return apiErrorSchema.safeParse(body).data?.error ?? fallback;
};

const requestResponse = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
) => {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(messages.connectionFailed, undefined, {
      cause,
    });
  }

  if (!response.ok) throw new ApiError(await readError(response, fallback), response.status);
  return response;
};

export const requestJson = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
): Promise<unknown> => {
  const response = await requestResponse(input, init, fallback);
  try {
    return await response.json();
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(messages.invalidResponse, response.status, { cause });
  }
};

export const requestBlob = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
) => {
  const response = await requestResponse(input, init, fallback);
  return response.blob();
};

export const request = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallback: string,
) => {
  await requestResponse(input, init, fallback);
};
