import { expect, test } from "@playwright/test";
import { createServerApp } from "@dashivo/server/app";
import { DashboardIdConflict } from "@dashivo/server/models/dashboard-id-conflict";
import {
  dashboardItemEndpoint,
  dashboardsEndpoint,
  dashboardDownloadEndpoint,
  dashboardInputSourceEndpoint,
  dashboardPythonLogicEndpoint,
} from "@dashivo/shared-schema/api";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

const dashboard = dashboardSchema.parse(dashboardSource);

const createTestApp = () =>
  createServerApp({
    dashboardHtmlBuilder: async () =>
      Uint8Array.from(new TextEncoder().encode("<html>viewer</html>")).buffer,
    dashboardDownloadStorage: async () => "/api/downloads/test/sales-overview",
    repository: {
      registerDashboardAtomically: async (id, createdDashboard) => ({
        id,
        title: createdDashboard.title,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      listDashboards: async () => [
        { id: "sales-overview", title: dashboard.title, updatedAt: "2026-01-01T00:00:00.000Z" },
      ],
      createDashboard: async (id, createdDashboard) => {
        if (id === "sales-overview") throw new DashboardIdConflict();
        return { id, title: createdDashboard.title, updatedAt: "2026-01-01T00:00:00.000Z" };
      },
      listAssets: async () => ({
        csv: ["data/raw/sales.csv"],
        python: ["logic/analysis.py"],
      }),
      readDashboard: async () => ({ dashboard, version: "v1" }),
      writeDashboard: async () => {},
      readInput: async (_id, path) => `input:${path}`,
      createInput: async (_id, fileName) => `data/${fileName}`,
      readPython: async (_id, path) => `python:${path}`,
      writePython: async () => {},
      createPython: async () => {},
      deletePython: async () => {},
      registerPythonLogicAtomically: async () => {},
    },
  });

test("Hono API validates shared contracts without exposing persistence", async () => {
  const app = createTestApp();
  const loaded = await app.request(dashboardItemEndpoint("sales-overview"));

  expect(loaded.status).toBe(200);
  expect((await loaded.json()).dashboard).toEqual(dashboard);

  const invalid = await app.request(dashboardItemEndpoint("sales-overview"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: { title: "missing fields" } }),
  });

  expect(invalid.status).toBe(400);
});

test("Hono API requires a chosen dashboard ID and reports duplicate IDs as conflicts", async () => {
  const app = createTestApp();
  const create = (body: unknown) =>
    app.request(dashboardsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const created = await create({ id: "my-dashboard" });
  expect(created.status).toBe(201);
  expect((await created.json()).dashboard).toMatchObject({ id: "my-dashboard", title: "Untitled" });
  expect((await create({ title: "Title" })).status).toBe(400);
  expect((await create({ id: "../outside" })).status).toBe(400);
  expect((await create({ id: "sales-overview" })).status).toBe(409);
});

test("Hono API serves inputs and downloadable viewer through injected services", async () => {
  const app = createTestApp();
  const input = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?path=data%2Fraw%2Fsales.csv`,
  );

  expect(input.status).toBe(200);
  expect(await input.json()).toEqual({ source: "input:data/raw/sales.csv" });

  const unrelatedInput = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?path=data%2F..%2Fprivate.csv`,
  );

  expect(unrelatedInput.status).toBe(400);

  const uploaded = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?fileName=orders.csv`,
    {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: "date,total\n2026-01-01,100\n",
    },
  );

  expect(uploaded.status).toBe(201);
  expect(await uploaded.json()).toEqual({ path: "data/orders.csv" });

  const download = await app.request(dashboardDownloadEndpoint("sales-overview"), {
    method: "POST",
  });

  expect(download.status).toBe(200);
  expect(await download.json()).toEqual({ url: "/api/downloads/test/sales-overview" });
  expect(download.headers.get("Cache-Control")).toBe("no-store");
});

test("Hono API creates Python logic through its dedicated service", async () => {
  const app = createTestApp();
  const response = await app.request(dashboardPythonLogicEndpoint("sales-overview"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "new-logic",
      path: "logic/new-logic.py",
      source: "def execute(inputs, params): return 1",
    }),
  });

  expect(response.status).toBe(200);
  expect((await response.json()).dashboard.analysis.logic.at(-1)?.id).toBe("new-logic");
});
