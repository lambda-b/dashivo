import { expose } from "comlink";
import type { PyProxy } from "pyodide/ffi";
import { analysisDefinitions } from "virtual:dashlet/analysis-assets";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

export interface PythonAnalysisWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
}

const convertPythonResult = (result: unknown) => {
  if (typeof result !== "object" || result === null || !("toJs" in result)) return result;
  using proxy = result as PyProxy;
  return proxy.toJs({
    dict_converter: Object.fromEntries,
    create_pyproxies: false,
  });
};

const analysisPromise = initializePyodide().then(async (pyodide) => {
  await pyodide.loadPackage("pandas");
  using parseCsv = pyodide.runPython(`
import io
import pandas as pd

def _dashlet_parse_csv(source):
    return pd.read_csv(io.StringIO(source))

_dashlet_parse_csv
`);
  const dataFrames = new Map<string, PyProxy>();
  const getDataFrame = (inputId: string, sourceData: string) => {
    const existing = dataFrames.get(inputId);
    if (existing) return existing;
    const data: PyProxy = parseCsv(sourceData);
    dataFrames.set(inputId, data);
    return data;
  };
  const analyses = [];
  for (const [index, definition] of analysisDefinitions.entries()) {
    await pyodide.loadPackagesFromImports(definition.analysisSource);
    const moduleName = `dashlet_analysis_${index}`;
    pyodide.FS.writeFile(`/home/pyodide/${moduleName}.py`, definition.analysisSource);
    pyodide.runPython("import importlib; importlib.invalidate_caches()");
    const module = pyodide.pyimport(moduleName);
    const execute = module.execute;
    if (typeof execute !== "function") {
      throw new Error(
        `Python logic「${definition.id}」(${definition.path})にexecute関数がありません。`,
      );
    }
    const data = getDataFrame(definition.inputId, definition.sourceData);
    analyses.push({
      data,
      id: definition.id,
      execute,
    });
  }
  return { pyodide, analyses };
});

const api: PythonAnalysisWorkerApi = {
  execute: async (params) => {
    const { pyodide, analyses } = await analysisPromise;
    const results: Record<string, unknown> = {};

    for (const { data, id, execute } of analyses) {
      using dataCopy = data.copy();
      using pythonParams = pyodide.toPy(params);
      results[id] = convertPythonResult(execute(dataCopy, pythonParams));
    }

    return results;
  },
};

expose(api);
