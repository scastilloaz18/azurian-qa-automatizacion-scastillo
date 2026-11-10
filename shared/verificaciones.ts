import { expect } from "@playwright/test";
import type { ApiErrorBody, DocumentDto, DocumentInput, DocumentPatch } from "../api/models/documento";
import type { EvidenceWriter } from "../api/clients/transporte-api";

const DOCUMENT_KEYS = [
  "attachmentName",
  "contactEmail",
  "createdAt",
  "deliveryChannel",
  "estado",
  "fechaEmision",
  "folio",
  "id",
  "monto",
  "observaciones",
  "rutReceptor",
  "sendCopy",
  "tipoDte",
  "updatedAt"
].sort();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isValidIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_PATTERN.test(value)) return false;
  return new Date(value).toISOString() === value;
}

export function requireBody<T>(body: T | null, description: string): T {
  if (body === null) throw new Error(description + " no incluyó un cuerpo.");
  return body;
}

export async function assertStatus(
  attach: EvidenceWriter,
  expected: number,
  actual: number,
  label: string
): Promise<void> {
  await attach("Estado HTTP esperado: " + label, { status: expected });
  await attach("Estado HTTP recibido: " + label, { status: actual });
  expect(actual).toBe(expected);
}

export async function assertCreatedDocument(
  attach: EvidenceWriter,
  actual: DocumentDto,
  input: DocumentInput
): Promise<void> {
  const expected = {
    ...input,
    id: actual.id,
    estado: "PENDIENTE",
    createdAt: actual.createdAt,
    updatedAt: actual.createdAt
  };
  await attach("Forma esperada del documento creado", expected);
  await attach("Documento recibido al crear", actual);

  expect(Object.keys(actual).sort()).toEqual(DOCUMENT_KEYS);
  expect(actual).toStrictEqual({
    ...input,
    id: actual.id,
    estado: "PENDIENTE",
    createdAt: actual.createdAt,
    updatedAt: actual.createdAt
  });
  expect(actual.id).toMatch(UUID_PATTERN);
  expect(isValidIsoTimestamp(actual.createdAt)).toBe(true);
}

export async function assertSameDocument(
  attach: EvidenceWriter,
  expected: DocumentDto,
  actual: DocumentDto,
  label: string
): Promise<void> {
  await attach("Documento esperado: " + label, expected);
  await attach("Documento recibido: " + label, actual);
  expect(Object.keys(actual).sort()).toEqual(DOCUMENT_KEYS);
  expect(actual).toStrictEqual(expected);
}

export async function assertUpdatedDocument(
  attach: EvidenceWriter,
  before: DocumentDto,
  patch: DocumentPatch,
  actual: DocumentDto
): Promise<void> {
  const expected = { ...before, ...patch, updatedAt: actual.updatedAt };
  await attach("Forma esperada después de actualizar", expected);
  await attach("Documento recibido después de actualizar", actual);

  expect(Object.keys(actual).sort()).toEqual(DOCUMENT_KEYS);
  expect(actual).toStrictEqual({ ...before, ...patch, updatedAt: actual.updatedAt });
  expect(isValidIsoTimestamp(actual.updatedAt)).toBe(true);
  expect(Date.parse(actual.updatedAt)).toBeGreaterThan(Date.parse(before.updatedAt));
}

export async function assertErrorBody(
  attach: EvidenceWriter,
  expected: ApiErrorBody,
  actual: ApiErrorBody | null,
  label: string
): Promise<void> {
  await attach("Error esperado: " + label, expected);
  await attach("Error recibido: " + label, actual);
  expect(actual).toStrictEqual(expected);
}

export function requireDocument(value: unknown, description: string): DocumentDto {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(description + " no contiene un documento.");
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.tipoDte !== "string" ||
    typeof candidate.folio !== "number" ||
    typeof candidate.rutReceptor !== "string" ||
    typeof candidate.monto !== "number" ||
    typeof candidate.fechaEmision !== "string" ||
    typeof candidate.estado !== "string" ||
    typeof candidate.deliveryChannel !== "string" ||
    typeof candidate.sendCopy !== "boolean" ||
    !(candidate.contactEmail === null || typeof candidate.contactEmail === "string") ||
    !(candidate.observaciones === null || typeof candidate.observaciones === "string") ||
    !(candidate.attachmentName === null || typeof candidate.attachmentName === "string") ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    throw new Error(description + " tiene una forma de documento inválida.");
  }
  return candidate as unknown as DocumentDto;
}

export function requireDocumentList(value: unknown, description: string): DocumentDto[] {
  if (!Array.isArray(value)) throw new Error(description + " no es un arreglo.");
  return value.map((entry, index) => requireDocument(entry, description + "[" + index + "]"));
}

export function requireErrorBody(value: unknown, description: string): ApiErrorBody {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(description + " no contiene un error.");
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.error !== "string" ||
    typeof candidate.code !== "string" ||
    (candidate.details !== undefined && !Array.isArray(candidate.details))
  ) {
    throw new Error(description + " tiene una forma de error inválida.");
  }
  return candidate as unknown as ApiErrorBody;
}
