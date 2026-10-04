import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/dashboards/sales-overview", (route) =>
    route.fulfill({ json: { dashboard: source } }),
  );
  await page.route("**/api/dashboards/sales-overview/assets", (route) =>
    route.fulfill({
      json: {
        csv: source.analysis.inputs.map((input) => input.path),
        python: source.analysis.logic.map((logic) => logic.path),
      },
    }),
  );
});

test("shared fields and action buttons work across all parameter types", async ({ page }) => {
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/summary");
  await page.getByRole("button", { name: "パラメータを編集" }).click();
  const settings = page.getByRole("complementary", { name: "Dashboard Builder" });

  for (const { label, type } of [
    { label: "単一選択（ボタン）", type: "RADIO PARAMETER" },
    { label: "単一選択（リスト）", type: "SELECT PARAMETER" },
    { label: "複数選択", type: "CHECKBOX PARAMETER" },
    { label: "日付範囲", type: "DATE RANGE PARAMETER" },
    { label: "数値スライダー", type: "SLIDER PARAMETER" },
  ]) {
    await settings.getByRole("button", { name: "項目を追加", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "入力項目を追加" });
    await dialog.getByRole("button", { name: `${label}を追加`, exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const fieldset = settings
      .locator("fieldset")
      .filter({ has: page.getByText(type, { exact: true }) })
      .last();
    await fieldset.getByLabel("表示名", { exact: true }).fill(`${label}の項目`);
    await expect(fieldset.getByLabel("表示名", { exact: true })).toHaveValue(`${label}の項目`);
    if (type === "SLIDER PARAMETER") {
      await fieldset.getByRole("button", { name: "値を追加" }).click();
      await expect(fieldset.getByRole("spinbutton", { name: "デフォルト値2" })).toBeVisible();
    } else if (type !== "DATE RANGE PARAMETER") {
      await fieldset.getByRole("button", { name: "選択肢を追加" }).click();
      await fieldset.getByLabel("選択肢2のラベル").fill("追加した候補");
      await expect(fieldset.getByLabel("選択肢2のラベル")).toHaveValue("追加した候補");
    }
  }
  await settings.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(settings.getByRole("alert")).toHaveCount(0);
});

test("shared dialogs close on Escape, restore focus, and prevent dismissal while saving", async ({
  page,
}) => {
  let releaseSave!: () => void;
  let creates = 0;
  const pendingSave = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route("**/api/dashboards/sales-overview/python-logics", async (route) => {
    creates++;
    await pendingSave;
    const logic = route.request().postDataJSON();
    await route.fulfill({
      json: {
        dashboard: {
          ...source,
          analysis: {
            ...source.analysis,
            logic: [...source.analysis.logic, { id: logic.id, type: "python", path: logic.path }],
          },
        },
      },
    });
  });
  await page.route("**/api/dashboards/sales-overview/sources/python**", (route) => {
    const path = new URL(route.request().url()).searchParams.get("path");
    return path === "logic/sales-overview/logic-1.py"
      ? route.fulfill({
          json: {
            source:
              "from dashlet import plot\n\ndef execute(inputs, params):\n    return plot.metric(0)\n",
          },
        })
      : route.continue();
  });

  try {
    await page.goto("http://127.0.0.1:3030/#/d/sales-overview/summary");
    await page.getByRole("button", { name: "サマリーにコンテンツを追加" }).click();
    const contentDialog = page.getByRole("dialog", { name: "コンテンツを追加" });
    await expect(contentDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(contentDialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: "サマリーにコンテンツを追加" })).toBeFocused();

    await page.getByRole("button", { name: "パラメータを編集" }).click();
    const addParameter = page.getByRole("button", { name: "項目を追加", exact: true });
    await addParameter.click();
    const parameterDialog = page.getByRole("dialog", { name: "入力項目を追加" });
    await expect(parameterDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(parameterDialog).not.toBeVisible();
    await expect(addParameter).toBeFocused();
    await page.getByRole("button", { name: "Builderを閉じる" }).click();

    await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
    await page.getByRole("button", { name: "ロジックを追加", exact: true }).click();
    const logicDialog = page.getByRole("dialog", { name: "ロジックを追加" });
    await logicDialog.getByLabel("Logic ID").fill("invalid id");
    await logicDialog.getByRole("button", { name: "作成", exact: true }).click();
    await expect(logicDialog.getByRole("alert")).toBeVisible();
    expect(creates).toBe(0);
    await logicDialog.getByLabel("Logic ID").fill("logic-1");
    await logicDialog.getByRole("button", { name: "作成", exact: true }).click();
    await expect.poll(() => creates).toBe(1);
    await expect(logicDialog.getByRole("button", { name: "保存中…" })).toBeDisabled();
    await expect(logicDialog.getByRole("button", { name: "ロジック追加を閉じる" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(logicDialog).toBeVisible();
    releaseSave();
    await expect(logicDialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/logic-1$/);
  } finally {
    releaseSave();
  }
});
