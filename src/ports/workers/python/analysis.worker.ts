import { expose } from "comlink";
import { analysisDefinitions } from "virtual:dashlet/analysis-assets";
import { initializePyodide } from "virtual:dashlet/pyodide-runtime";

export interface PythonAnalysisWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
}

const analysisPromise = initializePyodide().then(async (pyodide) => {
  const analyses = [];
  for (const [index, definition] of analysisDefinitions.entries()) {
    await pyodide.loadPackagesFromImports(definition.analysisSource);
    const moduleName = `dashlet_analysis_${index}`;
    pyodide.FS.writeFile(`/home/pyodide/${moduleName}.py`, definition.analysisSource);
    const module = pyodide.pyimport(moduleName);
    const execute = module.execute;
    if (typeof execute !== "function") {
      throw new Error(
        `Python logic「${definition.id}」(${definition.path})にexecute関数がありません。`,
      );
    }
    analyses.push({
      id: definition.id,
      sourceData: definition.sourceData,
      execute,
    });
  }
  return { pyodide, analyses };
});

const api: PythonAnalysisWorkerApi = {
  execute: async (params) => {
    const { pyodide, analyses } = await analysisPromise;
    const results: Record<string, unknown> = {};

    for (const { id, sourceData, execute } of analyses) {
      using pythonParams = pyodide.toPy({ ...params, source_data: sourceData });
      using pythonResult = execute(pythonParams);

      results[id] = pythonResult.toJs({
        dict_converter: Object.fromEntries,
        create_pyproxies: false,
      });
    }

    return results;
  },
};

expose(api);
