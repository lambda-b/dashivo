import { expect, test } from "@playwright/test";
import { text } from "node:stream/consumers";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

test("downloads the saved dashboard as a standalone viewer", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "HTMLをダウンロード" }).click();
  const file = await download;
  const stream = await file.createReadStream();

  expect(file.suggestedFilename()).toBe("dashboard.html");
  expect(stream).not.toBeNull();

  const html = await text(stream!);
  expect(html).toContain("<!doctype html>");
  expect(html).not.toContain("Dashboard Builder");
  expect(html).not.toContain("/api/dashboard");
});

test("confirms closing and reloading when Python has unsaved changes", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030/#/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.click();
  await editor.fill("# unsaved code");
  await expect(page.getByText("未保存", { exact: true })).toBeVisible();

  const dismissed = page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();
  });
  await page.close({ runBeforeUnload: true });
  await dismissed;
  expect(page.isClosed()).toBe(false);
  await expect(editor).toContainText("# unsaved code");

  const accepted = page.waitForEvent("dialog").then((dialog) => dialog.accept());
  await Promise.all([accepted, page.reload()]);
  await expect(editor).toContainText("def execute");
  await expect(editor).not.toContainText("# unsaved code");
});

for (const failFirstSave of [false, true]) {
  test(`serializes saves across editors and updates the cache only on success (failure=${failFirstSave})`, async ({
    page,
  }) => {
    let dashboard = structuredClone(dashboardSource);
    let requests = 0;
    let releaseFirst!: () => void;
    const firstSave = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    await page.route("**/api/dashboards/sales-overview", async (route) => {
      if (route.request().method() === "PUT") {
        requests++;
        if (requests === 1) {
          await firstSave;
          if (failFirstSave) {
            await route.fulfill({ status: 500, json: { error: "Save failed" } });
            return;
          }
        }
        const change = route.request().postDataJSON();
        dashboard = { ...dashboard, ...(change.settings ?? change) };
      }
      await route.fulfill({ json: { dashboard } });
    });

    await page.route("**/api/dashboards/sales-overview/assets", (route) =>
      route.fulfill({
        json: {
          csv: ["data/raw/sales.csv"],
          python: ["logic/analysis.py"],
        },
      }),
    );
    await page.route("**/api/dashboards/sales-overview/sources/csv**", (route) =>
      route.fulfill({ status: 201, json: { path: "data/new.csv" } }),
    );

    await page.goto("http://127.0.0.1:3030");
    await page.getByRole("button", { name: "ヘッダーを編集" }).click();
    await page.getByLabel("タイトル").fill("Serialized save");
    await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
    await expect.poll(() => requests).toBe(1);
    await page.getByRole("button", { name: "Builderを閉じる" }).click();

    await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
    await page.getByLabel("アップロードするCSVファイル").setInputFiles({
      name: "new.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,total\n2026-01-01,100\n"),
    });
    await expect(page.getByRole("button", { name: "CSVを登録中…" })).toBeVisible();
    releaseFirst();
    await expect(page.getByRole("list", { name: "入力CSV一覧" }).getByRole("listitem")).toHaveCount(
      2,
    );
    await expect.poll(() => requests).toBe(2);

    await page.getByRole("button", { name: "Dashboardへ戻る" }).click();
    const savedTitle = failFirstSave ? dashboardSource.title : "Serialized save";
    await expect(page.getByRole("heading", { level: 1, name: savedTitle })).toBeVisible();
    await page.getByRole("button", { name: "ヘッダーを編集" }).click();
    await page.getByRole("button", { name: "元に戻す" }).click();
    await expect(page.getByLabel("タイトル")).toHaveValue(savedTitle);
  });
}

test("edits, validates, and saves the dashboard configuration in development", async ({ page }) => {
  let savedDashboard: { title?: string; tabs?: { id: string; label: string }[] } | undefined;
  await page.route("**/api/dashboards/sales-overview", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { dashboard: dashboardSource } });
      return;
    }
    savedDashboard = { ...dashboardSource, ...route.request().postDataJSON().settings };
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
  await contentWizard.getByText("sales-orders", { exact: true }).first().click();
  await contentWizard.getByRole("button", { name: "コンテンツを追加" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Builder preview" })).toBeVisible();
  await expect(page).toHaveURL(/#\/details$/);
  await expect(page.getByRole("article").getByText("注文件数")).toBeVisible();
  await expect(page.getByText("255")).toBeVisible();

  await page.getByRole("button", { name: "注文件数を編集" }).click();
  await expect(page.getByLabel("Python出力")).toHaveValue("sales-orders");

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

test("Workbench runs Figure code with explicit parameters and independent CSV preview", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3030");
  const dashboardTitle = await page.getByRole("heading", { level: 1 }).innerText();
  await page.getByRole("radio", { name: "East", exact: true }).check();
  await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
  await expect(page.getByText("ロジック定義", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "選択中の定義を削除" })).toBeDisabled();
  await expect(
    page.getByText("「グラフ」のコンテンツで使用中です。", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("heading", { name: "月次売上", exact: true })).toBeVisible();
  await page.getByText("検証用パラメータ", { exact: true }).click();
  await page.getByRole("radio", { name: "West", exact: true }).check();
  await expect(page.getByRole("button", { name: "実行", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("heading", { name: "月次売上", exact: true })).toBeVisible();
  await page.locator(".cm-content").fill("invalid python !");
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("SyntaxError");
  await page.getByRole("tab", { name: "入力値参照" }).click();
  await expect(page.getByLabel("プレビューするCSV")).toHaveValue("sales");
  await expect(page.getByRole("cell", { name: "East", exact: true }).first()).toBeVisible();
  await expect(page.getByText("利用可能なParameters")).toBeVisible();
  const dismiss = page.waitForEvent("dialog").then((dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Dashboardへ戻る" }).click();
  await dismiss;
  await expect(page).toHaveURL(/builder\/python/);
  const accept = page.waitForEvent("dialog").then((dialog) => dialog.accept());
  await page.getByRole("button", { name: "Dashboardへ戻る" }).click();
  await accept;
  await expect(page.getByRole("heading", { level: 1, name: dashboardTitle })).toBeVisible();
  await expect(page.getByRole("radio", { name: "East", exact: true })).toBeChecked();
});

test("logic creation saves a file and registration in one request", async ({ page }) => {
  let dashboard = structuredClone(dashboardSource);
  let createdSource = "";
  await page.route("**/api/dashboards/sales-overview", async (route) => {
    if (route.request().method() === "PUT") {
      const { logic } = route.request().postDataJSON();
      createdSource = logic.source;
      dashboard.analysis.logic.push({ id: logic.id, type: "python", path: logic.path });
    }
    await route.fulfill({ json: { dashboard } });
  });
  await page.route("**/api/sources/python?path=logic%2Flogic-1.py", (route) =>
    route.fulfill({ json: { source: createdSource } }),
  );
  await page.goto("http://127.0.0.1:3030");
  await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
  await page.getByRole("button", { name: "ロジックを追加" }).click();
  const dialog = page.getByRole("dialog", { name: "ロジックを追加" });
  await expect(dialog.getByLabel("Logic ID")).toHaveValue("logic-1");
  await dialog.getByRole("button", { name: "作成", exact: true }).click();
  await expect(page).toHaveURL(/logic-1$/);
  await expect(page.getByRole("button", { name: "選択中の定義を削除" })).toBeEnabled();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("article").getByText("新しい数値")).toBeVisible();
  expect(createdSource).toContain("fig = plot.metric(0)");
  expect(createdSource).toContain("return fig");
  await expect(page.getByRole("button", { name: "dashboard.jsonを保存" })).toHaveCount(0);
});

test("Python snippets keep completion and Tab field navigation", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030/#/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.fill("");
  await editor.pressSequentially("#chart");
  await expect(page.getByRole("option").filter({ hasText: "#chart" })).toBeVisible();
  await editor.press("Tab");
  await expect(editor).toContainText("plot.line");
  await editor.pressSequentially("monthly");
  await editor.press("Tab");
  await editor.pressSequentially("month");
  await expect(editor).toContainText('plot.line(monthly, x="month"');
});

test("Python receives isolated CSV copies and preserves missing values across the worker", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3030/#/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.fill(`from dashivo import plot
import pandas as pd

def execute(inputs, params):
    inputs["sales"].loc[:, "revenue"] = -1
    return plot.table(pd.DataFrame({"date": [pd.Timestamp("2026-01-01"), pd.NaT], "value": [1.0, float("nan")]})).title("Missing values")
`);
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Missing values" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "2026-01-01T00:00:00" })).toBeVisible();
  await page.getByRole("tab", { name: "入力値参照" }).click();
  await expect(page.getByRole("cell", { name: "125000", exact: true })).toBeVisible();
  await editor.fill(`from dashivo import plot

def execute(inputs, params):
    return plot.metric(inputs["sales"]["revenue"].sum()).title("Unchanged inputs")
`);
  await page.getByRole("tab", { name: "出力プレビュー" }).click();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("article").getByText("754,000", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
