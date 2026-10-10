import { expect, test } from "@playwright/test";
import { createServerApp } from "@dashivo/server/app";
import {
  dashboardItemEndpoint,
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
    repository: {
      registerDashboardAtomically: async (id, createdDashboard) => ({
        id,
        title: createdDashboard.title,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      listDashboards: async () => [
        { id: "sales-overview", title: dashboard.title, updatedAt: "2026-01-01T00:00:00.000Z" },
      ],
      createDashboard: async (_preferredId, createdDashboard) => ({
        id: "new-dashboard",
        title: createdDashboard.title,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      listAssets: async () => ({
        csv: ["data/sales-overview/raw/sales.csv"],
        python: ["logic/analysis.py"],
      }),
      readDashboard: async () => ({ dashboard, version: "v1" }),
      writeDashboard: async () => {},
      readInput: async (_id, path) => `input:${path}`,
      createInput: async (id, fileName) => `data/${id}/${fileName}`,
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

test("Hono API serves inputs and downloadable viewer through injected services", async () => {
  const app = createTestApp();
  const input = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?path=data%2Fsales-overview%2Fraw%2Fsales.csv`,
  );

  expect(input.status).toBe(200);
  expect(await input.json()).toEqual({ source: "input:data/sales-overview/raw/sales.csv" });

  const unrelatedInput = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?path=data%2Fanother-dashboard%2Fprivate.csv`,
  );

  expect(unrelatedInput.status).toBe(403);

  const uploaded = await app.request(
    `${dashboardInputSourceEndpoint("sales-overview")}?fileName=orders.csv`,
    {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: "date,total\n2026-01-01,100\n",
    },
  );

  expect(uploaded.status).toBe(201);
  expect(await uploaded.json()).toEqual({ path: "data/sales-overview/orders.csv" });

  const download = await app.request(dashboardDownloadEndpoint("sales-overview"), {
    method: "POST",
  });

  expect(download.status).toBe(200);
  expect(download.headers.get("Content-Disposition")).toBe('attachment; filename="dashboard.html"');
  expect(await download.text()).toBe("<html>viewer</html>");
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
