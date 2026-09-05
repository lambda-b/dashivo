import { expect, test } from "@playwright/test";

test("validates and previews dashboard schema changes in development", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("button", { name: "Builderを開く" }).click();

  const editor = page.getByLabel("dashboard.json");
  const dashboard = JSON.parse(await editor.inputValue());
  dashboard.title = "Builder preview";
  await editor.fill(JSON.stringify(dashboard, null, 2));
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを保存" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("dashboard.json");

  await editor.fill("{ invalid json }");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});
