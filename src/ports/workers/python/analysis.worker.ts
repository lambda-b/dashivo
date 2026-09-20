import { expose } from "comlink";
import type { PyProxy } from "pyodide/ffi";
import { analysisDefinitions } from "virtual:dashlet/analysis-assets";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

export interface PythonAnalysisWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
  preview(input: PythonPreviewInput): Promise<unknown>;
}

interface PythonPreviewInput {
  analysisSource: string;
  params: Record<string, unknown>;
  sources: { id: string; sourceData: string }[];
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

def _dashlet_preview_rows(data):
    return data.head(5).to_dict(orient="records")

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
    const inputs = definition.inputs.map((input) => ({
      data: getDataFrame(input.id, input.sourceData),
      id: input.id,
    }));
    analyses.push({
      id: definition.id,
      inputs,
      execute,
    });
  }
  return { pyodide, analyses };
});

let previewModuleIndex = 0;

const api: PythonAnalysisWorkerApi = {
  execute: async (params) => {
    const { pyodide, analyses } = await analysisPromise;
    const results: Record<string, unknown> = {};

    for (const { id, inputs, execute } of analyses) {
      using pythonInputs = pyodide.runPython("{}");
      for (const { data, id: inputId } of inputs) {
        using dataCopy = data.copy();
        pythonInputs.set(inputId, dataCopy);
      }
      using pythonParams = pyodide.toPy(params);
      results[id] = convertPythonResult(execute(pythonInputs, pythonParams));
    }

    return results;
  },
  preview: async ({ analysisSource, params, sources }) => {
    const { pyodide } = await analysisPromise;
    await pyodide.loadPackagesFromImports(analysisSource);
    const moduleName = `dashlet_preview_${previewModuleIndex++}`;
    pyodide.FS.writeFile(`/home/pyodide/${moduleName}.py`, analysisSource);
    pyodide.runPython("import importlib; importlib.invalidate_caches()");
    using module = pyodide.pyimport(moduleName);
    using execute = module.execute;
    if (typeof execute !== "function") {
      throw new Error("Pythonロジックにexecute(inputs, params)関数がありません。");
    }
    using parseCsv = pyodide.runPython("_dashlet_parse_csv");
    using pythonInputs = pyodide.runPython("{}");
    const inputRows: Record<string, unknown> = {};
    for (const source of sources) {
      using data = parseCsv(source.sourceData);
      pythonInputs.set(source.id, data);
      using previewRows = pyodide.runPython("_dashlet_preview_rows")(data);
      inputRows[source.id] = convertPythonResult(previewRows);
    }
    using pythonParams = pyodide.toPy(params);
    return {
      inputRows,
      output: convertPythonResult(execute(pythonInputs, pythonParams)),
    };
  },
};

expose(api);
