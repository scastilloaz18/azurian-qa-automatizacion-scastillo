import "dotenv/config";

const configuredUrl = process.env.BASE_URL || "http://localhost:3000";
const parsedUrl = new URL(configuredUrl);
if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
  throw new Error("BASE_URL debe usar http o https.");
}

const username = process.env.AZURIAN_USERNAME?.trim() ?? "";
const password = process.env.AZURIAN_PASSWORD ?? "";
if (!username) throw new Error("Configura AZURIAN_USERNAME en tu archivo .env local.");
if (!password) throw new Error("Configura AZURIAN_PASSWORD en tu archivo .env local.");

const headlessValue = (process.env.HEADLESS || "true").trim().toLowerCase();
if (headlessValue !== "true" && headlessValue !== "false") {
  throw new Error("HEADLESS debe ser true o false.");
}

export const testConfig = Object.freeze({
  baseUrl: parsedUrl.origin,
  username,
  password,
  headless: headlessValue === "true",
  requestTimeoutMs: 15_000,
  actionTimeoutMs: 10_000,
  navigationTimeoutMs: 15_000
});
