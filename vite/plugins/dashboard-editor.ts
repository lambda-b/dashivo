import fs from "node:fs/promises";
import path from "node:path";
import { json } from "node:stream/consumers";
import type { Plugin } from "vite";
import { z } from "zod";
import { format } from "oxfmt";
import { createPythonSource } from "./dashboard-assets.ts";
import { dashboardSchema, type DashboardSchema } from "../../src/schema/dashboard.ts";

export const dashboardEditorEndpoint = "/__dashlet/dashboard";
let pending: Promise<unknown> = Promise.resolve();

const changeSchema = z.union([
  z
    .object({
      settings: z.object({
        title: dashboardSchema.shape.title,
        description: dashboardSchema.shape.description,
        controls: dashboardSchema.shape.controls,
        tabs: dashboardSchema.shape.tabs,
      }),
    })
    .strict(),
  z.object({ analysis: dashboardSchema.shape.analysis }).strict(),
  z.object({ logic: z.object({ id: z.string(), path: z.string(), source: z.string() }) }).strict(),
]);
export const updateDashboardFile = (projectRoot: string, source: unknown) => {
  const change = changeSchema.parse(source);
  const task = pending.then(async () => {
    const destination = path.join(projectRoot, "dashboard", "dashboard.json");
    const current = dashboardSchema.parse(JSON.parse(await fs.readFile(destination, "utf8")));
    if ("settings" in change)
      return writeDashboardFile(projectRoot, { ...change.settings, analysis: current.analysis });
    if ("analysis" in change)
      return writeDashboardFile(projectRoot, { ...current, analysis: change.analysis });
    if ("logic" in change) {
      const { id, path: sourcePath, source } = change.logic;
      const next = dashboardSchema.parse({
        ...current,
        analysis: {
          ...current.analysis,
          logic: [...current.analysis.logic, { id, path: sourcePath, type: "python" }],
        },
      });
      await createPythonSource(projectRoot, sourcePath, source);
      try {
        return await writeDashboardFile(projectRoot, next);
      } catch (error) {
        await fs.unlink(path.resolve(projectRoot, "dashboard", sourcePath));
        throw error;
      }
    }
    throw new Error("settings, analysis or logic is required");
  });
  pending = task.catch(() => {});
  return task;
};

export const writeDashboardFile = async (
  projectRoot: string,
  source: unknown,
): Promise<DashboardSchema> => {
  const dashboard = dashboardSchema.parse(source);
  const destination = path.join(projectRoot, "dashboard", "dashboard.json");
  const currentSource = await fs
    .readFile(destination, "utf8")
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
  if (currentSource) {
    const current = dashboardSchema.safeParse(JSON.parse(currentSource));
    if (current.success && JSON.stringify(current.data) === JSON.stringify(dashboard)) {
      return dashboard;
    }
  }
  const formatted = await format(destination, JSON.stringify(dashboard));
  await fs.writeFile(destination, formatted.code, "utf8");
  return dashboard;
};

export const dashboardEditor = (projectRoot: string): Plugin => ({
  name: "dashlet-dashboard-editor",
  apply: "serve",
  handleHotUpdate: ({ file }) => (file.includes("/dashboard/") ? [] : undefined),
  configureServer: (server) => {
    server.middlewares.use(dashboardEditorEndpoint, async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      if (request.method !== "POST" && request.method !== "GET") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET, POST");
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const dashboard =
          request.method === "GET"
            ? dashboardSchema.parse(
                JSON.parse(
                  await fs.readFile(path.join(projectRoot, "dashboard/dashboard.json"), "utf8"),
                ),
              )
            : await updateDashboardFile(projectRoot, await json(request));
        response.end(JSON.stringify({ dashboard }));
      } catch (error) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Dashboard could not be saved",
          }),
        );
      }
    });
  },
});
