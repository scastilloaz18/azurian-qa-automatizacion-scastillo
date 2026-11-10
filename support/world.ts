import { World, setWorldConstructor, type IWorldOptions } from "@cucumber/cucumber";
import type { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test";
import type { ApiClient } from "../api/clients/cliente-api";
import type { EvidenceWriter } from "../api/clients/transporte-api";
import type { DocumentDto, DocumentInput, DocumentPatch } from "../api/models/documento";
import { createRunId } from "../shared/datos-prueba";

export class TestWorld extends World<Record<string, never>> {
  readonly runId = createRunId();
  readonly attachJson: EvidenceWriter = async (name, value) => {
    await this.attach(JSON.stringify(value, null, 2), "application/json");
  };

  private apiRequestContext: APIRequestContext | null = null;
  private apiClient: ApiClient | null = null;
  private browser: Browser | null = null;
  private browserContext: BrowserContext | null = null;
  private page: Page | null = null;
  private documentInput: DocumentInput | null = null;
  private targetDocument: DocumentDto | null = null;
  private relatedDocuments: DocumentDto[] = [];
  private createdDocument: DocumentDto | null = null;
  private updatedDocument: DocumentDto | null = null;
  private deletedResponse: { status: number; rawBody: string } | null = null;
  private listResponse: { documents: DocumentDto[]; total: number } | null = null;
  private patch: DocumentPatch | null = null;

  constructor(options: IWorldOptions<Record<string, never>>) {
    super(options);
  }

  setApiRequestContext(value: APIRequestContext): void { this.apiRequestContext = value; }
  getApiRequestContextOrNull(): APIRequestContext | null { return this.apiRequestContext; }
  getApiRequestContext(): APIRequestContext {
    if (!this.apiRequestContext) throw new Error("La sesión HTTP del escenario no está preparada.");
    return this.apiRequestContext;
  }

  setApiClient(value: ApiClient): void { this.apiClient = value; }
  getApiClient(): ApiClient {
    if (!this.apiClient) throw new Error("El cliente API del escenario no está preparado.");
    return this.apiClient;
  }

  setBrowser(value: Browser): void { this.browser = value; }
  getBrowser(): Browser | null { return this.browser; }
  setBrowserContext(value: BrowserContext): void { this.browserContext = value; }
  getBrowserContext(): BrowserContext | null { return this.browserContext; }
  setPage(value: Page): void { this.page = value; }
  getPageOrNull(): Page | null { return this.page; }
  getPage(): Page {
    if (!this.page) throw new Error("Este escenario no abrió una página de navegador.");
    return this.page;
  }

  setDocumentInput(value: DocumentInput): void { this.documentInput = value; }
  getDocumentInput(): DocumentInput {
    if (!this.documentInput) throw new Error("El escenario aún no preparó datos de documento.");
    return this.documentInput;
  }

  setTargetDocument(value: DocumentDto): void { this.targetDocument = value; }
  getTargetDocument(): DocumentDto {
    if (!this.targetDocument) throw new Error("El escenario aún no seleccionó un documento propio.");
    return this.targetDocument;
  }

  setRelatedDocuments(value: DocumentDto[]): void { this.relatedDocuments = value; }
  getRelatedDocuments(): DocumentDto[] { return this.relatedDocuments; }

  setCreatedDocument(value: DocumentDto): void { this.createdDocument = value; }
  getCreatedDocument(): DocumentDto {
    if (!this.createdDocument) throw new Error("El escenario no guardó la respuesta de creación.");
    return this.createdDocument;
  }

  setUpdatedDocument(value: DocumentDto): void { this.updatedDocument = value; }
  getUpdatedDocument(): DocumentDto {
    if (!this.updatedDocument) throw new Error("El escenario no guardó la respuesta de actualización.");
    return this.updatedDocument;
  }

  setDeletedResponse(value: { status: number; rawBody: string }): void { this.deletedResponse = value; }
  getDeletedResponse(): { status: number; rawBody: string } {
    if (!this.deletedResponse) throw new Error("El escenario no guardó la respuesta de eliminación.");
    return this.deletedResponse;
  }

  setListResponse(value: { documents: DocumentDto[]; total: number }): void { this.listResponse = value; }
  getListResponse(): { documents: DocumentDto[]; total: number } {
    if (!this.listResponse) throw new Error("El escenario no consultó la lista de documentos.");
    return this.listResponse;
  }

  setPatch(value: DocumentPatch): void { this.patch = value; }
  getPatch(): DocumentPatch {
    if (!this.patch) throw new Error("El escenario no definió los cambios.");
    return this.patch;
  }
}

setWorldConstructor(TestWorld);
