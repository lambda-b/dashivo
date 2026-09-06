import { wrap } from "comlink";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import { analysisResultSchema, type AnalysisResult } from "@/schema/dashboard";

export interface AnalysisPort {
  execute(params: Record<string, unknown>): Promise<AnalysisResult>;
}

const api = wrap<PythonAnalysisWorkerApi>(new PythonAnalysisWorker());

export const analysisPort: AnalysisPort = {
  execute: async (params) => analysisResultSchema.parse(await api.execute(params)),
};
