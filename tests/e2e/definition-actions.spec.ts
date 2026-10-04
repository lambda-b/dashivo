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

  const csvId = page.getByLabel("Input ID");
  const removeCsv = page.getByRole("button", {
    name: `${source.analysis.inputs[0]!.id}を削除`,
    exact: true,
  });
  await expect(csvId).toBeVisible();
  await expect(removeCsv).toBeVisible();
  const { idBox, removeBox, pathBox, cardContent } = await csvId.evaluate((input) => {
    // 開くアニメーション中でも比較位置がずれないよう、同時に計測する。
    const box = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const card = input.parentElement!.parentElement!;
    const bounds = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    return {
      idBox: box(input),
      removeBox: box(card.querySelector("button")!),
      pathBox: box(card.querySelector("select")!),
      cardContent: {
        left: bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
        right: bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
      },
    };
  });

  expect(removeBox.width).toBe(removeBox.height);
  expect(removeBox.x).toBeGreaterThanOrEqual(idBox.x + idBox.width);
  expect(removeBox.y + removeBox.height / 2).toBeCloseTo(idBox.y + idBox.height / 2);
  expect(pathBox.y).toBeGreaterThanOrEqual(removeBox.y + removeBox.height);
  expect(idBox.x).toBeGreaterThanOrEqual(cardContent.left - 0.01);
  expect(removeBox.x + removeBox.width).toBeLessThanOrEqual(cardContent.right + 0.01);
  expect(pathBox.x).toBeGreaterThanOrEqual(cardContent.left - 0.01);
  expect(pathBox.x + pathBox.width).toBeLessThanOrEqual(cardContent.right + 0.01);

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
