export interface AnalysisDefinition {
  analysisSource: string;
  id: string;
  inputId: string;
  path: string;
  sourceData: string;
}

export declare const analysisDefinitions: readonly AnalysisDefinition[];
