import type { APIRequestContext } from "@playwright/test";
import type { EvidenceWriter } from "./transporte-api";
import { ApiTransport } from "./transporte-api";
import { AuthClient } from "./cliente-autenticacion";
import { DocumentsClient } from "./cliente-documentos";

export class ApiClient {
  readonly auth: AuthClient;
  readonly documents: DocumentsClient;

  constructor(context: APIRequestContext, runId: string, writeEvidence: EvidenceWriter) {
    const transport = new ApiTransport(context, runId, writeEvidence);
    this.auth = new AuthClient(transport);
    this.documents = new DocumentsClient(transport);
  }
}
