import { wrap } from "comlink";
import { analysisResultSchema, type AnalysisResult } from "@/schema/dashboard";
import type { PythonWorkerApi } from "@/workers/api";
import PythonWorker from "@/workers/python.worker?worker&inline";

const api = wrap<PythonWorkerApi>(new PythonWorker());

export const executeAnalysis = async (params: Record<string, unknown>): Promise<AnalysisResult> =>
  analysisResultSchema.parse(await api.execute(params));
