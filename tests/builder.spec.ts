import { expect, test } from "@playwright/test";

test("builds, validates, and exports dashboard controls in development", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("button", { name: "Builderを開く" }).click();

  await page.getByLabel("タイトル").fill("Builder preview");
  await page.getByRole("button", { name: "Radioを追加" }).click();
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを保存" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("dashboard.json");

  await page.getByLabel("タイトル").fill("");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await page.getByRole("button", { name: "絞り込みを表示" }).click();
  await expect(page.getByText("新しい条件")).toBeVisible();
});
