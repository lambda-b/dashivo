import { expect, test } from "@playwright/test";
import { createServerApp } from "@dashlet/server/app";
import { dashboardEndpoint, downloadEndpoint, inputSourceEndpoint } from "@dashlet/shared/api";
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
      readDashboard: async () => dashboard,
      readInput: async (path) => `input:${path}`,
      readPython: async (path) => `python:${path}`,
      updateDashboard: async (change) =>
        "settings" in change ? { ...change.settings, analysis: dashboard.analysis } : dashboard,
      writePython: async () => {},
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
