import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { normalizePath } from "vite";
import { dashboardSchema } from "../../src/schema/dashboard.ts";

export const analysisAssetsModuleId = "virtual:dashlet/analysis-assets";
const resolvedModuleId = `\0${analysisAssetsModuleId}`;

const resolveDashboardAsset = (dashboardRoot: string, assetPath: string) => {
  const resolvedPath = path.resolve(dashboardRoot, assetPath);
  const relativePath = path.relative(dashboardRoot, resolvedPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Dashboard asset must stay within dashboard/: ${assetPath}`);
  }
  return normalizePath(resolvedPath);
};

export const analysisAssets = (projectRoot: string): Plugin => ({
  name: "dashlet-analysis-assets",
  enforce: "pre",
  resolveId: (id) => (id === analysisAssetsModuleId ? resolvedModuleId : undefined),
  async load(id) {
    if (id !== resolvedModuleId) return undefined;

    const dashboardRoot = path.join(projectRoot, "dashboard");
    const dashboardPath = path.join(dashboardRoot, "dashboard.json");
    this.addWatchFile(dashboardPath);
    const dashboard = dashboardSchema.parse(JSON.parse(await fs.readFile(dashboardPath, "utf8")));
    const imports: string[] = [];

    const inputs = new Map(
      dashboard.analysis.inputs.map((input, index) => {
        const assetPath = resolveDashboardAsset(dashboardRoot, input.path);
        this.addWatchFile(assetPath);
        imports.push(`import input${index} from ${JSON.stringify(`${assetPath}?raw`)};`);
        return [input.id, `input${index}`] as const;
      }),
    );
    const definitions = dashboard.analysis.logic.map((definition, index) => {
      const assetPath = resolveDashboardAsset(dashboardRoot, definition.path);
      this.addWatchFile(assetPath);
      imports.push(`import logic${index} from ${JSON.stringify(`${assetPath}?raw`)};`);
      return {
        id: definition.id,
        inputs: dashboard.analysis.inputs.map((input) => ({
          id: input.id,
          source: inputs.get(input.id),
        })),
        path: definition.path,
        source: `logic${index}`,
      };
    });

    return [
      ...imports,
      `export const analysisDefinitions = [${definitions
        .map(
          (definition) =>
            `{ id: ${JSON.stringify(definition.id)}, inputs: [${definition.inputs
              .map((input) => `{ id: ${JSON.stringify(input.id)}, sourceData: ${input.source} }`)
              .join(
                ",",
              )}], path: ${JSON.stringify(definition.path)}, analysisSource: ${definition.source} }`,
        )
        .join(",")}];`,
    ].join("\n");
  },
});
