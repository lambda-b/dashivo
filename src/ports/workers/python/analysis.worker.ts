import { expose } from "comlink";
import sourceData from "#dashboard/data/raw/sales.csv?raw";
import analysisSource from "#dashboard/logic/analysis.py?raw";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

export interface PythonAnalysisWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
}

const analysisPromise = initializePyodide().then(async (pyodide) => {
  await pyodide.loadPackagesFromImports(analysisSource);
  pyodide.FS.writeFile("/home/pyodide/analysis.py", analysisSource);
  return { pyodide, analysis: pyodide.pyimport("analysis") };
});

const api: PythonAnalysisWorkerApi = {
  execute: async (params) => {
    const { pyodide, analysis } = await analysisPromise;
    using pythonParams = pyodide.toPy({ ...params, source_data: sourceData });
    using pythonResult = analysis.execute(pythonParams);

    return pythonResult.toJs({
      dict_converter: Object.fromEntries,
      create_pyproxies: false,
    });
  },
};

expose(api);
