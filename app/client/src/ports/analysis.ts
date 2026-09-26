import { wrap } from "comlink";
import { z } from "zod";
import { loadInputSource, loadPythonSource } from "@/builder/api/python";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import {
  analysisOutputSchema,
  analysisResultsSchema,
  dataRowSchema,
  type AnalysisDefinition,
} from "@shared/dashboard";

export interface AnalysisPreviewInput {
  analysisSource: string;
  params: Record<string, unknown>;
  sources: { id: string; sourceData: string }[];
}

const api = wrap<PythonAnalysisWorkerApi>(new PythonAnalysisWorker());

export const loadInputs = (analysis: AnalysisDefinition) =>
  Promise.all(
    analysis.inputs.map(async (input) => ({
      id: input.id,
      sourceData: await loadInputSource(input.path),
    })),
  );

export const analysisPort = {
  async execute(
    params: Record<string, unknown>,
    analysis?: AnalysisDefinition,
    dashboardId = "sales-overview",
  ) {
    if (import.meta.env.DEV && analysis) {
      const sources = await loadInputs(analysis);
      const results: Record<string, unknown> = {};

      for (const logic of analysis.logic) {
        const result = await this.preview({
          analysisSource: await loadPythonSource(dashboardId, logic.path),
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
