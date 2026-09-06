import { expect, test } from "@playwright/test";

test("builds, validates, and exports dashboard controls in development", async ({ page }) => {
  let savedDashboard: { title?: string } | undefined;
  await page.route("**/__dashlet/dashboard", async (route) => {
    savedDashboard = route.request().postDataJSON();
    await route.fulfill({ json: { dashboard: savedDashboard } });
  });
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("complementary").getByRole("button", { name: "パラメータを編集" }).click();

  await page.getByLabel("タイトル").fill("Builder preview");
  await page.getByRole("button", { name: "Radioを追加" }).click();
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();

  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();
  expect(savedDashboard?.title).toBe("Builder preview");

  await page.getByLabel("タイトル").fill("");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await expect(page.getByText("新しい条件")).toBeVisible();
});
