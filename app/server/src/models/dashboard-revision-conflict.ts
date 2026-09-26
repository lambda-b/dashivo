export class DashboardRevisionConflict extends Error {
  constructor() {
    super("Dashboard定義が別の更新によって変更されました。再読み込みしてから再試行してください。");
    this.name = "DashboardRevisionConflict";
  }
}
