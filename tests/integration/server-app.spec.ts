import { expect, test } from "@playwright/test";
import { createServerApp } from "@dashlet/server/app";
import {
  dashboardEndpoint,
  downloadEndpoint,
  inputSourceEndpoint,
  pythonLogicEndpoint,
} from "@dashlet/shared/api";
import { dashboardSchema } from "@dashlet/shared/dashboard";
import dashboardSource from "#dashboard/dashboard.json" with { type: "json" };

const dashboard = dashboardSchema.parse(dashboardSource);

const createTestApp = () =>
  createServerApp({
    buildService: {
      build: async () => Uint8Array.from(new TextEncoder().encode("<html>viewer</html>")).buffer,
    },
    repository: {
      listAssets: async () => ({ csv: ["data/raw/sales.csv"], python: ["logic/analysis.py"] }),
      readDashboard: async () => ({ dashboard, version: "v1" }),
      writeDashboard: async () => {},
      readInput: async (path) => `input:${path}`,
      readPython: async (path) => `python:${path}`,
      writePython: async () => {},
      createPython: async () => {},
      deletePython: async () => {},
      registerPythonLogicAtomically: async () => {},
    },
  });

test("Hono API validates shared contracts without exposing persistence", async () => {
  const app = createTestApp();
  const loaded = await app.request(dashboardEndpoint);

  expect(loaded.status).toBe(200);
  expect((await loaded.json()).dashboard).toEqual(dashboard);

  const invalid = await app.request(dashboardEndpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: { title: "missing fields" } }),
  });

  expect(invalid.status).toBe(400);
});

test("Hono API serves inputs and downloadable viewer through injected services", async () => {
  const app = createTestApp();
  const input = await app.request(`${inputSourceEndpoint}?path=data%2Fraw%2Fsales.csv`);

  expect(input.status).toBe(200);
  expect(await input.json()).toEqual({ source: "input:data/raw/sales.csv" });

  const download = await app.request(downloadEndpoint, { method: "POST" });

  expect(download.status).toBe(200);
  expect(download.headers.get("Content-Disposition")).toBe('attachment; filename="dashboard.html"');
  expect(await download.text()).toBe("<html>viewer</html>");
});

test("Hono API creates Python logic through its dedicated service", async () => {
  const app = createTestApp();
  const response = await app.request(pythonLogicEndpoint, {
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
