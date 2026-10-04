import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

test("runs pandas and NumPy from a standalone file", async ({ page }) => {
  const networkRequests: string[] = [];
  const runtimeErrors: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) networkRequests.push(request.url());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const dashboardUrl = pathToFileURL(path.resolve("dist/dashboard.html")).toString();
  await page.goto(dashboardUrl);

  await expect(page.getByText("オフライン実行中")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText("￥754,000")).toBeVisible();

  await expect(page.locator("header img")).toHaveAttribute("src", /^data:image\/svg\+xml/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /^data:image\/svg\+xml/);
  await expect
    .poll(() =>
      page
        .locator("header img")
        .evaluate(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);

  await page.getByRole("link", { name: "グラフ" }).click();
  await expect(page).toHaveURL(/#\/charts$/);
  await expect(page.getByRole("heading", { name: "月次売上" })).toBeVisible();
  await expect(page.locator(".recharts-wrapper")).toBeVisible();

  await page.getByRole("link", { name: "テーブル" }).click();
  await expect(page).toHaveURL(/#\/tables$/);
  await expect(page.getByRole("heading", { name: "月次サマリー" })).toBeVisible();

  await page.getByRole("radio", { name: "West" }).check();
  await page.getByRole("link", { name: "サマリー" }).click();
  await expect(page.getByText("￥335,000")).toBeVisible({ timeout: 120_000 });
  expect(networkRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});
