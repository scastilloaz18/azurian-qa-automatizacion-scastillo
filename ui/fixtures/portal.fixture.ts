import type { TestWorld } from "../../support/world";
import { testConfig } from "../../support/config";
import { DocumentsPage } from "../pages/documentos.page";
import { LoginPage } from "../pages/inicio-sesion.page";

export function documentsPage(world: TestWorld): DocumentsPage {
  return new DocumentsPage(world.getPage(), world.attachJson);
}

export async function loginToPortal(world: TestWorld): Promise<void> {
  const login = new LoginPage(world.getPage(), world.attachJson);
  await login.open();
  await login.signIn(testConfig.username, testConfig.password);
  await documentsPage(world).waitUntilReady();
}
