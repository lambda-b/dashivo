/// <reference lib="webworker" />

import { expose } from "comlink";
import type { PythonWorkerApi } from "@/workers/api";
import sourceData from "#dashboard/data/raw/sales.csv?raw";
import analysisSource from "#dashboard/logic/analysis.py?raw";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

const pythonRuntimePromise = initializePyodide().then(async (pyodide) => {
  await pyodide.loadPackagesFromImports(analysisSource);
  pyodide.FS.writeFile("/home/pyodide/analysis.py", analysisSource);
  return { pyodide, analysis: pyodide.pyimport("analysis") };
});

const api: PythonWorkerApi = {
  execute: async (params) => {
    const { pyodide, analysis } = await pythonRuntimePromise;
    const pythonParams = pyodide.toPy({ ...params, source_data: sourceData });

    try {
      const pythonResult = analysis.execute(pythonParams);
      try {
        return pythonResult.toJs({ dict_converter: Object.fromEntries });
      } finally {
        pythonResult.destroy();
      }
    } finally {
      pythonParams.destroy();
    }
  },
};

expose(api);
