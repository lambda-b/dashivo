import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

for (const state of ["used", "saving", "available"] as const) {
  test(`explains logic deletion restrictions (${state})`, async ({ page }) => {
    const dashboard = structuredClone(source);
    const logicId = "sales-analysis";
    dashboard.tabs = dashboard.tabs.map((tab) => ({
      ...tab,
      contents: tab.contents.map((content) => ({
        ...content,
        logic: state === "used" ? logicId : "sales-table",
      })),
    }));
    let releaseSave!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });

    await page.route("**/api/dashboards/sales-overview", async (route) => {
      if (route.request().method() === "PUT") await pendingSave;
      await route.fulfill({ json: { dashboard } });
    });
    await page.goto(`http://127.0.0.1:3030/#/d/sales-overview/builder/python/${logicId}`);
    const deletion = page.getByRole("button", { name: "選択中の定義を削除" });

    try {
      if (state === "used") {
        await expect(deletion).toBeDisabled();
        await expect(
          page.getByText(
            "「サマリー」「グラフ」「テーブル」のコンテンツで使用中です。先に配置を削除するか、別のロジックに変更してください。",
            { exact: true },
          ),
        ).toBeVisible();
      } else if (state === "saving") {
        await page.getByLabel("Input ID").fill("renamed-input");
        await page.getByLabel("Input ID").press("Tab");
        await expect(deletion).toBeDisabled();
        await expect(
          page.getByText("設定を保存中のため削除できません。保存完了までお待ちください。", {
            exact: true,
          }),
        ).toBeVisible();
      } else {
        await expect(deletion).toBeEnabled();
      }
    } finally {
      releaseSave();
    }
  });
}
