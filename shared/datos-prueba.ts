import { randomInt, randomUUID } from "node:crypto";
import type { DataTable } from "@cucumber/cucumber";
import {
  DTE_TYPES,
  type DeliveryChannel,
  type DocumentInput,
  type DocumentPatch,
  type DteType
} from "../api/models/documento";

const usedFolios = new Set<number>();
const usedRuts = new Set<string>();

function nextFolio(): number {
  let value = randomInt(2_000_000, 10_000_000);
  while (usedFolios.has(value)) value = randomInt(2_000_000, 10_000_000);
  usedFolios.add(value);
  return value;
}

function rutCheckDigit(body: string): string {
  let total = 0;
  let factor = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    total += Number(body[index]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - (total % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

function nextRut(): string {
  let rut = "";
  while (rut === "" || usedRuts.has(rut)) {
    const body = String(randomInt(10_000_000, 100_000_000));
    const formattedBody = body.slice(0, 2) + "." + body.slice(2, 5) + "." + body.slice(5, 8);
    rut = formattedBody + "-" + rutCheckDigit(body);
  }
  usedRuts.add(rut);
  return rut;
}

export function createRunId(): string {
  return "qa-" + randomUUID();
}

export function createDocumentInput(overrides: Partial<DocumentInput> = {}): DocumentInput {
  const defaults: DocumentInput = {
    tipoDte: "DTE 33",
    folio: nextFolio(),
    rutReceptor: nextRut(),
    monto: 450_000,
    fechaEmision: localDate(),
    deliveryChannel: "PORTAL",
    sendCopy: false,
    contactEmail: null,
    observaciones: null,
    attachmentName: null
  };
  return { ...defaults, ...overrides };
}

export function createRelatedDocumentInput(original: DocumentInput): DocumentInput {
  return {
    ...original,
    folio: nextFolio(),
    monto: original.monto + 1_000,
    observaciones: "Documento relacionado para distinguir la fila exacta."
  };
}

function tableValue(values: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = values[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

function localDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return String(now.getFullYear()) + "-" + month + "-" + day;
}

export function documentInputFromTable(table: DataTable): DocumentInput {
  const values = table.rowsHash();
  const tipoDteValue = tableValue(values, "Tipo de documento", "tipoDte") || "DTE 33";
  if (!DTE_TYPES.includes(tipoDteValue as DteType)) {
    throw new Error("tipoDte no válido en la tabla de datos: " + tipoDteValue);
  }

  const monto = Number(tableValue(values, "Monto (CLP)", "Monto", "monto") || "450000");
  if (!Number.isInteger(monto) || monto < 1 || monto > 999_999_999) {
    throw new Error("monto debe ser un entero CLP válido.");
  }

  let deliveryChannel: DeliveryChannel = "PORTAL";
  const channelValue = tableValue(values, "Canal de entrega", "deliveryChannel");
  if (channelValue === "EMAIL") deliveryChannel = "EMAIL";
  if (channelValue && channelValue !== "EMAIL" && channelValue !== "PORTAL") {
    throw new Error("Canal de entrega debe ser PORTAL o EMAIL.");
  }

  const sendCopy = tableValue(values, "Enviar copia", "sendCopy") === "true";
  const contactValue = tableValue(values, "Correo de contacto", "contactEmail");
  const contactEmail = contactValue ? contactValue.trim() : null;
  const dateValue = tableValue(values, "Fecha de emisión", "fechaEmision");
  const observationsValue = tableValue(values, "Observaciones", "observaciones");
  if ((deliveryChannel === "EMAIL" || sendCopy) && !contactEmail) {
    throw new Error("contactEmail es obligatorio para EMAIL o sendCopy=true.");
  }

  return createDocumentInput({
    tipoDte: tipoDteValue as DteType,
    monto,
    deliveryChannel,
    sendCopy,
    contactEmail,
    fechaEmision: dateValue || localDate(),
    observaciones: observationsValue ? observationsValue.trim() : null
  });
}

export function documentPatchFromTable(table: DataTable): DocumentPatch {
  const values = table.rowsHash();
  const patch: DocumentPatch = {};
  const montoValue = tableValue(values, "Monto (CLP)", "Monto", "monto");
  const observationsValue = tableValue(values, "Observaciones", "observaciones");
  if (montoValue !== undefined) {
    const monto = Number(montoValue);
    if (!Number.isInteger(monto) || monto < 1 || monto > 999_999_999) {
      throw new Error("monto debe ser un entero CLP válido.");
    }
    patch.monto = monto;
  }
  if (observationsValue !== undefined) patch.observaciones = observationsValue.trim() || null;
  if (Object.keys(patch).length === 0) {
    throw new Error("La tabla debe incluir al menos un campo editable.");
  }
  return patch;
}
