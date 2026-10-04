// UIのラベルとは分けて、利用者へ伝えるエラー・操作制限の文言を管理する。
export const messages = {
  loading: "読み込み中…",
  retry: "再試行",
  invalidResponse: "サーバーからの応答を読み取れませんでした。再試行してください。",
  connectionFailed: "サーバーに接続できませんでした。接続状態を確認してください。",
  clipboard: {
    copyFailed: "クリップボードへコピーできませんでした。参照式を選択してコピーしてください。",
  },
  dashboard: {
    listLoadFailed: "一覧を読み込めませんでした。",
    loadFailed: "設定を読み込めませんでした。",
    saveFailed: "設定を保存できませんでした。",
    createFailed: "作成できませんでした。",
    downloadFailed: "HTMLを生成できませんでした。",
  },
  assets: {
    loadFailed: "ファイル一覧を取得できませんでした。",
  },
  settings: {
    invalid: (details: string) => `設定を確認してください。\n${details}`,
  },
  csv: {
    loadFailed: "入力データを読み込めませんでした。",
    registerFailed: "CSVを登録できませんでした。",
    definitionSaveFailed:
      "CSVのアップロードは完了しましたが、設定を保存できませんでした。CSVをもう一度アップロードして登録してください。",
  },
  logic: {
    loadFailed: "Pythonを読み込めませんでした。",
    saveFailed: "Pythonを保存できませんでした。",
    createFailed: "ロジックを作成できませんでした。",
    invalidId: "IDは英小文字・数字・ハイフンで指定してください。",
    deletionWhileSaving: "設定を保存中のため削除できません。保存完了までお待ちください。",
    deletionInUse: (tabNames: string[]) =>
      `「${tabNames.join("」「")}」のコンテンツで使用中です。先に配置を削除するか、別のロジックに変更してください。`,
  },
};
