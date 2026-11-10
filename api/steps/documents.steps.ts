import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { DataTable } from "@cucumber/cucumber";
import type { TestWorld } from "../../support/world";
import type { DocumentDto } from "../models/documento";
import { documentInputFromTable, documentPatchFromTable } from "../../shared/datos-prueba";
import {
  assertCreatedDocument,
  assertErrorBody,
  assertSameDocument,
  assertStatus,
  assertUpdatedDocument,
  requireBody,
  requireDocument,
  requireDocumentList,
  requireErrorBody
} from "../../shared/verificaciones";

function sortedDocuments(documents: DocumentDto[]): DocumentDto[] {
  return [...documents].sort((left, right) =>
    right.fechaEmision.localeCompare(left.fechaEmision) || right.folio - left.folio
  );
}

When("registro un documento tributario con los siguientes datos:", async function (
  this: TestWorld,
  table: DataTable
) {
  const input = documentInputFromTable(table);
  this.setDocumentInput(input);
  const response = await this.getApiClient().documents.create(input);
  await assertStatus(this.attachJson, 201, response.status, "registro de documento");
  const document = requireDocument(await requireBody(response.body, "creación de documento"), "creación de documento");
  await assertCreatedDocument(this.attachJson, document, input);
  this.setCreatedDocument(document);
  this.setTargetDocument(document);
});

Then("la respuesta refleja exactamente los datos enviados y los datos asignados por el sistema", async function (
  this: TestWorld
) {
  await assertCreatedDocument(this.attachJson, this.getCreatedDocument(), this.getDocumentInput());
});

Then("puedo consultar el documento creado y recibir exactamente los mismos datos", async function (
  this: TestWorld
) {
  const expected = this.getCreatedDocument();
  const response = await this.getApiClient().documents.get(expected.id);
  await assertStatus(this.attachJson, 200, response.status, "lectura posterior a la creación");
  const actual = requireDocument(await requireBody(response.body, "detalle del documento"), "detalle del documento");
  await assertSameDocument(this.attachJson, expected, actual, "detalle posterior a la creación");
});

When("consulto los documentos del receptor y tipo del documento elegido", async function (
  this: TestWorld
) {
  const target = this.getTargetDocument();
  const response = await this.getApiClient().documents.list({
    rut: target.rutReceptor,
    tipoDte: target.tipoDte
  });
  await assertStatus(this.attachJson, 200, response.status, "búsqueda por receptor y tipo");
  const documents = requireDocumentList(response.body, "lista por receptor y tipo");
  const total = Number(response.headers["x-total-count"]);
  await this.attachJson("Total esperado y recibido en la lista", {
    esperado: this.getRelatedDocuments().length,
    recibido: response.headers["x-total-count"]
  });
  expect(Number.isInteger(total)).toBe(true);
  this.setListResponse({ documents, total });
});

Then("la lista devuelve exactamente los dos documentos propios y su total", async function (
  this: TestWorld
) {
  const expected = sortedDocuments(this.getRelatedDocuments());
  const actual = this.getListResponse();
  await this.attachJson("Lista completa esperada", expected);
  await this.attachJson("Lista completa recibida", actual.documents);
  expect(actual.total).toBe(2);
  expect(actual.documents).toStrictEqual(expected);

  const chosenBeforeFiltering = this.getTargetDocument();
  const selected = actual.documents.find((document) =>
    document.folio === chosenBeforeFiltering.folio &&
    document.rutReceptor === chosenBeforeFiltering.rutReceptor &&
    document.monto === chosenBeforeFiltering.monto
  );
  await this.attachJson("Documento seleccionado por folio, RUT y monto", {
    esperado: chosenBeforeFiltering,
    recibido: selected ?? null
  });
  if (!selected) throw new Error("La lista filtrada no contiene el documento exacto del escenario.");
  this.setTargetDocument(selected);
});

Then("puedo abrir el detalle del documento elegido y recibir todos sus datos", async function (
  this: TestWorld
) {
  const expected = this.getTargetDocument();
  const response = await this.getApiClient().documents.get(expected.id);
  await assertStatus(this.attachJson, 200, response.status, "detalle del documento elegido");
  const actual = requireDocument(await requireBody(response.body, "detalle del documento elegido"), "detalle del documento elegido");
  await assertSameDocument(this.attachJson, expected, actual, "documento elegido");
});

Then("un identificador inexistente devuelve el error completo de documento no encontrado", async function (
  this: TestWorld
) {
  const response = await this.getApiClient().documents.get("00000000-0000-4000-8000-000000000000");
  await assertStatus(this.attachJson, 404, response.status, "identificador inexistente");
  const actual = requireErrorBody(response.body, "error de identificador inexistente");
  await assertErrorBody(
    this.attachJson,
    { error: "El documento no existe en esta ejecución.", code: "NOT_FOUND" },
    actual,
    "identificador inexistente"
  );
});

When("actualizo parcialmente el documento con estos cambios:", async function (
  this: TestWorld,
  table: DataTable
) {
  const target = this.getTargetDocument();
  const patch = documentPatchFromTable(table);
  this.setPatch(patch);
  const response = await this.getApiClient().documents.patch(target.id, patch);
  await assertStatus(this.attachJson, 200, response.status, "actualización parcial");
  const actual = requireDocument(await requireBody(response.body, "actualización parcial"), "actualización parcial");
  await assertUpdatedDocument(this.attachJson, target, patch, actual);
  this.setUpdatedDocument(actual);
});

Then("la lectura posterior confirma el documento completo actualizado", async function (
  this: TestWorld
) {
  const expected = this.getUpdatedDocument();
  const response = await this.getApiClient().documents.get(expected.id);
  await assertStatus(this.attachJson, 200, response.status, "lectura posterior a la actualización");
  const actual = requireDocument(await requireBody(response.body, "lectura posterior a la actualización"), "lectura posterior a la actualización");
  await assertSameDocument(this.attachJson, expected, actual, "lectura posterior a la actualización");
});

When("elimino el documento tributario propio", async function (this: TestWorld) {
  const response = await this.getApiClient().documents.delete(this.getTargetDocument().id);
  this.setDeletedResponse({ status: response.status, rawBody: response.rawBody });
});

Then("la eliminación confirma éxito sin cuerpo", async function (this: TestWorld) {
  const result = this.getDeletedResponse();
  await this.attachJson("Respuesta esperada de eliminación", { status: 204, body: null });
  await this.attachJson("Respuesta recibida de eliminación", {
    status: result.status,
    rawBody: result.rawBody
  });
  expect(result.status).toBe(204);
  expect(result.rawBody).toBe("");
});

Then("el documento eliminado ya no existe ni aparece en la lista", async function (this: TestWorld) {
  const target = this.getTargetDocument();
  const getResponse = await this.getApiClient().documents.get(target.id);
  await assertStatus(this.attachJson, 404, getResponse.status, "lectura posterior a la eliminación");
  const error = requireErrorBody(getResponse.body, "documento eliminado");
  await assertErrorBody(
    this.attachJson,
    { error: "El documento no existe en esta ejecución.", code: "NOT_FOUND" },
    error,
    "documento eliminado"
  );

  const listResponse = await this.getApiClient().documents.list({
    rut: target.rutReceptor,
    tipoDte: target.tipoDte
  });
  await assertStatus(this.attachJson, 200, listResponse.status, "lista posterior a la eliminación");
  const remaining = requireDocumentList(listResponse.body, "lista posterior a la eliminación");
  await this.attachJson("Lista esperada después de eliminar", []);
  await this.attachJson("Lista recibida después de eliminar", remaining);
  expect(listResponse.headers["x-total-count"]).toBe("0");
  expect(remaining).toStrictEqual([]);
});
