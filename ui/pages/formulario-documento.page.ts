import { expect, type Page } from "@playwright/test";
import type { EvidenceWriter } from "../../api/clients/transporte-api";
import type { DocumentInput, DocumentPatch } from "../../api/models/documento";
import { captureApiAction, type CapturedApiResponse } from "./evidencia-api";

export class DocumentFormPage {
  constructor(
    private readonly page: Page,
    private readonly attach: EvidenceWriter
  ) {}

  private dialog(title: string) {
    return this.page.getByRole("dialog", { name: title, exact: true });
  }

  async submitNewDocument(input: DocumentInput): Promise<CapturedApiResponse> {
    const dialog = this.dialog("Emitir nuevo documento");
    await dialog.getByLabel("Tipo de documento tributario *", { exact: true }).selectOption(input.tipoDte);
    await dialog.getByLabel("Fecha de emisión *", { exact: true }).fill(input.fechaEmision);
    await dialog.getByLabel("Número de folio *", { exact: true }).fill(String(input.folio));
    await dialog.getByLabel("RUT receptor *", { exact: true }).fill(input.rutReceptor);
    await dialog.getByLabel("Monto total (CLP) *", { exact: true }).fill(String(input.monto));
    await dialog.getByLabel("Observaciones", { exact: true }).fill(input.observaciones ?? "");

    if (input.deliveryChannel === "EMAIL") {
      await dialog.getByLabel("Correo electrónico", { exact: true }).check();
    } else {
      await dialog.getByLabel("Portal", { exact: true }).check();
    }

    await dialog.getByLabel("Enviar copia al contacto", { exact: true }).setChecked(input.sendCopy);
    const contactEmail = dialog.getByLabel(/Correo de contacto/);
    const contactRequired = input.sendCopy || input.deliveryChannel === "EMAIL";
    if (contactRequired) {
      await expect(contactEmail).toBeEnabled();
      await contactEmail.fill(input.contactEmail ?? "");
    } else {
      await expect(contactEmail).toBeDisabled();
    }

    const response = await captureApiAction(
      this.page,
      this.attach,
      "POST",
      "/api/documents",
      () => dialog.getByRole("button", { name: "Guardar y emitir", exact: true }).click()
    );
    expect(response.status).toBe(201);
    await expect(dialog).toBeHidden();
    return response;
  }

  async updateDocument(documentId: string, folio: number, patch: DocumentPatch): Promise<CapturedApiResponse> {
    const dialog = this.dialog("Editar documento - Folio #" + folio);
    await expect(dialog.getByLabel("Número de folio *", { exact: true })).toBeDisabled();
    await expect(dialog.getByLabel("Tipo de documento tributario *", { exact: true })).toBeDisabled();

    if (patch.monto !== undefined) {
      await dialog.getByLabel("Monto total (CLP) *", { exact: true }).fill(String(patch.monto));
    }
    if (patch.observaciones !== undefined) {
      await dialog.getByLabel("Observaciones", { exact: true }).fill(patch.observaciones ?? "");
    }

    const response = await captureApiAction(
      this.page,
      this.attach,
      "PUT",
      "/api/documents/" + documentId,
      () => dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click()
    );
    expect(response.status).toBe(200);
    await expect(dialog).toBeHidden();
    return response;
  }
}
