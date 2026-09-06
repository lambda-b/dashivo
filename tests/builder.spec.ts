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
  await page.getByRole("button", { name: "Selectを追加" }).click();
  await page.getByRole("button", { name: "Checkboxを追加" }).click();
  await page.getByRole("button", { name: "Date Rangeを追加" }).click();
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await page.getByRole("button", { name: "タブを編集" }).click();
  await page.getByRole("button", { name: "タブを追加" }).click();
  await page.getByLabel("Route ID").last().fill("details");
  await page.getByLabel("表示名").last().fill("詳細");
  await page.getByRole("button", { name: "詳細を上へ移動" }).click();
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await page.getByRole("link", { name: "詳細" }).click();
  await page.getByRole("button", { name: "詳細にコンテンツを追加" }).click();
  await page.getByRole("button", { name: "指標" }).click();
  await page.getByLabel("タイトル").fill("詳細注文件数");
  await page.getByLabel("Metric key").fill("orders");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();
  await expect(page).toHaveURL(/#\/details$/);
  await expect(page.getByText("詳細注文件数")).toBeVisible();
  await expect(page.getByText("255")).toBeVisible();

  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await page.getByRole("button", { name: "詳細注文件数を編集" }).click();
  await expect(page.getByLabel("Metric key")).toHaveValue("orders");

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
  await expect(
    page.getByRole("region", { name: "パラメータ" }).getByText("新しい条件").first(),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "新しい条件" })).toBeVisible();
  await expect(page.getByLabel("開始日")).toBeVisible();
});
