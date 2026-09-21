import { wrap } from "comlink";
import { z } from "zod";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import {
  analysisOutputSchema,
  analysisResultsSchema,
  dataRowSchema,
  type AnalysisDefinition,
} from "@/schema/dashboard";

export interface AnalysisPreviewInput {
  analysisSource: string;
  params: Record<string, unknown>;
  sources: { id: string; sourceData: string }[];
}
const api = wrap<PythonAnalysisWorkerApi>(new PythonAnalysisWorker());
const readAsset = async (path: string) => {
  const response = await fetch("/dashboard/" + path);
  if (!response.ok) throw new Error(`読み込みに失敗しました: ${path}`);
  return response.text();
};
export const loadInputs = (analysis: AnalysisDefinition) =>
  Promise.all(
    analysis.inputs.map(async (input) => ({
      id: input.id,
      sourceData: await readAsset(input.path),
    })),
  );
export const analysisPort = {
  async execute(params: Record<string, unknown>, analysis?: AnalysisDefinition) {
    if (import.meta.env.DEV && analysis) {
      const sources = await loadInputs(analysis);
      const results: Record<string, unknown> = {};
      for (const logic of analysis.logic) {
        const result = await this.preview({
          analysisSource: await readAsset(logic.path),
          sources,
          params,
        });
        results[logic.id] = result.output;
      }
      return analysisResultsSchema.parse(results);
    }
    return analysisResultsSchema.parse(await api.execute(params));
  },
  async inspect(sources: AnalysisPreviewInput["sources"]) {
    return z.record(z.string(), z.array(dataRowSchema)).parse(await api.inspect(sources));
  },
  async preview(input: AnalysisPreviewInput) {
    return z.object({ output: analysisOutputSchema }).parse(await api.preview(input));
  },
};
