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
  await page.getByRole("button", { name: "項目を追加" }).click();
  await page.getByRole("button", { name: "数値スライダーを追加" }).click();
  const sliderEditor = page.locator("fieldset").filter({ hasText: "SLIDER PARAMETER" });
  await sliderEditor.getByRole("button", { name: "値を追加" }).click();
  await sliderEditor.getByRole("spinbutton", { name: "デフォルト値1" }).fill("25");
  await sliderEditor.getByRole("spinbutton", { name: "デフォルト値2" }).fill("75");
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
  const contentWizard = page.getByRole("dialog", { name: "コンテンツを追加" });
  await page.getByRole("button", { name: /^指標/ }).click();
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(contentWizard.getByText("data/raw/sales.csv")).toBeVisible();
  await expect(contentWizard.getByText("logic/analysis.py", { exact: true })).toBeVisible();
  await contentWizard.getByLabel("Pythonロジック").selectOption("sales-orders");
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByLabel("タイトル").fill("詳細注文件数");
  await page.getByRole("button", { name: "コンテンツを作成" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();
  await expect(page).toHaveURL(/#\/details$/);
  await expect(page.getByText("詳細注文件数")).toBeVisible();
  await expect(page.getByText("255")).toBeVisible();

  await page.getByRole("button", { name: "詳細注文件数を編集" }).click();
  await expect(page.getByLabel("Pythonロジック")).toHaveValue("sales-orders");

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
  await expect(page.getByRole("region", { name: "パラメータ" }).getByRole("slider")).toHaveCount(2);
});

test("selects a chart type from the visual catalog", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("link", { name: "グラフ" }).click();
  await page.getByRole("button", { name: "月次売上を編集" }).click();
  await page.getByRole("button", { name: "変更" }).click();

  const dialog = page.getByRole("dialog", { name: "チャートタイプを選択" });
  await expect(dialog.getByRole("button", { name: /折れ線グラフ/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: /棒グラフ/ }).click();

  await expect(page.locator("strong:visible").filter({ hasText: /^棒グラフ$/ })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "チャートタイプを選択" })).not.toBeVisible();

  await page.getByRole("checkbox", { name: "凡例を表示" }).check();
  await page.getByLabel("凡例の位置").selectOption("right");
  await page.getByLabel("縦軸の軸タイトル").fill("売上額");
  await page.getByLabel("縦軸の最小値の設定").selectOption("fixed");
  await page.getByRole("spinbutton", { name: "縦軸の最小値", exact: true }).fill("0");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();

  await expect(page.getByText("売上額", { exact: true })).toBeVisible();
  await expect(page.getByText("revenue", { exact: true })).toBeVisible();
});

test("guides chart creation through the content wizard", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("link", { name: "グラフ" }).click();
  await page.getByRole("button", { name: "グラフにコンテンツを追加" }).click();

  const wizard = page.getByRole("dialog", { name: "コンテンツを追加" });
  await wizard.getByRole("button", { name: /^グラフ/ }).click();
  await wizard.getByRole("button", { name: "次へ" }).click();
  await expect(wizard.getByRole("heading", { name: "Pythonロジックを紐付け" })).toBeVisible();
  await wizard.getByRole("button", { name: "次へ" }).click();
  await expect(wizard.getByRole("heading", { name: "グラフを設定" })).toBeVisible();
  await wizard.getByRole("button", { name: "次へ" }).click();
  await expect(wizard.getByRole("heading", { name: "軸の書式を設定" })).toBeVisible();
  await wizard.getByLabel("縦軸の軸タイトル").fill("金額");
  await wizard.getByRole("button", { name: "コンテンツを作成" }).click();

  await expect(page.getByText("新しいグラフ")).toBeVisible();
});

test("selects dashboard CSV and Python files for analysis logic", async ({ page, request }) => {
  const response = await request.get("http://127.0.0.1:3030/__dashlet/assets");
  await expect(response).toBeOK();
  expect(await response.json()).toEqual({
    csv: ["data/raw/sales.csv"],
    python: ["logic/analysis.py", "logic/orders.py", "logic/revenue.py"],
  });

  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("button", { name: "Pythonロジックを管理" }).click();

  await expect(page.getByLabel("CSVファイル")).toHaveValue("data/raw/sales.csv");
  await expect(page.getByLabel("Pythonファイル").first()).toHaveValue("logic/analysis.py");
  await expect(page.getByLabel("入力CSV").first()).toHaveValue("sales");
  await page.getByText("Pythonソースを編集").first().click();
  await expect(page.getByLabel("logic/analysis.pyのPythonソース")).toBeVisible();
});
