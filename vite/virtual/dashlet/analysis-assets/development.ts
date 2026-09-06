import sourceData from "#dashboard/data/raw/sales.csv?raw";
import analysisSource from "#dashboard/logic/analysis.py?raw";

export const analysisDefinitions = [
  { id: "sales-analysis", path: "logic/analysis.py", sourceData, analysisSource },
] satisfies ReadonlyArray<{
  analysisSource: string;
  id: string;
  path: string;
  sourceData: string;
}>;
