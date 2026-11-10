export const DTE_TYPES = ["DTE 33", "DTE 34", "DTE 39"] as const;
export type DteType = (typeof DTE_TYPES)[number];
export const DOCUMENT_STATUSES = ["ACEPTADO", "PENDIENTE", "RECHAZADO"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export type DeliveryChannel = "PORTAL" | "EMAIL";

export interface DocumentInput {
  tipoDte: DteType;
  folio: number;
  rutReceptor: string;
  monto: number;
  fechaEmision: string;
  deliveryChannel: DeliveryChannel;
  sendCopy: boolean;
  contactEmail: string | null;
  observaciones: string | null;
  attachmentName: string | null;
}

export interface DocumentDto extends DocumentInput {
  id: string;
  estado: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type DocumentPatch = Partial<
  Pick<
    DocumentInput,
    | "rutReceptor"
    | "monto"
    | "fechaEmision"
    | "deliveryChannel"
    | "sendCopy"
    | "contactEmail"
    | "observaciones"
    | "attachmentName"
  >
>;

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
}
export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: AuthUserDto;
}
export interface ApiErrorDetail {
  field: string;
  message: string;
}
export interface ApiErrorBody {
  error: string;
  code: string;
  details?: ApiErrorDetail[];
}
export interface ApiResult<T> {
  status: number;
  body: T | null;
  rawBody: string;
  headers: Record<string, string>;
  url: string;
}
export interface DocumentFilters {
  rut?: string;
  tipoDte?: DteType | "TODOS";
  estado?: DocumentStatus | "TODOS";
  page?: number;
  pageSize?: number;
}
