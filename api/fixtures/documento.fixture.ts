import { expect } from "@playwright/test";
import type { TestWorld } from "../../support/world";
import type { DocumentDto, DocumentInput } from "../models/documento";
import { createDocumentInput, createRelatedDocumentInput } from "../../shared/datos-prueba";
import { assertCreatedDocument, assertStatus, requireBody } from "../../shared/verificaciones";
import { ensureApiSession } from "./sesion.fixture";

export async function createDocumentFixture(
  world: TestWorld,
  input: DocumentInput
): Promise<DocumentDto> {
  await ensureApiSession(world);
  const response = await world.getApiClient().documents.create(input);
  await assertStatus(world.attachJson, 201, response.status, "crear documento propio");
  const document = await requireBody(response.body, "POST /api/documents");
  await assertCreatedDocument(world.attachJson, document, input);
  return document;
}

export async function createOwnDocument(world: TestWorld): Promise<DocumentDto> {
  const input = createDocumentInput();
  world.setDocumentInput(input);
  const document = await createDocumentFixture(world, input);
  world.setTargetDocument(document);
  world.setCreatedDocument(document);
  return document;
}

export async function createDocumentPair(world: TestWorld): Promise<[DocumentDto, DocumentDto]> {
  const targetInput = createDocumentInput({ tipoDte: "DTE 33", monto: 450_000 });
  const relatedInput = createRelatedDocumentInput(targetInput);
  const target = await createDocumentFixture(world, targetInput);
  const related = await createDocumentFixture(world, relatedInput);
  world.setDocumentInput(targetInput);
  world.setTargetDocument(target);
  world.setRelatedDocuments([target, related]);
  expect(target.rutReceptor).toBe(related.rutReceptor);
  expect(target.tipoDte).toBe(related.tipoDte);
  expect(target.folio).not.toBe(related.folio);
  expect(target.monto).not.toBe(related.monto);
  return [target, related];
}
