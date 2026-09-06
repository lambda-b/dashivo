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
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.getByRole("button", { name: "単一選択（ボタン）を追加" }).click();
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.getByRole("button", { name: "単一選択（リスト）を追加" }).click();
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.getByRole("button", { name: "複数選択を追加" }).click();
  const checkboxEditor = page.locator("fieldset").filter({ hasText: "CHECKBOX PARAMETER" });
  await checkboxEditor.getByRole("button", { name: "選択肢を追加" }).click();
  await checkboxEditor.getByLabel("選択肢1をデフォルトでチェック").check();
  await checkboxEditor.getByRole("radio", { name: "縦並び" }).check();

  const addedRadioEditor = page.locator("fieldset").filter({ hasText: "RADIO PARAMETER" }).last();
  await addedRadioEditor.getByRole("radio", { name: "縦並び" }).check();

  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.getByRole("button", { name: "日付範囲を追加" }).click();
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
  await expect(page.getByRole("radio", { name: "選択肢1" })).toBeChecked();
  const checkboxes = page.getByRole("region", { name: "パラメータ" }).getByRole("checkbox");
  await expect(checkboxes).toHaveCount(2);
  await expect(checkboxes.first()).toBeChecked();
  await checkboxes.last().check();
  await expect(checkboxes.last()).toBeChecked();
  await expect(page.getByLabel("開始日").last()).toBeVisible();
});
