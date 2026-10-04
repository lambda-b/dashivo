import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

test("displays fixed CSV registration and allows deletion and re-registration", async ({
  page,
}) => {
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
  await page.route("**/api/dashboards/sales-overview/sources/csv**", (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({ status: 201, json: { path: "data/sales-overview/replacement.csv" } });
    return route.continue();
  });
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");

  const csvList = page.getByRole("list", { name: "入力CSV一覧" });
  const card = csvList.getByRole("listitem").first();
  const csvId = card.getByText(source.analysis.inputs[0]!.id, { exact: true });
  const removeCsv = page.getByRole("button", {
    name: `${source.analysis.inputs[0]!.id}を削除`,
    exact: true,
  });
  await expect(csvId).toBeVisible();
  await expect(card.getByText(source.analysis.inputs[0]!.path, { exact: true })).toBeVisible();
  await expect(csvList.getByRole("textbox")).toHaveCount(0);
  await expect(csvList.getByRole("combobox")).toHaveCount(0);
  expect(saves).toBe(0);
  await expect(removeCsv).toBeVisible();
  const { idBox, removeBox, pathBox, cardContent } = await card.evaluate((card) => {
    // 開くアニメーション中でも比較位置がずれないよう、同時に計測する。
    const box = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const bounds = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    return {
      idBox: box(card.querySelector("strong")!),
      removeBox: box(card.querySelector("button")!),
      pathBox: box(card.querySelector("p")!),
      cardContent: {
        left: bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
        right: bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
      },
    };
  });

  expect(removeBox.width).toBe(removeBox.height);
  expect(removeBox.x).toBeGreaterThanOrEqual(idBox.x + idBox.width);
  expect(pathBox.y).toBeGreaterThanOrEqual(removeBox.y + removeBox.height);
  expect(idBox.x).toBeGreaterThanOrEqual(cardContent.left - 0.01);
  expect(removeBox.x + removeBox.width).toBeLessThanOrEqual(cardContent.right + 0.01);
  expect(pathBox.x).toBeGreaterThanOrEqual(cardContent.left - 0.01);
  expect(pathBox.x + pathBox.width).toBeLessThanOrEqual(cardContent.right + 0.01);

  await removeCsv.click();
  await expect(csvList.getByRole("listitem")).toHaveCount(0);
  expect(dashboard.analysis.inputs).toEqual([]);
  expect(saves).toBe(1);

  await page.getByLabel("アップロードするCSVファイル").setInputFiles({
    name: "replacement.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("value\n1\n"),
  });
  await expect(csvList.getByRole("listitem")).toHaveCount(1);
  await expect(csvList.getByText("input-1", { exact: true })).toBeVisible();
  await expect(
    csvList.getByText("data/sales-overview/replacement.csv", { exact: true }),
  ).toBeVisible();
  expect(saves).toBe(2);

  await page.getByRole("button", { name: "選択中の定義を削除" }).click();
  await expect.poll(() => saves).toBe(3);
  expect(dashboard.analysis.logic.some((logic) => logic.id === "sales-analysis")).toBe(false);
  expect(dashboard.analysis.inputs).toHaveLength(1);
  expect(dashboard.tabs).toHaveLength(source.tabs.length);
});
