import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/dashboards/sales-overview", (route) =>
    route.fulfill({ json: { dashboard: source } }),
  );
});

test("dashboard creation errors use common notification without losing the title", async ({
  page,
}) => {
  await page.route("**/api/dashboards", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 500, json: { error: "Create failed" } })
      : route.continue(),
  );
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await page.getByLabel("新しいダッシュボード").fill("Keep this title");
  await page.getByRole("button", { name: "作成", exact: true }).click();
  await expect(page.getByText("Create failed", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("新しいダッシュボード")).toHaveValue("Keep this title");
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
  await editor.fill(`from dashlet import plot

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
