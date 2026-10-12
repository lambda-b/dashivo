import { expect, test } from "@playwright/test";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";
import sample from "@/sample/dashboard.json" with { type: "json" };

const origin = "http://127.0.0.1:3030";

test("development checkbox switches storage and keeps same-ID caches and drafts separate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const serverDashboard = createEmptyDashboard("Server dashboard");
  const id = "trial";
  const writes: string[] = [];
  await page.route(`${origin}/api/dashboards**`, (route) => {
    if (route.request().method() !== "GET") writes.push(route.request().method());
    return route.fulfill({
      json:
        new URL(route.request().url()).pathname === "/api/dashboards"
          ? { dashboards: [{ id, title: serverDashboard.title, updatedAt: "2026-10-08" }] }
          : { dashboard: serverDashboard },
    });
  });
  await page.goto(origin);
  const authentication = page.getByRole("checkbox", { name: "開発用: 認証済み" });
  await expect(authentication).toBeChecked();
  await expect(page.getByRole("heading", { name: "Server dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toBeVisible();
  await authentication.uncheck();
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ダッシュボード一覧を開く" })).toHaveCount(0);
  await expect(page.getByLabel("ダッシュボードID")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: sample.dashboard.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await page.getByLabel("タイトル").fill("Unsaved browser draft");
  await page.getByRole("button", { name: "Builderを閉じる" }).click();

  await authentication.check();
  await expect(page.getByRole("heading", { name: "Server dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "ダッシュボード一覧" })).toBeVisible();
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toBeEnabled();
  await page.getByRole("button", { name: "ヘッダーを編集" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("Server dashboard");
  await page.getByRole("button", { name: "Builderを閉じる" }).click();
  await authentication.uncheck();
  await expect(
    page.getByRole("heading", { name: sample.dashboard.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "HTMLをダウンロード" })).toHaveCount(0);
  await page.reload();
  await expect(authentication).not.toBeChecked();
  await expect(
    page.getByRole("heading", { name: sample.dashboard.title, exact: true }),
  ).toBeVisible();
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("trial revisions change only on content changes and updates remain atomic", async ({
  page,
}) => {
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const modulePath = "/src/storage/browser.ts";
    const { browserStorage, loadTrial } = await import(modulePath);
    const [first] = await browserStorage.loadDashboards();
    const sampleRevision = (await loadTrial()).revisionId;
    const { analysis: _, ...settings } = await browserStorage.loadDashboard(first.id);
    await browserStorage.saveDashboard(first.id, { settings });
    const unchangedSettingsRevision = (await loadTrial()).revisionId;
    await browserStorage.saveDashboard(first.id, {
      settings: { ...settings, title: "Edited trial" },
    });
    const settingsRevision = (await loadTrial()).revisionId;
    const creationBlocked = await browserStorage.createDashboard({ id: "second" }).then(
      () => false,
      () => true,
    );
    await browserStorage.createPythonLogic(first.id, {
      id: "total",
      path: "logic/total.py",
      source: "# original",
    });
    const changedRevision = (await loadTrial()).revisionId;

    const duplicate = await browserStorage
      .createPythonLogic(first.id, {
        id: "total",
        path: "logic/duplicate.py",
        source: "# should not be written",
      })
      .then(
        () => false,
        () => true,
      );
    const rejectedRevision = (await loadTrial()).revisionId;
    await Promise.all([
      browserStorage.savePythonSource(first.id, "logic/total.py", "# updated"),
      browserStorage.createPythonLogic(first.id, {
        id: "other",
        path: "logic/other.py",
        source: "# other",
      }),
    ]);
    const latestRevision = (await loadTrial()).revisionId;
    await browserStorage.savePythonSource(first.id, "logic/total.py", "# updated");
    const unchangedRevision = (await loadTrial()).revisionId;
    const file = new File(["value\n1\n"], "same.csv", { type: "text/csv" });
    const firstPath = await browserStorage.uploadInputSource(first.id, file);
    const csvRevision = (await loadTrial()).revisionId;
    const crossRead = await browserStorage.loadInputSource("missing", firstPath).then(
      () => false,
      () => true,
    );
    const download = await browserStorage.downloadDashboardFile(first.id).then(
      () => false,
      (error: Error) => error.message,
    );

    return {
      duplicate,
      creationBlocked,
      sampleRevision,
      unchangedSettingsRevision,
      settingsRevision,
      csvRevision,
      changedRevision,
      rejectedRevision,
      latestRevision,
      unchangedRevision,
      firstPaths: await browserStorage.loadAssetCatalog(first.id),
      firstPath,
      crossRead,
      download,
      source: await browserStorage.loadPythonSource(first.id, "logic/total.py"),
      dashboard: await browserStorage.loadDashboard(first.id, {
        signal: new AbortController().signal,
      }),
    };
  });

  expect(result.duplicate).toBe(true);
  expect(result.creationBlocked).toBe(true);
  expect(result.sampleRevision).toBe(sample.revisionId);
  expect(result.unchangedSettingsRevision).toBe(result.sampleRevision);
  expect(result.settingsRevision).not.toBe(result.sampleRevision);
  expect(result.changedRevision).not.toBe(result.settingsRevision);
  expect(result.rejectedRevision).toBe(result.changedRevision);
  expect(result.latestRevision).not.toBe(result.changedRevision);
  expect(result.unchangedRevision).toBe(result.latestRevision);
  expect(result.csvRevision).not.toBe(result.latestRevision);
  expect(result.firstPaths.python).toContain("logic/other.py");
  expect(result.firstPaths.python).toContain("logic/total.py");
  expect(result.firstPaths.python).not.toContain("logic/duplicate.py");
  expect(result.crossRead).toBe(true);
  expect(result.firstPath).toBe("data/same.csv");
  expect(result.source).toBe("# updated");
  expect(result.dashboard.analysis.logic.map((logic: { id: string }) => logic.id)).toEqual([
    ...sample.dashboard.analysis.logic.map((logic) => logic.id),
    "total",
    "other",
  ]);
  expect(result.download).toBe("HTMLのダウンロードにはログインが必要です。");
});

test("trial registration skips the sample, retries failures and tracks each owner and revision", async ({
  page,
}) => {
  const revisions: string[] = [];
  await page.route(`${origin}/api/dashboards/registrations`, (route) => {
    const { revisionId, dashboard } = route.request().postDataJSON();
    revisions.push(revisionId);
    return revisions.length === 1
      ? route.fulfill({ status: 500, json: { error: "Temporary failure" } })
      : route.fulfill({
          json: {
            dashboard: {
              id: `draft-${revisionId}`,
              title: dashboard.title,
              updatedAt: "2026-10-10",
            },
          },
        });
  });
  await page.goto(origin);
  const result = await page.evaluate(async () => {
    const modulePath = "/src/storage/browser.ts";
    const { browserStorage, loadTrial, registerTrial } = await import(modulePath);
    const [trial] = await browserStorage.loadDashboards();
    const skippedSample = await registerTrial("user:a");
    await browserStorage.savePythonSource(trial.id, "logic/analysis.py", "# edited");
    const beforeFailure = await loadTrial();
    const failed = await registerTrial("user:a").then(
      () => false,
      () => true,
    );
    const afterFailure = await loadTrial();
    const registered = await registerTrial("user:a");
    const skippedRepeat = await registerTrial("user:a");
    const otherOwner = await registerTrial("user:b");
    const afterRegistration = await loadTrial();
    await browserStorage.savePythonSource(trial.id, "logic/analysis.py", "# edited again");
    const anotherRevision = await registerTrial("user:a");
    return {
      skippedSample,
      failed,
      beforeFailure,
      afterFailure,
      registered,
      skippedRepeat,
      otherOwner,
      afterRegistration,
      anotherRevision,
    };
  });

  expect(result.skippedSample).toBeUndefined();
  expect(result.failed).toBe(true);
  expect(result.afterFailure.registrations).toEqual({});
  expect(result.afterFailure.revisionId).toBe(result.beforeFailure.revisionId);
  expect(result.afterRegistration.revisionId).toBe(result.beforeFailure.revisionId);
  expect(result.skippedRepeat).toBeUndefined();
  expect(result.otherOwner.id).toBe(result.registered.id);
  expect(Object.keys(result.afterRegistration.registrations)).toHaveLength(2);
  expect(result.anotherRevision.id).not.toBe(result.registered.id);
  expect(revisions).toHaveLength(4);
  expect(new Set(revisions.slice(0, 3)).size).toBe(1);
});
