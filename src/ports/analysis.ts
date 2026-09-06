import { wrap } from "comlink";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import { analysisResultsSchema, type AnalysisResults } from "@/schema/dashboard";

export interface AnalysisPort {
  execute(params: Record<string, unknown>): Promise<AnalysisResults>;
}

const api = wrap<PythonAnalysisWorkerApi>(new PythonAnalysisWorker());

export const analysisPort: AnalysisPort = {
  execute: async (params) => analysisResultsSchema.parse(await api.execute(params)),
};
