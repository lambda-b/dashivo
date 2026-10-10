import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/dashboards/sales-overview", (route) =>
    route.fulfill({ json: { dashboard: source } }),
  );
});

test("creates from an ID alone and displays the saved header title in the dashboard list", async ({
  page,
}) => {
  let dashboard = createEmptyDashboard("Untitled");
  let created = false;
  const item = () => ({ id: "new-report", title: dashboard.title, updatedAt: "2026-10-11" });
  await page.route("**/api/dashboards", async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON()).toEqual({ id: "new-report" });
      created = true;
      return route.fulfill({ status: 201, json: { dashboard: item() } });
    }
    return route.fulfill({ json: { dashboards: created ? [item()] : [] } });
  });
  await page.route("**/api/dashboards/new-report", async (route) => {
    if (route.request().method() === "PUT") {
      dashboard = { ...dashboard, ...route.request().postDataJSON().settings };
    }
    return route.fulfill({ json: { dashboard } });
  });

  await page.goto("http://127.0.0.1:3030/");
  await expect(page.getByPlaceholder("タイトルを入力")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "作成", exact: true })).toBeDisabled();
  await page.getByLabel("ダッシュボードID").fill("new-report");
  await page.getByRole("button", { name: "作成", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Untitled", exact: true })).toBeVisible();
  const list = page.getByRole("navigation", { name: "ダッシュボード一覧" });
  await expect(list.getByRole("button", { name: "Untitled", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル", { exact: true }).fill("営業レポート");
  await page.getByRole("button", { name: "dashboard.jsonを保存" }).click();
  await expect(list.getByRole("button", { name: "営業レポート", exact: true })).toBeVisible();
  await expect(list.getByRole("button", { name: "Untitled", exact: true })).toHaveCount(0);
});

test("dashboard creation errors use common notification without losing the ID", async ({
  page,
}) => {
  await page.route("**/api/dashboards", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 500, json: { error: "Create failed" } })
      : route.continue(),
  );
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await page.getByLabel("ダッシュボードID").fill("created");
  await page.getByRole("button", { name: "作成", exact: true }).click();
  await expect(page.getByText("Create failed", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("ダッシュボードID")).toHaveValue("created");
  await expect(page.getByRole("button", { name: "作成", exact: true })).toBeEnabled();
});

test("download errors use common notification and allow retry", async ({ page }) => {
  await page.route("**/api/dashboards/sales-overview/download", (route) =>
    route.fulfill({ status: 500, json: { error: "Download failed" } }),
  );
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await page.getByRole("button", { name: "HTMLをダウンロード" }).click();
  await expect(page.getByText("Download failed", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toBeEnabled();
});

test("Python save failure preserves edits and successful retry updates saved state", async ({
  page,
}) => {
  const original = "def execute(inputs, params):\n    return None\n";
  let saves = 0;
  await page.route("**/api/dashboards/sales-overview/sources/python**", (route) => {
    if (route.request().method() !== "PUT") return route.fulfill({ json: { source: original } });
    saves++;
    return saves === 1
      ? route.fulfill({ status: 500, json: { error: "Python save failed" } })
      : route.fulfill({ status: 204 });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.fill("# keep unsaved code");
  await page.getByRole("button", { name: "Pythonを保存" }).click();
  await expect(page.getByText("Python save failed", { exact: true })).toHaveCount(1);
  await expect(editor).toContainText("# keep unsaved code");
  await expect(page.getByText("未保存", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close toast" }).click();
  await page.getByRole("button", { name: "Pythonを保存" }).click();
  await expect(page.getByText("未保存", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pythonを保存" })).toBeDisabled();
  expect(saves).toBe(2);
});

test("clipboard rejection is notified without retaining component error state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Permission denied")) },
      configurable: true,
    });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  await page.getByRole("tab", { name: "入力値参照" }).click();
  const copy = page.getByRole("button", { name: 'inputs["sales"] をコピー', exact: true });
  await copy.click();
  await expect(
    page.getByText("クリップボードへコピーできませんでした。参照式を選択してコピーしてください。", {
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(copy).toBeEnabled();
});

test("Python preview renders output and keeps execution errors in the preview panel", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.fill(`from dashivo import plot

def execute(inputs, params):
    fig = plot.metric(42)
    fig.title("Preview result")
    return fig
`);
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(
    page.getByRole("article").getByText("Preview result", { exact: true }),
  ).toBeVisible();

  await editor.fill(`def execute(inputs, params):
    raise ValueError("Preview execution failed")
`);
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Preview execution failed");
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await expect(editor).toContainText("Preview execution failed");
});
