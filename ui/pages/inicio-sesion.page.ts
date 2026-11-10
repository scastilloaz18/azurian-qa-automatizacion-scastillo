import { expect, type Page } from "@playwright/test";
import type { EvidenceWriter } from "../../api/clients/transporte-api";
import { testConfig } from "../../support/config";
import { assertStatus } from "../../shared/verificaciones";
import { captureApiAction, recordApiResponse } from "./evidencia-api";

export class LoginPage {
  constructor(
    private readonly page: Page,
    private readonly attach: EvidenceWriter
  ) {}

  async open(): Promise<void> {
    await this.page.goto(new URL("/login", testConfig.baseUrl).toString());
    await expect(this.page.getByRole("button", { name: "Iniciar Sesión", exact: true })).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.page.getByLabel("Usuario o Correo Electrónico", { exact: true }).fill(email);
    await this.page.getByLabel("Contraseña", { exact: true }).fill(password);

    const initialListPromise = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/documents" && response.request().method() === "GET"
    );
    const response = await captureApiAction(
      this.page,
      this.attach,
      "POST",
      "/api/auth/login",
      () => this.page.getByRole("button", { name: "Iniciar Sesión", exact: true }).click()
    );
    await assertStatus(this.attach, 200, response.status, "login del portal");
    await expect(this.page).toHaveURL(/\/dashboard\/?$/);
    const initialList = await initialListPromise;
    const listEvidence = await recordApiResponse(initialList, this.attach, "GET", "/api/documents");
    await assertStatus(this.attach, 200, listEvidence.status, "primera carga de documentos del portal");
  }
}
