import { After, Before, Status, setDefaultTimeout } from "@cucumber/cucumber";
import type { ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, request } from "@playwright/test";
import { ApiClient } from "../api/clients/cliente-api";
import { testConfig } from "./config";
import { TestWorld } from "./world";

setDefaultTimeout(90_000);

Before(async function (this: TestWorld) {
  const context = await request.newContext({
    baseURL: testConfig.baseUrl,
    timeout: testConfig.requestTimeoutMs,
    extraHTTPHeaders: { "x-lab-run-id": this.runId }
  });
  this.setApiRequestContext(context);
  this.setApiClient(new ApiClient(context, this.runId, this.attachJson));
});

Before({ tags: "@ui" }, async function (this: TestWorld) {
  const browser = await chromium.launch({ headless: testConfig.headless });
  this.setBrowser(browser);
  const context = await browser.newContext();
  const runIdScript =
    "if (window.location.protocol === 'http:' || window.location.protocol === 'https:') { window.localStorage.setItem('azurian_lab_run_id', " + JSON.stringify(this.runId) + "); }";
  await context.addInitScript({ content: runIdScript });
  this.setBrowserContext(context);
  const page = await context.newPage();
  page.setDefaultTimeout(testConfig.actionTimeoutMs);
  page.setDefaultNavigationTimeout(testConfig.navigationTimeoutMs);
  this.setPage(page);
});

After(async function (this: TestWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED) {
    const page = this.getPageOrNull();
    if (page) {
      try {
        await this.attach(await page.screenshot({ fullPage: true }), "image/png");
      } catch {
        await this.attach("No fue posible tomar una captura de la página.", "text/plain");
      }
    }
  }

  const browserContext = this.getBrowserContext();
  if (browserContext) await browserContext.close();
  const browser = this.getBrowser();
  if (browser) await browser.close();
  const apiContext = this.getApiRequestContextOrNull();
  if (apiContext) await apiContext.dispose();
});
