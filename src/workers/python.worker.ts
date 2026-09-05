/// <reference lib="webworker" />

import { expose } from "comlink";
import type { PythonWorkerApi } from "@/workers/api";
import sourceData from "#dashboard/data/raw/sales.csv?raw";
import analysisSource from "#dashboard/logic/analysis.py?raw";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

const pyodidePromise = initializePyodide().then(async (pyodide) => {
  await pyodide.loadPackage(["numpy", "pandas"]);
  return pyodide;
});

const api: PythonWorkerApi = {
  execute: async (params) => {
    const pyodide = await pyodidePromise;
    pyodide.globals.set("__dashlet_analysis", analysisSource);
    pyodide.globals.set("__dashlet_params", JSON.stringify({ ...params, source_data: sourceData }));
    const json = await pyodide.runPythonAsync(`
import json
_dashlet_scope = {}
exec(__dashlet_analysis, _dashlet_scope)
json.dumps(_dashlet_scope["execute"](json.loads(__dashlet_params)))
`);
    return JSON.parse(json);
  },
};

expose(api);
