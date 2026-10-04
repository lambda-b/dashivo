import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

test("keeps settings drafts while using the latest saved analysis definition", async ({ page }) => {
  let dashboard = structuredClone(source);
  await page.route("**/api/dashboards/sales-overview", async (route) => {
    if (route.request().method() === "PUT") {
      const change = route.request().postDataJSON();
      dashboard = { ...dashboard, ...(change.settings ?? change) };
    }
    await route.fulfill({ json: { dashboard } });
  });
  await page.route("**/api/dashboards/sales-overview/sources/csv**", (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({ status: 201, json: { path: "data/sales-overview/extra.csv" } });

    const path = new URL(route.request().url()).searchParams.get("path");
    if (path === "data/sales-overview/extra.csv")
      return route.fulfill({ json: { source: "value\n1\n" } });

    return route.continue();
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/summary");
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("Keep settings draft");
  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
  await page.getByLabel("アップロードするCSVファイル").setInputFiles({
    name: "extra.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("value\n1\n"),
  });
  await expect(page.getByRole("list", { name: "入力CSV一覧" }).getByRole("listitem")).toHaveCount(
    source.analysis.inputs.length + 1,
  );
  await page.getByRole("button", { name: "Dashboardへ戻る" }).click();
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("Keep settings draft");
  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByText("保存しました", { exact: true })).toBeVisible();
  expect(dashboard.title).toBe("Keep settings draft");
  expect(dashboard.analysis.inputs).toHaveLength(source.analysis.inputs.length + 1);
  expect(dashboard.analysis.inputs.at(-1)?.path).toBe("data/sales-overview/extra.csv");
});

test("validates settings before saving or placing content and keeps invalid drafts editable", async ({
  page,
}) => {
  let dashboard = structuredClone(source);
  let saves = 0;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/dashboards/sales-overview", async (route) => {
    if (route.request().method() === "PUT") {
      saves++;
      dashboard = { ...dashboard, ...route.request().postDataJSON().settings };
    }
    await route.fulfill({ json: { dashboard } });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/summary");

  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("");
  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByRole("alert")).toContainText("設定を確認してください。");
  expect(saves).toBe(0);
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("heading", { level: 1, name: source.title })).toBeVisible();
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await page.getByRole("button", { name: "サマリーにコンテンツを追加" }).click();
  const picker = page.getByRole("dialog", { name: "コンテンツを追加" });
  await picker.getByText("sales-orders", { exact: true }).click();
  await picker.getByRole("button", { name: "コンテンツを追加" }).click();
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("alert")).toContainText("設定を確認してください。");
  await picker.getByRole("button", { name: "コンテンツ追加を閉じる" }).click();

  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("");
  await page.getByLabel("タイトル").fill("Updated settings");
  await page.getByRole("button", { name: "プレビューへ反映" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Updated settings", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  for (let index = 0; index < 2; index++) {
    await page.getByRole("button", { name: "サマリーにコンテンツを追加" }).click();
    await picker.getByText("sales-orders", { exact: true }).click();
    await picker.getByRole("button", { name: "コンテンツを追加" }).click();
    await expect(picker).not.toBeVisible();
  }
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(page.getByText("保存しました", { exact: true })).toBeVisible();
  expect(saves).toBe(1);
  const contents = dashboard.tabs[0]!.contents;
  expect(contents).toHaveLength(source.tabs[0]!.contents.length + 2);
  expect(new Set(contents.map((content) => content.id)).size).toBe(contents.length);
  expect(errors).toEqual([]);

  await page.getByLabel("タイトル").fill("Discard this draft");
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("Updated settings");
  await expect(page.getByText("保存しました", { exact: true })).toHaveCount(0);
});
