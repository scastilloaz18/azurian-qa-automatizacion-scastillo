import { expect } from "@playwright/test";
import type { TestWorld } from "../../support/world";
import { testConfig } from "../../support/config";
import { assertStatus } from "../../shared/verificaciones";
import { requireBody } from "../../shared/verificaciones";

export async function ensureApiSession(world: TestWorld): Promise<void> {
  const api = world.getApiClient();
  if (api.auth.isAuthenticated()) return;

  const response = await api.auth.login(testConfig.username, testConfig.password);
  await assertStatus(world.attachJson, 200, response.status, "login API");
  const login = await requireBody(response.body, "POST /api/auth/login");
  const expectedUser = {
    id: "user-azurian-01",
    email: testConfig.username,
    name: "Administrador Azurian",
    role: "QA Lab Participant"
  };

  await world.attachJson("Forma esperada del login", {
    token: "JWT de tres segmentos",
    expiresIn: "entero positivo",
    user: expectedUser
  });
  await world.attachJson("Respuesta recibida del login", {
    ...login,
    token: "[redacted]"
  });
  expect(Object.keys(login).sort()).toEqual(["expiresIn", "token", "user"]);
  expect(login.token.split(".")).toHaveLength(3);
  expect(Number.isInteger(login.expiresIn)).toBe(true);
  expect(login.expiresIn).toBeGreaterThan(0);
  expect(login.user).toStrictEqual(expectedUser);
}
