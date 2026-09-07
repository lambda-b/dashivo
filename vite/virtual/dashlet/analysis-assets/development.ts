import sourceData from "#dashboard/data/raw/sales.csv?raw";
import analysisSource from "#dashboard/logic/analysis.py?raw";
import ordersSource from "#dashboard/logic/orders.py?raw";
import revenueSource from "#dashboard/logic/revenue.py?raw";

export const analysisDefinitions = [
  {
    id: "sales-analysis",
    inputId: "sales",
    path: "logic/analysis.py",
    sourceData,
    analysisSource,
  },
  {
    id: "sales-revenue",
    inputId: "sales",
    path: "logic/revenue.py",
    sourceData,
    analysisSource: revenueSource,
  },
  {
    id: "sales-orders",
    inputId: "sales",
    path: "logic/orders.py",
    sourceData,
    analysisSource: ordersSource,
  },
] satisfies ReadonlyArray<{
  analysisSource: string;
  id: string;
  inputId: string;
  path: string;
  sourceData: string;
}>;
