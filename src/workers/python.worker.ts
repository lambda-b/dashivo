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
    using pythonParams = pyodide.toPy({ ...params, source_data: sourceData });
    using pythonResult = analysis.execute(pythonParams);

    return pythonResult.toJs({
      dict_converter: Object.fromEntries,
      create_pyproxies: false,
    });
  },
};

expose(api);
