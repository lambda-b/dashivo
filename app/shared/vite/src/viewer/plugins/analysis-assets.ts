import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { normalizePath } from "vite";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";

const analysisAssetsModuleId = "virtual:dashivo/analysis-assets";
const resolvedModuleId = `\0${analysisAssetsModuleId}`;
const dashboardModuleId = "virtual:dashivo/dashboard";
const resolvedDashboardModuleId = `\0${dashboardModuleId}`;

const resolveDashboardAsset = (dashboardRoot: string, assetPath: string) => {
  const resolvedPath = path.resolve(dashboardRoot, assetPath);
  const relativePath = path.relative(dashboardRoot, resolvedPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Dashboard asset must stay within dashboard/: ${assetPath}`);
  }
  return normalizePath(resolvedPath);
};

export const analysisAssets = (dashboardPath: string, dashboardRoot: string): Plugin => ({
  name: "dashivo-analysis-assets",
  enforce: "pre",
  resolveId: (id) => {
    if (id === analysisAssetsModuleId) return resolvedModuleId;
    if (id === dashboardModuleId) return resolvedDashboardModuleId;
  },
  async load(id) {
    if (id !== resolvedModuleId && id !== resolvedDashboardModuleId) return undefined;

    this.addWatchFile(dashboardPath);
    const dashboard = dashboardSchema.parse(JSON.parse(await fs.readFile(dashboardPath, "utf8")));
    if (id === resolvedDashboardModuleId) {
      return `export const dashboard = ${JSON.stringify(dashboard)};`;
    }

    const imports: string[] = [];

    const inputs = new Map(
      dashboard.analysis.inputs.map((input, index) => {
        const assetPath = resolveDashboardAsset(dashboardRoot, input.path);
        this.addWatchFile(assetPath);
        imports.push(`import input${index} from ${JSON.stringify(`/@fs${assetPath}?raw`)};`);
        return [input.id, `input${index}`] as const;
      }),
    );
    const definitions = dashboard.analysis.logic.map((definition, index) => {
      const assetPath = resolveDashboardAsset(dashboardRoot, definition.path);
      this.addWatchFile(assetPath);
      imports.push(`import logic${index} from ${JSON.stringify(`/@fs${assetPath}?raw`)};`);
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
