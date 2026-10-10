export class DashboardIdConflict extends Error {
  constructor() {
    super("同じIDのダッシュボードが存在します。別のIDを指定してください。");
    this.name = "DashboardIdConflict";
  }
}
