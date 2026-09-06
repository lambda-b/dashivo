import { expect, test } from "@playwright/test";

test("edits, validates, and saves the dashboard configuration in development", async ({ page }) => {
  let savedDashboard: { title?: string; tabs?: { id: string; label: string }[] } | undefined;
  await page.route("**/__dashlet/dashboard", async (route) => {
    savedDashboard = route.request().postDataJSON();
    await route.fulfill({ json: { dashboard: savedDashboard } });
  });
  await page.goto("http://127.0.0.1:3030");

  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("Builder preview");
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await page.getByRole("complementary").getByRole("button", { name: "パラメータを編集" }).click();
  await page.getByRole("button", { name: "Radioを追加" }).click();
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await page.getByRole("button", { name: "タブを編集" }).click();
  await page.getByRole("button", { name: "タブを追加" }).click();
  await page.getByLabel("Route ID").last().fill("details");
  await page.getByLabel("表示名").last().fill("詳細");
  await page.getByRole("button", { name: "詳細を上へ移動" }).click();
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();
  await page.getByRole("link", { name: "詳細" }).click();
  await expect(page).toHaveURL(/#\/details$/);
  await expect(page.getByText("このタブにはコンテンツがありません。")).toBeVisible();

  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();
  expect(savedDashboard?.title).toBe("Builder preview");
  expect(savedDashboard?.tabs?.map((tab) => tab.id)).toEqual([
    "summary",
    "charts",
    "details",
    "tables",
  ]);

  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await expect(page.getByText("新しい条件")).toBeVisible();
});
