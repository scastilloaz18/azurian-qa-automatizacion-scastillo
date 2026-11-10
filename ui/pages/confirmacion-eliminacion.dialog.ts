import { expect, type Page } from "@playwright/test";
import type { EvidenceWriter } from "../../api/clients/transporte-api";
import { captureApiAction, recordApiResponse, type CapturedApiResponse } from "./evidencia-api";

export class ConfirmDeleteDialog {
  constructor(
    private readonly page: Page,
    private readonly attach: EvidenceWriter
  ) {}

  async confirm(documentId: string): Promise<{ deletion: CapturedApiResponse; refreshedList: CapturedApiResponse }> {
    const dialog = this.page.getByRole("alertdialog", { name: "Eliminar documento", exact: true });
    const refreshedListPromise = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/documents" && response.request().method() === "GET"
    );
    const deletion = await captureApiAction(
      this.page,
      this.attach,
      "DELETE",
      "/api/documents/" + documentId,
      () => dialog.getByRole("button", { name: "Eliminar documento", exact: true }).click()
    );
    expect(deletion.status).toBe(204);
    expect(deletion.rawBody).toBe("");
    await expect(dialog).toBeHidden();
    const refreshedListResponse = await refreshedListPromise;
    const refreshedList = await recordApiResponse(refreshedListResponse, this.attach, "GET", "/api/documents");
    expect(refreshedList.status).toBe(200);
    return { deletion, refreshedList };
  }

  async expectConfirmationFor(folio: number): Promise<void> {
    const dialog = this.page.getByRole("alertdialog", { name: "Eliminar documento", exact: true });
    await expect(dialog).toContainText("folio #" + folio);
  }
}
