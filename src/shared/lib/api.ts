import { z } from "zod";

type ApiOptions = {
  signal?: AbortSignal;
};

type ApiBodyOptions = ApiOptions & {
  body: unknown;
};

const EmptyResponse = z.undefined();

export const api = {
  get: (path: string, options?: ApiOptions): Promise<unknown> =>
    request(path, { method: "GET", signal: options?.signal }),

  post: (path: string, options: ApiBodyOptions): Promise<unknown> =>
    request(path, {
      method: "POST",
      body: JSON.stringify(options.body),
      headers: { "Content-Type": "application/json" },
      signal: options.signal,
    }),

  patch: (path: string, options: ApiBodyOptions): Promise<unknown> =>
    request(path, {
      method: "PATCH",
      body: JSON.stringify(options.body),
      headers: { "Content-Type": "application/json" },
      signal: options.signal,
    }),

  delete: (path: string, options?: ApiOptions): Promise<unknown> =>
    request(path, { method: "DELETE", signal: options?.signal }),
};

async function request(path: string, init: RequestInit) {
  const response = await fetch(withApiPrefix(path), init);

  if (!response.ok) {
    throw new ApiError(response.status, await readResponse(response));
  }

  return readResponse(response);
}

async function readResponse(response: Response) {
  if (response.status === 204) {
    return EmptyResponse.parse(undefined);
  }

  const text = await response.text();
  if (!text) {
    return EmptyResponse.parse(undefined);
  }

  return JSON.parse(text) as unknown;
}

function withApiPrefix(path: string) {
  return path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: unknown,
  ) {
    super(`API request failed with status ${statusCode}`);
  }
}
