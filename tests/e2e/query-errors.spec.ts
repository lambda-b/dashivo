import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

const list = {
  dashboards: [{ id: "sales-overview", title: source.title, updatedAt: "2026-10-04" }],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/dashboards", (route) => route.fulfill({ json: list }));
  await page.route("**/api/dashboards/sales-overview", (route) =>
    route.fulfill({ json: { dashboard: source } }),
  );
});

test("dashboard initial failure shows one inline error and retries without hiding the sidebar", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/dashboards/sales-overview", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 404, json: { error: "Dashboard unavailable" } })
      : route.fulfill({ json: { dashboard: source } });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await expect(page.getByRole("alert")).toHaveText("Dashboard unavailable");
  expect(requests).toBe(1);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await expect(page.getByLabel("ダッシュボードID")).toBeVisible();
  await page.getByRole("button", { name: "再試行" }).click();
  await expect(page.getByRole("heading", { name: source.title, level: 1 })).toBeVisible();
});

test("invalid response shape is safely displayed without exposing schema details or retrying", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/dashboards/sales-overview", (route) => {
    requests++;
    return route.fulfill({ json: {} });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await expect(page.getByRole("alert")).toHaveText("設定を読み込めませんでした。");
  expect(requests).toBe(1);
});

test("list failure is isolated from the dashboard and recovers on retry", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/dashboards", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 400, json: { error: "List unavailable" } })
      : route.fulfill({ json: list });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await expect(page.getByRole("alert")).toHaveText("List unavailable");
  await expect(page.getByRole("heading", { name: source.title, level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "再試行" }).click();
  await expect(
    page.getByRole("navigation").getByRole("button", { name: source.title }),
  ).toBeVisible();
});

test("background list failure keeps data and editing state and only shows a toast", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/dashboards", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ json: list })
      : route.fulfill({ status: 400, json: { error: "List refresh failed" } });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("Keep draft");
  // Suspense queries retain a minimum stale time to avoid immediate remount loops.
  await page.clock.install();
  await page.clock.fastForward(1500);
  await page.getByRole("button", { name: "一覧を閉じる" }).click();
  await page.getByRole("button", { name: "ダッシュボード一覧を開く" }).click();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(1);
  await expect(page.getByText("List refresh failed", { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("navigation").getByRole("button", { name: source.title }),
  ).toBeVisible();
  await expect(page.getByLabel("タイトル")).toHaveValue("Keep draft");
});

test("Python source failure allows retry and does not hide logic management", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/dashboards/sales-overview/sources/python**", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 404, json: { error: "Source unavailable" } })
      : route.fulfill({ json: { source: "def execute(inputs, params):\n    return None\n" } });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  await expect(page.getByRole("alert")).toHaveText("Source unavailable");
  await expect(page.getByRole("button", { name: "ロジックを追加" })).toBeVisible();
  await page.getByRole("button", { name: "再試行" }).click();
  await expect(page.locator(".cm-content")).toContainText("def execute");
});

test("CSV preview failure leaves parameter references available and retries", async ({ page }) => {
  let available = false;
  await page.route("**/api/dashboards/sales-overview/sources/csv**", (route) =>
    available
      ? route.fulfill({ json: { source: "value\n42\n" } })
      : route.fulfill({ status: 400, json: { error: "CSV unavailable" } }),
  );
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  await page.getByRole("tab", { name: "入力値参照" }).click();
  await expect(page.getByRole("alert")).toHaveText("CSV unavailable");
  await expect(page.getByText("利用可能なParameters")).toBeVisible();
  available = true;
  await page.getByRole("button", { name: "再試行" }).click();
  await expect(page.getByRole("cell", { name: "42", exact: true })).toBeVisible();
});
