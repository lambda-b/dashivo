/// <reference lib="webworker" />

import createPyodideModule from "pyodide/pyodide.asm.mjs";
import { loadPyodide } from "pyodide";
import lockFileContents from "pyodide/pyodide-lock.json";
import { assets } from "virtual:dashlet-assets";
import analysisSource from "../dashboard/analysis.py?raw";
import csvSource from "../dashboard/data.csv?raw";

interface ExecuteRequest {
  id: number;
  params: Record<string, unknown>;
}

interface ExecuteResponse {
  id: number;
  result?: unknown;
  error?: string;
}

const assetBaseUrl = "https://dashlet.invalid/pyodide/";
const nativeFetch = globalThis.fetch.bind(globalThis);

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith(assetBaseUrl)) {
    const name = decodeURIComponent(url.slice(assetBaseUrl.length));
    const encoded = assets[name];
    if (!encoded) return new Response("Embedded asset not found", { status: 404 });
    return new Response(decodeBase64(encoded), {
      headers: {
        "Content-Type": name.endsWith(".wasm") ? "application/wasm" : "application/octet-stream",
      },
    });
  }
  return nativeFetch(input, init);
};

const pyodidePromise = loadPyodide({
  createPyodideModule: createPyodideModule as never,
  indexURL: assetBaseUrl,
  packageBaseUrl: assetBaseUrl,
  lockFileContents: JSON.stringify(lockFileContents),
});
self.postMessage({ type: "progress", stage: "worker-started" });

async function execute(event: MessageEvent<ExecuteRequest>) {
  const { id, params } = event.data;
  const response: ExecuteResponse = { id };

  try {
    const pyodide = await pyodidePromise;
    self.postMessage({ type: "progress", stage: "pyodide-ready" });
    await pyodide.loadPackage(["numpy", "pandas"]);
    self.postMessage({ type: "progress", stage: "packages-ready" });
    pyodide.globals.set("__dashlet_analysis", analysisSource);
    pyodide.globals.set("__dashlet_params", JSON.stringify({ ...params, csv: csvSource }));
    const json = await pyodide.runPythonAsync(`
import json
_dashlet_scope = {}
exec(__dashlet_analysis, _dashlet_scope)
json.dumps(_dashlet_scope["execute"](json.loads(__dashlet_params)))
`);
    response.result = JSON.parse(json);
  } catch (error) {
    response.error = error instanceof Error ? error.message : String(error);
  }

  self.postMessage(response);
}

let executionQueue = Promise.resolve();
self.onmessage = (event: MessageEvent<ExecuteRequest>) => {
  executionQueue = executionQueue.then(() => execute(event));
};
