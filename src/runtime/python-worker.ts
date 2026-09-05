import { wrap } from "comlink";
import { validateDatasetBindings } from "@/runtime/bindings";
import {
  analysisResultSchema,
  type AnalysisResult,
  type DashboardSchema,
} from "@/schema/dashboard";
import type { PythonWorkerApi } from "@/workers/api";
import PythonWorker from "@/workers/python.worker?worker&inline";

const api = wrap<PythonWorkerApi>(new PythonWorker());

export const executeAnalysis = async (
  dashboard: DashboardSchema,
  params: Record<string, unknown>,
): Promise<AnalysisResult> => {
  const result = analysisResultSchema.parse(await api.execute(params));
  return validateDatasetBindings(dashboard, result);
};
