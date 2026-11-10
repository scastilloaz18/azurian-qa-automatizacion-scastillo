import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { DataTable } from "@cucumber/cucumber";
import type { TestWorld } from "../../support/world";
import type { DocumentDto } from "../../api/models/documento";
import { documentInputFromTable, documentPatchFromTable } from "../../shared/datos-prueba";
import {
  assertCreatedDocument,
  assertSameDocument,
  assertStatus,
  assertUpdatedDocument,
  requireDocument,
  requireDocumentList
} from "../../shared/verificaciones";
import { loginToPortal, documentsPage } from "../fixtures/portal.fixture";
import { DocumentFormPage } from "../pages/formulario-documento.page";
import { DocumentDetailsDialog } from "../pages/detalle-documento.dialog";
import { ConfirmDeleteDialog } from "../pages/confirmacion-eliminacion.dialog";

function sortedDocuments(documents: DocumentDto[]): DocumentDto[] {
  return [...documents].sort((left, right) =>
    right.fechaEmision.localeCompare(left.fechaEmision) || right.folio - left.folio
  );
}

async function assertFilteredList(
  world: TestWorld,
  response: { body: unknown; headers: Record<string, string> },
  expected: DocumentDto[]
): Promise<void> {
  const actual = requireDocumentList(response.body, "lista visible del portal");
  const total = Number(response.headers["x-total-count"]);
  await world.attachJson("Lista filtrada esperada", expected);
  await world.attachJson("Lista filtrada recibida", actual);
  await world.attachJson("Total de filas esperado y recibido", {
    esperado: expected.length,
    recibido: response.headers["x-total-count"]
  });
  expect(Number.isInteger(total)).toBe(true);
  expect(total).toBe(expected.length);
  expect(actual).toStrictEqual(sortedDocuments(expected));
}

Given("que inicié sesión en el portal", async function (this: TestWorld) {
  await loginToPortal(this);
});

When("emito un documento tributario con los siguientes datos:", async function (
  this: TestWorld,
  table: DataTable
) {
  const input = documentInputFromTable(table);
  this.setDocumentInput(input);
  await documentsPage(this).openNewDocument();
  const response = await new DocumentFormPage(this.getPage(), this.attachJson).submitNewDocument(input);
  await assertStatus(this.attachJson, 201, response.status, "emisión del documento en el portal");
  const document = requireDocument(response.body, "respuesta de emisión del portal");
  await assertCreatedDocument(this.attachJson, document, input);
  this.setCreatedDocument(document);
  this.setTargetDocument(document);
});

Then("el portal muestra el aviso correcto y la fila completa del documento", async function (
  this: TestWorld
) {
  const document = this.getCreatedDocument();
  await documentsPage(this).expectSuccessNotice("Documento folio " + document.folio + " emitido correctamente.");
  await documentsPage(this).expectExactRow(document);
});

When("busco los documentos del receptor por tipo y selecciono el folio esperado", async function (
  this: TestWorld
) {
  const target = this.getTargetDocument();
  const response = await documentsPage(this).filterByRutAndType(target);
  await assertStatus(this.attachJson, 200, response.status, "filtro del listado en el portal");
  await assertFilteredList(this, response, this.getRelatedDocuments());
  await documentsPage(this).expectExactRow(target);

  const detailResponse = await documentsPage(this).openDetail(target);
  await assertStatus(this.attachJson, 200, detailResponse.status, "detalle abierto desde la fila elegida");
  const actual = requireDocument(detailResponse.body, "detalle abierto desde la fila elegida");
  await assertSameDocument(this.attachJson, target, actual, "detalle de la fila elegida");
  this.setCreatedDocument(actual);
});

Then("el detalle muestra todos los datos del documento elegido", async function (this: TestWorld) {
  const document = this.getCreatedDocument();
  await new DocumentDetailsDialog(this.getPage()).expectDocument(document);
  await new DocumentDetailsDialog(this.getPage()).close();
});


When("actualizo el documento desde su formulario con estos cambios:", async function (
  this: TestWorld,
  table: DataTable
) {
  const target = this.getTargetDocument();
  const listResponse = await documentsPage(this).filterByRutAndType(target);
  await assertStatus(this.attachJson, 200, listResponse.status, "filtro previo a la edición");
  await assertFilteredList(this, listResponse, [target]);

  const patch = documentPatchFromTable(table);
  this.setPatch(patch);
  await documentsPage(this).openEdit(target);
  const response = await new DocumentFormPage(this.getPage(), this.attachJson)
    .updateDocument(target.id, target.folio, patch);
  await assertStatus(this.attachJson, 200, response.status, "actualización desde el formulario");
  const actual = requireDocument(response.body, "respuesta de actualización del portal");
  await assertUpdatedDocument(this.attachJson, target, patch, actual);
  this.setUpdatedDocument(actual);
});

Then("el portal muestra los cambios y los conserva al recargar", async function (this: TestWorld) {
  const updated = this.getUpdatedDocument();
  await documentsPage(this).expectSuccessNotice("Documento folio " + updated.folio + " actualizado correctamente.");
  await documentsPage(this).expectExactRow(updated);

  await documentsPage(this).reloadPage();
  const filteredResponse = await documentsPage(this).filterByRutAndType(updated);
  await assertStatus(this.attachJson, 200, filteredResponse.status, "verificación del documento editado tras recargar");
  await assertFilteredList(this, filteredResponse, [updated]);
  await documentsPage(this).expectExactRow(updated);
});

When("elimino el documento desde el portal y confirmo la acción", async function (this: TestWorld) {
  const target = this.getTargetDocument();
  const listResponse = await documentsPage(this).filterByRutAndType(target);
  await assertStatus(this.attachJson, 200, listResponse.status, "filtro previo a la eliminación");
  await assertFilteredList(this, listResponse, [target]);

  await documentsPage(this).openDeleteConfirmation(target);
  const dialog = new ConfirmDeleteDialog(this.getPage(), this.attachJson);
  await dialog.expectConfirmationFor(target.folio);
  const result = await dialog.confirm(target.id);
  await assertStatus(this.attachJson, 204, result.deletion.status, "eliminación confirmada desde el portal");
  await assertStatus(this.attachJson, 200, result.refreshedList.status, "recarga posterior a la eliminación");
  const unfilteredDocuments = requireDocumentList(result.refreshedList.body, "tabla recargada después de eliminar");
  await this.attachJson("Documento esperado ausente de la tabla recargada", { id: target.id, presente: false });
  await this.attachJson("Filas recibidas después de eliminar", unfilteredDocuments);
  expect(unfilteredDocuments.some((document) => document.id === target.id)).toBe(false);
  this.setDeletedResponse({ status: result.deletion.status, rawBody: result.deletion.rawBody });
  await documentsPage(this).expectSuccessNotice("Documento folio " + target.folio + " eliminado correctamente.");
});

Then("el documento desaparece del filtro y continúa ausente después de recargar", async function (
  this: TestWorld
) {
  const target = this.getTargetDocument();
  const afterDelete = await documentsPage(this).filterByRutAndType(target);
  await assertStatus(this.attachJson, 200, afterDelete.status, "lista vacía después de eliminar");
  await assertFilteredList(this, afterDelete, []);
  await documentsPage(this).expectEmptyResult();

  await documentsPage(this).reloadPage();
  const afterReload = await documentsPage(this).filterByRutAndType(target);
  await assertStatus(this.attachJson, 200, afterReload.status, "lista vacía después de recargar");
  await assertFilteredList(this, afterReload, []);
  await documentsPage(this).expectEmptyResult();
});
