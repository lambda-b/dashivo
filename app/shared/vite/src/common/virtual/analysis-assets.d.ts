import type { AnalysisLogicDefinition } from "@dashivo/shared-schema/dashboard";

type AnalysisAssetDefinition = Pick<AnalysisLogicDefinition, "id" | "path"> & {
  inputs: { id: string; sourceData: string }[];
  analysisSource: string;
};

export declare const analysisDefinitions: readonly AnalysisAssetDefinition[];
