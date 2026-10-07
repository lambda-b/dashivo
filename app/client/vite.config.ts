import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { z } from "zod";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    if (mode !== "editor") throw new Error("Use pnpm build:editor to build the online editor.");

    z.object({
      VITE_COGNITO_USER_POOL_ID: z.string().regex(/^[\w-]+_[\w]+$/),
      VITE_COGNITO_CLIENT_ID: z.string().min(1),
      VITE_COGNITO_LOGIN_URL: z.url().refine((value) => new URL(value).protocol === "https:"),
    }).parse(loadEnv(mode, path.join(projectRoot, "app/client"), "VITE_"));
  }

  return createEditorViteConfiguration(projectRoot);
});
