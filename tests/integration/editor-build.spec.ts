import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { expect, test } from "@playwright/test";
import { build } from "vite";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";
import { analysisAssets } from "@dashivo/shared-vite/viewer/plugins/analysis-assets";
import { createEmptyDashboard } from "@dashivo/shared-schema/dashboard";

test("viewer embeds the selected definition without a fixed dashboard JSON import", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dashivo-viewer-definition-"));
  try {
    for (const title of ["First dashboard", "Second dashboard"]) {
      const dashboardPath = path.join(root, "dashboard.json");
      await fs.writeFile(dashboardPath, JSON.stringify(createEmptyDashboard(title)));
      const result = await build({
        configFile: false,
        logLevel: "silent",
        plugins: [analysisAssets(dashboardPath, root)],
        build: {
          write: false,
          minify: false,
          rollupOptions: {
            input: "virtual:dashivo/dashboard",
            preserveEntrySignatures: "strict",
          },
        },
      });
      expect(Array.isArray(result)).toBe(false);
      if ("output" in result) {
        const chunks = result.output.filter((item) => item.type === "chunk");
        expect(chunks.map((chunk) => chunk.code).join("\n")).toContain(title);
        expect(chunks.flatMap((chunk) => Object.keys(chunk.modules))).toEqual([
          "\0virtual:dashivo/dashboard",
        ]);
      }
    }
  } finally {
    await fs.rm(root, { recursive: true });
  }
});

test("online editor bundles the fixed sample, not mutable local dashboard files", async () => {
  const result = await build({
    ...createEditorViteConfiguration(path.resolve(".")),
    configFile: false,
    mode: "editor",
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_COGNITO_USER_POOL_ID": JSON.stringify("ap-northeast-1_Test"),
      "import.meta.env.VITE_COGNITO_CLIENT_ID": JSON.stringify("test-client"),
      "import.meta.env.VITE_COGNITO_LOGIN_URL": JSON.stringify(
        "https://dashivo-test.auth.ap-northeast-1.amazoncognito.com",
      ),
    },
    build: { write: false },
  });

  expect(Array.isArray(result)).toBe(false);
  if ("output" in result) {
    const modules = result.output.flatMap((chunk) =>
      chunk.type === "chunk" ? Object.keys(chunk.modules) : [],
    );
    expect(modules.filter((id) => id.startsWith(`${path.resolve("dashboard")}/`))).toEqual([]);
    expect(modules).toContain(path.resolve("app/client/src/sample/dashboard.json"));
    for (const chunk of result.output) {
      if (chunk.type === "chunk") {
        expect(chunk.code).not.toContain("開発用: 認証済み");
        expect(chunk.code).not.toContain("dashivo.dev.authenticated");
      }
    }
  }
});
