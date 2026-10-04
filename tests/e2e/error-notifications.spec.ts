import { expect, test } from "@playwright/test";
import source from "#dashboard/dashboard.json" with { type: "json" };

for (const failure of ["upload", "network", "definition"] as const) {
  test(`notifies CSV ${failure} failure once and allows selecting the same file again`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let uploads = 0;
    let saves = 0;

    await page.route("**/api/dashboards/sales-overview", (route) => {
      if (route.request().method() === "PUT") {
        saves++;
        return route.fulfill({ status: 500, json: { error: "Definition failed" } });
      }
      return route.fulfill({ json: { dashboard: source } });
    });
    await page.route("**/api/dashboards/sales-overview/assets", (route) =>
      route.fulfill({
        json: { csv: [source.analysis.inputs[0]!.path], python: [source.analysis.logic[0]!.path] },
      }),
    );
    await page.route("**/api/dashboards/sales-overview/sources/csv**", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      uploads++;
      if (failure === "network") return route.abort("failed");
      return failure === "upload"
        ? route.fulfill({ status: 400, json: { error: "Upload failed" } })
        : route.fulfill({ status: 201, json: { path: "data/sales-overview/new.csv" } });
    });

    await page.goto("http://127.0.0.1:3030/#/d/sales-overview");
    await page.getByRole("button", { name: "Pythonロジックを管理" }).click();
    const input = page.getByLabel("アップロードするCSVファイル");
    const file = { name: "new.csv", mimeType: "text/csv", buffer: Buffer.from("value\n1\n") };
    await input.setInputFiles(file);

    const message =
      failure === "upload"
        ? "Upload failed"
        : failure === "network"
          ? "サーバーに接続できませんでした。接続状態を確認してください。"
          : "CSVのアップロードは完了しましたが、設定を保存できませんでした。CSVをもう一度アップロードして登録してください。";
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "CSVをアップロード" })).toBeEnabled();
    await expect(page.getByRole("list", { name: "入力CSV一覧" }).getByRole("listitem")).toHaveCount(
      source.analysis.inputs.length,
    );
    expect(uploads).toBe(1);
    expect(saves).toBe(failure === "definition" ? 1 : 0);
    expect(errors).toEqual([]);

    await page.getByRole("button", { name: "Close toast" }).click();
    await input.setInputFiles(file);
    await expect(page.getByText(message, { exact: true })).toHaveCount(1);
    expect(uploads).toBe(2);
    expect(errors).toEqual([]);
  });
}
