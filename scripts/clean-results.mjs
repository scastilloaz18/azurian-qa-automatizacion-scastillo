import { rm } from "node:fs/promises";
import { resolve, sep } from "node:path";

const projectRoot = resolve(process.cwd());
const generatedDirectories = ["allure-results", "allure-report"];

for (const directory of generatedDirectories) {
  const target = resolve(projectRoot, directory);
  if (!target.startsWith(projectRoot + sep)) {
    throw new Error("Refusing to remove a path outside the automation project.");
  }
  await rm(target, { recursive: true, force: true });
}
