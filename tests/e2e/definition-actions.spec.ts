import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

test("updates and removes definitions through shared save handling", async ({ page }) => {
  let dashboard = structuredClone(source);
  dashboard.tabs = dashboard.tabs.map((tab) => ({
    ...tab,
    contents: tab.contents.map((content) => ({ ...content, logic: "sales-table" })),
  }));
  let saves = 0;

  await page.route("**/api/dashboards/sales-overview", async (route) => {
    if (route.request().method() === "PUT") {
      dashboard = { ...dashboard, ...route.request().postDataJSON() };
      saves++;
    }
    await route.fulfill({ json: { dashboard } });
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");

  await page.getByLabel("Input ID").fill("renamed-input");
  await page.getByLabel("Input ID").press("Tab");
  await expect.poll(() => saves).toBe(1);
  await expect(page.getByLabel("Input ID")).toHaveValue("renamed-input");
  expect(dashboard.analysis.inputs[0]!.path).toBe(source.analysis.inputs[0]!.path);

  await page.getByRole("button", { name: "renamed-inputを削除", exact: true }).click();
  await expect(page.getByLabel("Input ID")).toHaveCount(0);
  expect(dashboard.analysis.inputs).toEqual([]);

  await page.getByRole("button", { name: "選択中の定義を削除" }).click();
  await expect.poll(() => saves).toBe(3);
  expect(dashboard.analysis.logic.some((logic) => logic.id === "sales-analysis")).toBe(false);
  expect(dashboard.analysis.inputs).toEqual([]);
  expect(dashboard.tabs).toHaveLength(source.tabs.length);
});
