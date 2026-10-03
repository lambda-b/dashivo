export class InputSourceAccessDenied extends Error {
  constructor() {
    super("CSV入力は対象ダッシュボードのフォルダー内に限られます。");
    this.name = "InputSourceAccessDenied";
  }
}
