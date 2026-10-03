export class InputSourceConflict extends Error {
  constructor() {
    super("同じ名前のCSVがこのダッシュボードに登録済みです。ファイル名を変更してください。");
    this.name = "InputSourceConflict";
  }
}
