import type { AnalysisLogicDefinition } from "@shared/dashboard";

type AnalysisAssetDefinition = Pick<AnalysisLogicDefinition, "id" | "path"> & {
  inputs: { id: string; sourceData: string }[];
  analysisSource: string;
};

export declare const analysisDefinitions: readonly AnalysisAssetDefinition[];
