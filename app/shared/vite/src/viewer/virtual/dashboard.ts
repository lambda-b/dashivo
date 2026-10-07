import source from "#dashboard/dashboard.json";
import { dashboardSchema } from "@dashivo/shared-schema/dashboard";

export const dashboard = dashboardSchema.parse(source);
