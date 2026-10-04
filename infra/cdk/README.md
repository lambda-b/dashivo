# AWS配信基盤

サービスURLは `https://dashivo.pisan-zapra.com`。既存のRoute 53 Hosted Zoneを参照し、他のレコードやドメイン自体は作成・変更しません。

## 現在の実装範囲

- `DashivoWeb`：Web配信用の非公開S3、CloudFront OAC、DNS検証付きACM証明書、A/AAAAレコード。
- TLS要件に合わせて配信スタックを `us-east-1` に配置。後続のAPI・ユーザーデータは `ap-northeast-1` に分離する。
- バケットは暗号化・HTTPS必須・削除時保持。CloudFront/S3のアクセスログは14日で失効する。
- HTTPSへのリダイレクトと共通セキュリティヘッダーを有効化。
- 費用優先でPrice Class 100を使用する。日本のエッジはこのクラスの対象外なので、必要になった時点で配信遅延を測定して見直す。
- GitHub Actionsでは静的チェック、単体・結合テスト、資格情報を必要としないCDK synthを実行する。

**まだサービス公開はできません。** このスタックはS3へアプリやダッシュボードをアップロードしません。Cognito認証・ユーザー分離・AWS Repository・API・オンラインEditorのビルドと配信を完成させてから公開します。`pnpm build` の成果物はダウンロード用Viewerであり、サービス用Editorとしてアップロードしないでください。

## ローカル検証

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright test tests/integration/aws-infrastructure.spec.ts
pnpm cdk:synth
pnpm cdk:diff
```

`cdk:synth` はテンプレート生成のみ。`cdk:diff` はChange Setを作らない読み取り比較。接続先アカウントとドメインは `cdk.json` の `deployment` で管理する。秘密情報や認証情報はこのファイルへ書かない。

## デプロイ前の確認

1. `aws sts get-caller-identity` で `cdk.json` のアカウントと一致することを確認する。
2. 初回だけ管理者が対象リージョンのCDK bootstrapを実行する。これはIAMロール等を作成するため、synthとは別操作。
3. `pnpm cdk:diff` で新規リソース・DNS・権限変更を確認する。
4. 公開内容と料金面の確認後に `pnpm --filter @dashivo/infra-cdk deploy` を実行する。スタックの削除保護は有効。

初回bootstrapの対象：

```bash
pnpm --filter @dashivo/infra-cdk exec cdk bootstrap aws://154539905353/us-east-1
```

現在はCIにデプロイ権限を与えていない。後続でGitHub OIDCの信頼を `lambda-b/dashlet` の承認付きEnvironmentへ限定し、bootstrapロールを引き受けるデプロイロールを定義する。長期アクセスキーは使わない。

## 公開までの残作業

1. Cognitoのauthorization-code + PKCE、Google連携、APIのJWT検証。
2. 検証済みのCognito `sub` を保存キーに使用するDynamoDB/S3 Repository。Python登録とJSON更新はDynamoDBトランザクションで整合性を保証する。
3. Lambda Function URL + CloudFront `/api/*`。OACを有効化し、書き込み時の `x-amz-content-sha256` とCognitoトークン用ヘッダーをクライアントでも対応する。
4. 開発モード判定をオンラインEditor/View­erの用途判定へ変更する。公開ビルドへローカルの定義・CSV・Pythonを埋め込まない。
5. サーバー側HTML生成のLambda対応。Vite/Pyodideの実行・依存ファイル・生成サイズを検証し、大きいHTMLのダウンロードにはS3の期限付きURLを使用する。
6. GitHub OIDCデプロイ、EditorのS3同期・CloudFront invalidation。HTMLは短いTTL、hash付きアセットは長いTTLを設定する。
7. 本番公開前にCSPをWorker/WASM/Cognitoに合わせて設定し、WAFの費用・レート制限、ログ・アラーム、バックアップを決定する。Shield AdvancedやWAFをこの初期スタックで自動購入しない。

Google連携にはGoogle OAuthのクライアントIDとSecretが必要。Secretはチャット・Git・CDK contextへ載せず、AWSのSecret管理に登録する。
