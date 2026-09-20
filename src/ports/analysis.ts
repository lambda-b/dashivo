import { wrap } from "comlink";
import { z } from "zod";
import type { PythonAnalysisWorkerApi } from "@/ports/workers/python/analysis.worker";
import PythonAnalysisWorker from "@/ports/workers/python/analysis.worker?worker&inline";
import {
  analysisOutputSchema,
  analysisResultsSchema,
  dataRowSchema,
  type AnalysisResults,
} from "@/schema/dashboard";

const analysisPreviewResultSchema = z.object({
  inputRows: z.record(z.string(), z.array(dataRowSchema)),
  output: analysisOutputSchema,
});

export interface AnalysisPreviewInput {
  analysisSource: string;
  params: Record<string, unknown>;
  sources: { id: string; sourceData: string }[];
}

export interface AnalysisPort {
  execute(params: Record<string, unknown>): Promise<AnalysisResults>;
  preview(input: AnalysisPreviewInput): Promise<z.infer<typeof analysisPreviewResultSchema>>;
}

const api = wrap<PythonAnalysisWorkerApi>(new PythonAnalysisWorker());

export const analysisPort: AnalysisPort = {
  execute: async (params) => analysisResultsSchema.parse(await api.execute(params)),
  preview: async (input) => analysisPreviewResultSchema.parse(await api.preview(input)),
};
