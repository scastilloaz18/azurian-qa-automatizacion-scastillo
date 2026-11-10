import type { Page, Response } from "@playwright/test";
import type { EvidenceWriter } from "../../api/clients/transporte-api";

export interface CapturedApiResponse {
  status: number;
  body: unknown;
  rawBody: string;
  headers: Record<string, string>;
  url: string;
}

function parseBody(rawBody: string): unknown {
  if (rawBody === "") return null;
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function redact(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const safeValue: Record<string, unknown> = { ...value };
  if ("password" in safeValue) safeValue.password = "[redacted]";
  if ("token" in safeValue) safeValue.token = "[redacted]";
  return safeValue;
}

function safeResponseHeaders(response: Response): Record<string, string> {
  const headers = response.headers();
  const safeHeaders: Record<string, string> = {};
  for (const name of ["content-type", "location", "x-total-count", "x-page", "x-page-size", "x-total-pages"]) {
    if (headers[name] !== undefined) safeHeaders[name] = headers[name];
  }
  return safeHeaders;
}

export async function recordApiResponse(
  response: Response,
  attach: EvidenceWriter,
  method: string,
  pathname: string
): Promise<CapturedApiResponse> {
  const rawBody = await response.text();
  const body = parseBody(rawBody);
  const requestBody = parseBody(response.request().postData() || "");

  await attach("Llamada API del portal: " + method + " " + pathname, {
    request: {
      method,
      url: response.url(),
      runId: response.request().headers()["x-lab-run-id"] ?? "no recibido",
      body: redact(requestBody)
    },
    response: {
      status: response.status(),
      headers: safeResponseHeaders(response),
      body: redact(body)
    }
  });

  return {
    status: response.status(),
    body,
    rawBody,
    headers: response.headers(),
    url: response.url()
  };
}

export async function captureApiAction(
  page: Page,
  attach: EvidenceWriter,
  method: string,
  pathname: string,
  action: () => Promise<unknown>
): Promise<CapturedApiResponse> {
  const responsePromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === pathname && response.request().method() === method
  );
  const [response] = await Promise.all([responsePromise, action()]);
  return recordApiResponse(response, attach, method, pathname);
}
