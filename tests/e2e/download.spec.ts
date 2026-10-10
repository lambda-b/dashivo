import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

test("server-generated HTML runs Python and switches tabs without network access", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-download-browser-"));
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    const file = path.join(root, "dashboard.html");
    await promisify(execFile)(
      process.execPath,
      [path.resolve("tests/fixtures/export-dashboard.ts"), file],
      {
        timeout: 90_000,
        env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=1536" },
      },
    );
    await page.goto(pathToFileURL(file).href);
    await expect(page.getByText("￥754,000", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "グラフ" }).click();
    await expect(page.locator(".recharts-wrapper")).toBeVisible();
    await page.getByRole("link", { name: "サマリー" }).click();
    await page.getByLabel("開始日", { exact: true }).fill("2026-02-01");
    await page.getByLabel("終了日", { exact: true }).fill("2026-02-01");
    await expect(page.getByText("￥251,000", { exact: true })).toBeVisible();
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
