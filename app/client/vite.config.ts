import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createEditorViteConfiguration } from "@dashivo/shared-vite/editor";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(createEditorViteConfiguration(projectRoot));
