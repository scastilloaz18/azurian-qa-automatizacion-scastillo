import { Given } from "@cucumber/cucumber";
import type { TestWorld } from "../../support/world";
import { createDocumentPair, createOwnDocument } from "../../api/fixtures/documento.fixture";
import { ensureApiSession } from "../../api/fixtures/sesion.fixture";

Given("que tengo una sesión válida para gestionar documentos", async function (this: TestWorld) {
  await ensureApiSession(this);
});

Given("que existe un documento tributario propio", async function (this: TestWorld) {
  await ensureApiSession(this);
  await createOwnDocument(this);
});

Given("que existen dos documentos propios con el mismo receptor y tipo", async function (this: TestWorld) {
  await ensureApiSession(this);
  await createDocumentPair(this);
});
