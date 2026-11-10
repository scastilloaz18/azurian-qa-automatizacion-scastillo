import type { APIRequestContext } from "@playwright/test";
import type { ApiResult } from "../models/documento";

export type EvidenceWriter = (name: string, value: unknown) => Promise<void>;

interface RequestOptions {
  body?: object;
  authorize?: boolean;
  evidenceBody?: unknown;
}

function redactSecrets(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const safeValue: Record<string, unknown> = { ...value };
  if ("password" in safeValue) safeValue.password = "[redacted]";
  if ("token" in safeValue) safeValue.token = "[redacted]";
  return safeValue;
}

export class ApiTransport {
  private token: string | null = null;

  constructor(
    private readonly context: APIRequestContext,
    private readonly runId: string,
    private readonly writeEvidence: EvidenceWriter
  ) {}

  setToken(token: string): void {
    this.token = token;
  }

  hasToken(): boolean {
    return this.token !== null;
  }

  async send<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {};
    if (options.authorize !== false && this.token) headers.Authorization = "Bearer " + this.token;

    const response = await this.context.fetch(path, {
      method,
      headers,
      data: options.body,
      timeout: 15_000
    });
    const rawBody = await response.text();
    let parsedBody: unknown = null;
    if (rawBody !== "") {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch {
        parsedBody = rawBody;
      }
    }

    const responseHeaders = response.headers();
    const evidenceHeaders: Record<string, string> = {};
    for (const header of ["content-type", "location", "x-total-count", "x-page", "x-page-size", "x-total-pages"]) {
      const value = responseHeaders[header];
      if (value !== undefined) evidenceHeaders[header] = value;
    }

    await this.writeEvidence("API " + method + " " + path, {
      request: {
        method,
        url: response.url(),
        runId: this.runId,
        body: redactSecrets(options.evidenceBody === undefined ? options.body ?? null : options.evidenceBody)
      },
      response: {
        status: response.status(),
        headers: evidenceHeaders,
        body: redactSecrets(parsedBody)
      }
    });

    return {
      status: response.status(),
      body: parsedBody as T | null,
      rawBody,
      headers: responseHeaders,
      url: response.url()
    };
  }
}
