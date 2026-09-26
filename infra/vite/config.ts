import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createViteConfiguration } from "@dashlet/infra/vite/configuration";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig((env) => createViteConfiguration(projectRoot, env));
