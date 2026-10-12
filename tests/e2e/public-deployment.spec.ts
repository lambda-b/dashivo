import { expect, test } from "@playwright/test";

const origin = process.env.DASHIVO_PUBLIC_URL;

test("public editor executes the sample and rejects unauthenticated API requests", async ({
  page,
  request,
}) => {
  test.skip(!origin, "Set DASHIVO_PUBLIC_URL to run the read-only production smoke test.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(origin!);
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "売上ダッシュボード（サンプル）", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("754,000", { exact: false })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toHaveCount(0);

  const api = new URL("/api/dashboards", origin);
  expect((await request.get(api.href)).status()).toBe(401);
  expect(
    (await request.get(api.href, { headers: { "X-Dashivo-Token": "invalid-token" } })).status(),
  ).toBe(401);
  expect(errors).toEqual([]);
});
