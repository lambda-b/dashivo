import { expect, test } from "@playwright/test";

test("Workbench completes Python APIs and renders figures without mutating CSV inputs", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3030/#/d/sales-overview/builder/python/sales-analysis");
  const editor = page.locator(".cm-content");
  await editor.fill("import pandas as pd\nimport numpy as np\n\npd.");
  await editor.press("Control+Space");
  await expect(page.getByRole("option").filter({ hasText: "DataFrame" })).toBeVisible();
  await editor.press("Escape");
  await editor.fill("import numpy as np\nnp.");
  await editor.press("Control+Space");
  await expect(page.getByRole("option").filter({ hasText: "where" })).toBeVisible();
  await editor.press("Escape");
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
  await expect(page.getByRole("cell", { name: "4000", exact: true }).first()).toBeVisible();
  await editor.fill(`from dashivo import plot

def execute(inputs, params):
    return plot.metric(inputs["sales"]["revenue"].sum()).title("Unchanged inputs")
`);
  await page.getByRole("tab", { name: "出力プレビュー" }).click();
  await page.getByRole("button", { name: "実行", exact: true }).click();
  await expect(page.getByRole("article").getByText("754,000", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await editor.fill(`from dashivo import plot

def execute(inputs, params):
    return plot.metric({"Revenue card": 100, "Orders card": 5}, columns=2).title("Preview cards")
`);
  await page.getByRole("button", { name: "実行", exact: true }).click();
  const cards = page
    .getByRole("region", { name: "Preview cards", exact: true })
    .getByRole("article");
  await expect(cards).toHaveCount(2);
  const [first, second] = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y } = element.getBoundingClientRect();
      return { x, y };
    }),
  );
  expect(first.y).toBe(second.y);
  expect(first.x).toBeLessThan(second.x);
});
