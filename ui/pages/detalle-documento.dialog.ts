import { expect, type Page } from "@playwright/test";
import type { DocumentDto } from "../../api/models/documento";

function formatClp(amount: number): string {
  return new Intl.NumberFormat("es-CL").format(amount);
}

const STATE_LABELS = {
  ACEPTADO: "Aceptado",
  PENDIENTE: "Pendiente",
  RECHAZADO: "Rechazado"
} as const;

export class DocumentDetailsDialog {
  constructor(private readonly page: Page) {}

  async expectDocument(document: DocumentDto): Promise<void> {
    const dialog = this.page.getByRole("dialog", {
      name: "Detalle DTE - Folio #" + document.folio,
      exact: true
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Tipo: " + document.tipoDte);
    await expect(dialog).toContainText("RUT Receptor: " + document.rutReceptor);
    await expect(dialog).toContainText("Monto: $ " + formatClp(document.monto) + " CLP");
    await expect(dialog).toContainText("Fecha Emisión: " + document.fechaEmision);
    await expect(dialog).toContainText("Estado: " + STATE_LABELS[document.estado]);
    await expect(dialog).toContainText("Canal: " + document.deliveryChannel);
    await expect(dialog).toContainText("Copia al contacto: " + (document.sendCopy ? "Sí" : "No"));
    if (document.contactEmail) await expect(dialog).toContainText("Correo de contacto: " + document.contactEmail);
    if (document.observaciones) await expect(dialog).toContainText("Observaciones: " + document.observaciones);
  }

  async close(): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}
