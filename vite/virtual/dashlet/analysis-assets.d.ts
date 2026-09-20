export interface AnalysisDefinition {
  analysisSource: string;
  id: string;
  inputs: readonly {
    id: string;
    sourceData: string;
  }[];
  path: string;
}

export declare const analysisDefinitions: readonly AnalysisDefinition[];
