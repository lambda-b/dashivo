export interface DashboardBuildService {
  build(dashboardId: string): Promise<ArrayBuffer>;
}
