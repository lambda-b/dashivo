import { wrap } from "comlink";
import { z } from "zod";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import type { DashboardStorage } from "@/storage/server";
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

export const loadInputs = async (
  dashboardId: string,
  analysis: AnalysisDefinition,
  storage: Pick<DashboardStorage, "loadInputSource">,
) => {
  return Promise.all(
    analysis.inputs.map(async (input) => ({
      id: input.id,
      sourceData: await storage.loadInputSource(dashboardId, input.path),
    })),
  );
};

export const analysisPort = {
  async execute(
    params: Record<string, unknown>,
    analysis: AnalysisDefinition,
    dashboardId: string,
    storage?: Pick<DashboardStorage, "loadInputSource" | "loadPythonSource">,
  ) {
    if (import.meta.env.MODE !== "viewer") {
      if (!storage) throw new Error("Analysis storage is not available.");

      const sources = await loadInputs(dashboardId, analysis, storage);
      const results: Record<string, unknown> = {};

      for (const logic of analysis.logic) {
        const result = await this.preview({
          analysisSource: await storage.loadPythonSource(dashboardId, logic.path),
          sources,
          params,
        });
        results[logic.id] = result;
      }

      return analysisResultsSchema.parse(results);
    }

    return analysisResultsSchema.parse(await api.execute(params));
  },

  async inspect(sources: AnalysisPreviewInput["sources"]) {
    return z.record(z.string(), z.array(dataRowSchema)).parse(await api.inspect(sources));
  },

  async preview(input: AnalysisPreviewInput) {
    return analysisOutputSchema.parse(await api.preview(input));
  },
};
