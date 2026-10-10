import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { dashboardIdSchema } from "@dashivo/shared-schema/dashboard";
import {
  downloadUrlLifetimeSeconds,
  type DashboardDownloadStorage,
} from "@dashivo/server/models/dashboard-html-builder";

export const createFilesystemDashboardDownloadStorage = (root: string) => {
  const save: DashboardDownloadStorage = async (dashboardId, html) => {
    const id = dashboardIdSchema.parse(dashboardId);
    const token = randomUUID();
    const directory = path.join(root, token);
    await fs.mkdir(directory, { recursive: true });

    for (const entry of await fs.readdir(root)) {
      if (!z.uuid().safeParse(entry).success) continue;
      const previous = path.join(root, entry);
      if (Date.now() - (await fs.stat(previous)).mtimeMs > 86_400_000) {
        await fs.rm(previous, { recursive: true, force: true });
      }
    }

    await fs.writeFile(path.join(directory, `${id}.html`), new Uint8Array(html));

    return `/api/downloads/${token}/${id}`;
  };

  const read = async (token: string, dashboardId: string) => {
    if (!z.uuid().safeParse(token).success || !dashboardIdSchema.safeParse(dashboardId).success) {
      throw new HTTPException(404, { message: "Download not found" });
    }

    const file = path.join(root, token, `${dashboardId}.html`);
    try {
      const stat = await fs.stat(file);
      if (Date.now() - stat.mtimeMs > downloadUrlLifetimeSeconds * 1000) {
        throw new HTTPException(410, { message: "ダウンロードURLの有効期限が切れました。" });
      }

      return Uint8Array.from(await fs.readFile(file)).buffer;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new HTTPException(404, { message: "Download not found" });
      }
      throw error;
    }
  };

  return { save, read };
};
