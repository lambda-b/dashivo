# 公開後の確認と運用整備

2026-10-11。初回公開のDeploy run `38097367869` は成功。

## 今回の対応

- CSVは `dashboard/<id>/data/*.csv` に統一。定義・固定サンプル・テスト・READMEの参照も更新。
- 旧ブラウザー保存形式の補完・移行と旧サンプルの自動更新は行わない。未認証時は `trial` レコードだけを読み込み、存在しなければ現行サンプルを作成する。
- Editor用CSPを追加。scriptのinline実行、object、frame埋め込みを禁止。PyodideのJSバインディング生成のため `unsafe-eval`、React/グラフのためinline style、Workerのためblobを許可する。ViewerのオフラインHTMLへはこのCSPを付けない。
- CSP適用状態のEditorでOAuth模擬・保存・Python実行をブラウザーテストする。
- 公開サイトのブラウザー確認を追加。未認証サンプルのPython実行、ログインボタン、一覧/ダウンロード非表示、無トークン/不正トークンの401を確認。公開データの読み取りとブラウザー内処理だけを行い、サーバーへデータ登録しない。
- Deploy完了後にAWS資格情報なしの `public-smoke` ジョブでこの確認を毎回実行する。

手元での公開確認:

```bash
DASHIVO_PUBLIC_URL=https://dashivo.pisan-zapra.com pnpm exec playwright test tests/e2e/public-deployment.spec.ts
```

## 実ユーザーでの確認が必要

2026-10-12のログイン調査: Google認証後、APIのリポジトリ生成時に `ZodError: Invalid UUID` が発生していた。Cognitoの `sub` はRFC UUIDを保証しないため、`aws-dashboard-repository.ts` と `aws-dashboard-download-storage.ts` の保存キー用検証を `z.guid()` に変更。JWTの署名・issuer・client ID・token use・有効期限検証は変更しない。合成した非RFC形式のIDで、認証後の一覧取得、保存キーのユーザー分離、ダウンロード署名を回帰テストする。実ユーザーのID・JWTはテストに含めない。

- Googleログイン完了、ログアウト、再ログイン、トークン更新。
- 未認証で編集 → ログイン → 自動登録 → 再ログインで重複登録しない。
- ダッシュボード作成、CSV登録、Python/JSON編集、再読込後の保持。
- HTMLダウンロード、ネットワーク遮断下でサマリー/グラフ/テーブルとパラメータが動く。
- 別のGoogleアカウントで同じIDを使ってもデータが混ざらず、他ユーザーのデータへアクセスできない。
- 実LambdaのHTML生成時間・メモリ・IAM権限。実Google資格情報やJWTはGit・チャット・テスト成果物へ保存しない。

## 運用判断・後続実装

- 料金通知: `DashivoBudget` でAWSアカウント全体の月額5 USDを監視。実績・予測が5 USDを超えたらメール通知する。既存予算は変更せず、自動停止・削除も行わない。通知には遅延があり、課金の上限を保証するものではない。
- メールアドレスはGitに保存せず、デプロイ時の `NotificationEmail` パラメータ（NoEcho）で指定する。このスタックは通常のWeb/APIデプロイとは独立して更新する。
- 障害通知: Lambda Errors/Throttlesの通知先は確認済み。通知条件のしきい値・評価期間を決めてからSNS通知とセットで設定する。
- バックアップ: 現状はDynamoDB/S3の削除保護・保持であり、履歴復元ではない。DynamoDB PITRとCSVのS3バージョニング/保持期間をセットで決める。DBだけを復元してもCSVを失っていれば復旧できない。
- 未参照CSV: 保存失敗後のS3オブジェクトを削除する前に、参照の強整合読み取りと、再登録/保存処理との競合防止が必要。単に「古くて現在参照がない」だけで自動削除しない。まず候補の読み取り監査、隔離/猶予期間、書き込み側との協調を設計する。
- WAF/Shield Advancedは費用優先で未導入。追加購入は行わない。レート制限は認証済み利用量を見てAPI単位で検討する。

今回追加したCSP/CSV/公開テストはコードの変更であり、GitHubの本番承認とデプロイ完了までは公開環境に反映されない。
