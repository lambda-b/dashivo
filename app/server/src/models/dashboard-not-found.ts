export class DashboardNotFound extends Error {
  constructor(id: string) {
    super(`Dashboard「${id}」が見つかりません。`);
    this.name = "DashboardNotFound";
  }
}
