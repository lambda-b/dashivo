import path from "node:path";
import { expect, test } from "@playwright/test";
import { build } from "vite";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";

test("online editor bundles no local dashboard, CSV or Python logic", async () => {
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
    for (const chunk of result.output) {
      if (chunk.type === "chunk") {
        expect(chunk.code).not.toContain("Sale-pulse");
        expect(chunk.code).not.toContain("sales-analysis");
      }
    }
  }
});
