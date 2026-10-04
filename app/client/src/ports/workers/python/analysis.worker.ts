import { expose } from "comlink";
import type { PyProxy } from "pyodide/ffi";
import { analysisDefinitions } from "virtual:dashivo/analysis-assets";
import { initializePyodide } from "virtual:dashivo/pyodide-runtime";
import dashivoSource from "@/ports/workers/python/dashivo.py?raw";

interface Source {
  id: string;
  sourceData: string;
}

interface PreviewInput {
  analysisSource: string;
  params: Record<string, unknown>;
  sources: readonly Source[];
}

export interface PythonAnalysisWorkerApi {
  execute(params: Record<string, unknown>): Promise<unknown>;
  preview(input: PreviewInput): Promise<unknown>;
  inspect(sources: Source[]): Promise<unknown>;
}

const runtime = initializePyodide().then(async (python) => {
  await python.loadPackage("pandas");
  python.FS.writeFile("/home/pyodide/dashivo.py", dashivoSource);
  python.runPython("import dashivo, pandas as pd, io, json");
  return python;
});

const frames = new Map<string, { source: string; data: PyProxy }>();

const getFrame = async (source: Source) => {
  const python = await runtime;
  const cached = frames.get(source.id);
  if (cached?.source === source.sourceData) return cached.data;

  cached?.data.destroy();
  using parse = python.runPython("lambda source: pd.read_csv(io.StringIO(source))");
  const data = parse(source.sourceData);
  frames.set(source.id, { source: source.sourceData, data });
  return data as PyProxy;
};

const run = async ({ analysisSource, params, sources }: PreviewInput) => {
  const python = await runtime;
  await python.loadPackagesFromImports(analysisSource);

  using inputs = python.toPy({});
  using copyFrame = python.runPython("lambda frame: frame.copy(deep=True)");
  for (const source of sources) {
    using copy = copyFrame(await getFrame(source));
    inputs.set(source.id, copy);
  }

  using namespace = python.toPy({ __name__: "dashivo_logic" });
  python.runPython(analysisSource, { globals: namespace });
  using execute = namespace.get("execute");
  if (typeof execute !== "function")
    throw new Error("execute(inputs, params)関数を定義してください。");

  using pythonParams = python.toPy(params);
  using figure = execute(inputs, pythonParams);
  using serialize = python.runPython("dashivo.serialize");
  return JSON.parse(serialize(figure));
};

const api: PythonAnalysisWorkerApi = {
  async execute(params) {
    const results: Record<string, unknown> = {};
    for (const definition of analysisDefinitions) {
      results[definition.id] = await run({
        analysisSource: definition.analysisSource,
        params,
        sources: definition.inputs,
      });
    }
    return results;
  },

  async preview(input) {
    return { output: await run(input) };
  },

  async inspect(sources) {
    const python = await runtime;
    using head = python.runPython(
      "lambda frame: json.dumps(dashivo._rows(frame.head(5)), allow_nan=False)",
    );
    const rows: Record<string, unknown> = {};
    for (const source of sources) rows[source.id] = JSON.parse(head(await getFrame(source)));
    return rows;
  },
};

expose(api);
