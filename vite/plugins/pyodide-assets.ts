import path from "node:path";
import { normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const pyodideCoreAssets = [
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "pyodide-lock.json",
  "python_stdlib.zip",
] as const;

export const pyodideAssets = (projectRoot: string) =>
  viteStaticCopy({
    targets: [
      {
        src: pyodideCoreAssets.map((name) =>
          normalizePath(path.join(projectRoot, "node_modules", "pyodide", name)),
        ),
        dest: "pyodide",
        rename: { stripBase: true },
      },
      {
        src: normalizePath(path.join(projectRoot, ".pyodide-cache", "*.whl")),
        dest: "pyodide",
        rename: { stripBase: true },
      },
    ],
  });
