import { KeyOpsError } from "./types.js";

export class HttpError extends KeyOpsError {
  readonly status: number;
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message, "HTTP_ERROR");
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export async function requestJson<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body,
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new HttpError(
      `Request failed: ${response.status} ${response.statusText} for ${url}`,
      response.status,
      text.slice(0, 1_000),
    );
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(`Expected JSON from ${url}`, response.status, text.slice(0, 1_000));
  }
}

export async function requestStatus(
  url: string,
  options: RequestOptions = {},
): Promise<number> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body,
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
  });
  await response.text();
  return response.status;
}
