import { expect, type Locator, type Page } from "@playwright/test";
import type { EvidenceWriter } from "../../api/clients/transporte-api";
import type { DocumentDto } from "../../api/models/documento";
import { captureApiAction, type CapturedApiResponse } from "./evidencia-api";

const STATE_LABELS = {
  ACEPTADO: "Aceptado",
  PENDIENTE: "Pendiente",
  RECHAZADO: "Rechazado"
} as const;

function formatClp(amount: number): string {
  return new Intl.NumberFormat("es-CL").format(amount);
}

export class DocumentsPage {
  private readonly table: Locator;

  constructor(
    private readonly page: Page,
    private readonly attach: EvidenceWriter
  ) {
    this.table = page.getByRole("table", { name: "Tabla de Documentos Tributarios", exact: true });
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.table).toBeVisible();
    await expect(this.page.getByRole("status", { name: "Cargando documentos", exact: true })).toBeHidden();
  }

  async openNewDocument(): Promise<void> {
    await this.page.getByRole("button", { name: "Nuevo documento", exact: true }).click();
    await expect(this.page.getByRole("dialog", { name: "Emitir nuevo documento" })).toBeVisible();
  }

  exactRow(document: Pick<DocumentDto, "folio" | "rutReceptor" | "monto">): Locator {
    return this.table.getByRole("row")
      .filter({ has: this.page.getByText("#" + document.folio, { exact: true }) })
      .filter({ has: this.page.getByText(document.rutReceptor, { exact: true }) })
      .filter({ hasText: "$ " + formatClp(document.monto) + " CLP" });
  }

  async expectExactRow(document: DocumentDto): Promise<void> {
    const row = this.exactRow(document);
    await expect(row).toHaveCount(1);
    await expect(row.getByText("#" + document.folio, { exact: true })).toBeVisible();
    await expect(row.getByText(document.tipoDte, { exact: true })).toBeVisible();
    await expect(row.getByText(document.rutReceptor, { exact: true })).toBeVisible();
    await expect(row.getByText("$ " + formatClp(document.monto) + " CLP", { exact: true })).toBeVisible();
    await expect(row.getByText(document.fechaEmision, { exact: true })).toBeVisible();
    await expect(row.getByText(STATE_LABELS[document.estado], { exact: true })).toBeVisible();
  }

  async filterByRutAndType(document: Pick<DocumentDto, "rutReceptor" | "tipoDte">): Promise<CapturedApiResponse> {
    await this.page.getByLabel("Buscar por RUT Receptor", { exact: true }).fill(document.rutReceptor);
    const rutResponse = await captureApiAction(
      this.page,
      this.attach,
      "GET",
      "/api/documents",
      () => this.page.getByRole("button", { name: "Buscar", exact: true }).click()
    );
    expect(rutResponse.status).toBe(200);

    const typeResponse = await captureApiAction(
      this.page,
      this.attach,
      "GET",
      "/api/documents",
      () => this.page.getByLabel("Tipo DTE:", { exact: true }).selectOption(document.tipoDte)
    );
    expect(typeResponse.status).toBe(200);
    return typeResponse;
  }

  async openDetail(document: DocumentDto): Promise<CapturedApiResponse> {
    const row = this.exactRow(document);
    await expect(row).toHaveCount(1);
    const response = await captureApiAction(
      this.page,
      this.attach,
      "GET",
      "/api/documents/" + document.id,
      () => row.getByRole("button", { name: "Ver detalle de folio " + document.folio, exact: true }).click()
    );
    expect(response.status).toBe(200);
    await expect(this.page.getByRole("dialog", { name: "Detalle DTE - Folio #" + document.folio })).toBeVisible();
    return response;
  }

  async openEdit(document: DocumentDto): Promise<void> {
    const row = this.exactRow(document);
    await expect(row).toHaveCount(1);
    const response = await captureApiAction(
      this.page,
      this.attach,
      "GET",
      "/api/documents/" + document.id,
      () => row.getByRole("button", { name: "Editar folio " + document.folio, exact: true }).click()
    );
    expect(response.status).toBe(200);
    const dialog = this.page.getByRole("dialog", { name: "Editar documento - Folio #" + document.folio });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Monto total (CLP) *", { exact: true })).toHaveValue(String(document.monto));
  }

  async openDeleteConfirmation(document: DocumentDto): Promise<void> {
    const row = this.exactRow(document);
    await expect(row).toHaveCount(1);
    await row.getByRole("button", {
      name: "Eliminar folio " + document.folio,
      exact: true
    }).click();
    await expect(this.page.getByRole("alertdialog", { name: "Eliminar documento" })).toBeVisible();
  }

  async expectSuccessNotice(message: string): Promise<void> {
    const notice = this.page.getByRole("status").filter({ hasText: message });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(message);
  }

  async expectEmptyResult(): Promise<void> {
    await expect(this.page.getByText(
      "No se encontraron documentos DTE para los criterios seleccionados.",
      { exact: true }
    )).toBeVisible();
  }

  async reloadPage(): Promise<void> {
    const response = await captureApiAction(
      this.page,
      this.attach,
      "GET",
      "/api/documents",
      () => this.page.reload()
    );
    expect(response.status).toBe(200);
    await this.waitUntilReady();
  }
}
