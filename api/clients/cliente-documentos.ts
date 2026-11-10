import type {
  ApiResult,
  DocumentDto,
  DocumentFilters,
  DocumentInput,
  DocumentPatch
} from "../models/documento";
import { ApiTransport } from "./transporte-api";

export class DocumentsClient {
  constructor(private readonly transport: ApiTransport) {}

  create(input: DocumentInput): Promise<ApiResult<DocumentDto>> {
    return this.transport.send<DocumentDto>("POST", "/api/documents", { body: input });
  }

  list(filters: DocumentFilters = {}): Promise<ApiResult<DocumentDto[]>> {
    const query = new URLSearchParams();
    if (filters.rut) query.set("rut", filters.rut);
    if (filters.tipoDte) query.set("tipoDte", filters.tipoDte);
    if (filters.estado) query.set("estado", filters.estado);
    if (filters.page !== undefined) query.set("page", String(filters.page));
    if (filters.pageSize !== undefined) query.set("pageSize", String(filters.pageSize));
    const suffix = query.size > 0 ? "?" + query.toString() : "";
    return this.transport.send<DocumentDto[]>("GET", "/api/documents" + suffix);
  }

  get(id: string): Promise<ApiResult<DocumentDto>> {
    return this.transport.send<DocumentDto>("GET", "/api/documents/" + encodeURIComponent(id));
  }

  update(id: string, input: DocumentInput): Promise<ApiResult<DocumentDto>> {
    return this.transport.send<DocumentDto>("PUT", "/api/documents/" + encodeURIComponent(id), { body: input });
  }

  patch(id: string, patch: DocumentPatch): Promise<ApiResult<DocumentDto>> {
    return this.transport.send<DocumentDto>("PATCH", "/api/documents/" + encodeURIComponent(id), { body: patch });
  }

  delete(id: string): Promise<ApiResult<null>> {
    return this.transport.send<null>("DELETE", "/api/documents/" + encodeURIComponent(id));
  }
}
