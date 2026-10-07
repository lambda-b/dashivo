# AWS配信基盤

サービスURLは `https://dashivo.pisan-zapra.com`。既存のRoute 53 Hosted Zoneを参照し、他のレコードやドメイン自体は作成・変更しません。

## 現在の実装範囲

- `DashivoWeb`：Web配信用の非公開S3、CloudFront OAC、DNS検証付きACM証明書、A/AAAAレコード。
- `DashivoIdentity`：東京リージョンのCognito User Pool、公開クライアント、認可コード方式のHosted UI。削除保護・10分のAccess/ID token・1日のRefresh token・ローテーションを設定する。
- APIの認証境界を実装。`X-Dashivo-Token` のAccess tokenを `aws-jwt-verify` で検証し、検証済み `sub` ごとのRepositoryとサービスをリクエストに紐づける。ローカルAPIは従来どおり認証なしで使用できる。
- 公開用Editorのログイン/ログアウト・認可コード+PKCE・セッション更新をAmplify SDKで実装。トークンはタブ単位の `sessionStorage` に保存し、APIへAccess tokenだけを送信する。ログアウト時はQuery cacheも破棄する。
- Editorのビルドではローカルの定義・CSV・Pythonを取り込まない。Python用の配布ファイルとwheelを `pyodide/` に配置し、分析が必要になるまで初期化しない。
- TLS要件に合わせて配信スタックを `us-east-1` に配置。後続のAPI・ユーザーデータは `ap-northeast-1` に分離する。
- バケットは暗号化・HTTPS必須・削除時保持。CloudFront/S3のアクセスログは14日で失効する。
- HTTPSへのリダイレクトと共通セキュリティヘッダーを有効化。
- 費用優先でPrice Class 100を使用する。日本のエッジはこのクラスの対象外なので、必要になった時点で配信遅延を測定して見直す。
- GitHub Actionsでは静的チェック、単体・結合テスト、資格情報を必要としないCDK synthを実行する。

**まだサービス公開はできません。** このスタックはS3へアプリやダッシュボードをアップロードしません。AWS Repository・Lambda API・Editorの配信接続を完成させてから公開します。`pnpm build` の成果物はダウンロード用Viewerであり、サービス用Editorとしてアップロードしないでください。

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
pnpm --filter @dashivo/infra-cdk exec cdk bootstrap aws://154539905353/ap-northeast-1
```

現在はCIにデプロイ権限を与えていない。後続でGitHub OIDCの信頼を `lambda-b/dashlet` の承認付きEnvironmentへ限定し、bootstrapロールを引き受けるデプロイロールを定義する。長期アクセスキーは使わない。

## 公開までの残作業

1. 認証済みEditorと公開Lambdaの接続。ブラウザーのログイン/ログアウト・PKCE・更新処理とAPIトークン送信、サーバーのJWT検証は実装済み。実Cognitoでの結合確認はデプロイ後に行う。
2. 検証済みのCognito `sub` を保存キーに使用するDynamoDB/S3 Repository。Python登録とJSON更新はDynamoDBトランザクションで整合性を保証する。
3. Lambda Function URL + CloudFront `/api/*`。OACを有効化する。クライアントの書き込み時の `x-amz-content-sha256` とCognitoトークン用ヘッダーは実装済み。
4. 公開EditorへCognitoの公開設定を渡し、配信用バケットへ配置する。Editor/Viewerの用途判定とローカルデータの分離は実装済み。
5. サーバー側HTML生成のLambda対応。Vite/Pyodideの実行・依存ファイル・生成サイズを検証し、大きいHTMLのダウンロードにはS3の期限付きURLを使用する。
6. GitHub OIDCデプロイ、EditorのS3同期・CloudFront invalidation。HTMLは短いTTL、hash付きアセットは長いTTLを設定する。
7. 本番公開前にCSPをWorker/WASM/Cognitoに合わせて設定し、WAFの費用・レート制限、ログ・アラーム、バックアップを決定する。Shield AdvancedやWAFをこの初期スタックで自動購入しない。

Google連携にはGoogle OAuthのクライアントIDとSecretが必要。Secretはチャット・Git・CDK contextへ載せず、AWSのSecret管理に登録する。

## Google連携の設定

Google未設定時はセルフ登録を無効にし、管理者が作成したCognitoユーザーのみがログインできる。Googleを設定すると、Hosted UIのプロバイダーはGoogleだけになる。Googleの属性はemailへマッピングし、データ所有者はemailではなくCognito `sub` とする。メールが同じユーザー同士の自動リンクは行わない。

東京リージョンのSecrets ManagerへGoogle Client Secretを**文字列そのもの**として保存し、公開クライアントIDとSecret ARNだけをCDK contextへ渡す。GoogleのOAuthクライアントには `GoogleRedirectUri` 出力のURLを登録する。

```bash
pnpm --filter @dashivo/infra-cdk exec cdk synth --strict --lookups false \
  -c googleClientId=YOUR_CLIENT_ID.apps.googleusercontent.com \
  -c googleSecretArn=arn:aws:secretsmanager:ap-northeast-1:YOUR_ACCOUNT:secret:YOUR_SECRET
```

デプロイ時も同じcontextを渡す。Secretの解決はCloudFormationが行い、synthやアプリケーションはSecretを取得・出力しない。設定は必ずIDとARNの両方を指定する。

APIではID tokenや未検証のJWTを受け付けない。署名・期限・issuer・client_id・token_useを検証し、失敗は共通ハンドラーで401として返す。JWKS取得等の予期しない障害は認証失敗へ握り潰さない。JWTのローカル検証では既発行Access tokenの即時失効までは保証できないため、有効期限を短くしている。

Classic hosted UIを使うのは費用優先でLiteプランを選ぶため。ブラウザーのPKCE・トークン更新・ログアウトはAmplify SDKに任せる。

## 公開用Editorのビルド

`app/client/.env.editor.local` またはCIの環境変数へ、`DashivoIdentity` の出力を設定する。これらは公開情報であり、Google Client SecretやAWS資格情報は一切含めない。

| 環境変数                    | CDK出力                               |
| --------------------------- | ------------------------------------- |
| `VITE_COGNITO_USER_POOL_ID` | `UserPoolId`                          |
| `VITE_COGNITO_CLIENT_ID`    | `UserPoolClientId`                    |
| `VITE_COGNITO_LOGIN_URL`    | `LoginDomain`（`https://` を含むURL） |

```bash
pnpm build:editor
```

成果物は `dist/editor/`。Cognito設定が欠けていればビルドで失敗する。CDKはまだこの成果物をアップロードしない。ログインの戻り先・ログアウト先は配信originの `/` で、Cognitoの許可URLと完全一致する必要がある。

APIへの認証ヘッダーは共通のrequest処理から送信する。送信先は同一originの `/api/` だけに制限し、リダイレクトでトークンが外部へ送られないようにする。JSON・CSVの送信本文そのものをSHA-256へ渡し、CloudFront OAC用ヘッダーを生成する。

トークンの保存先は `sessionStorage`。長期の `localStorage` 保管を避けるが、JavaScriptから読み取り可能なのでXSS対策の代わりにはならない。SDKのOAuth状態等のメタデータとトークンの保存先は別。OAuth callbackの失敗は共通通知、認証状態の取得失敗は既存のQueryBoundaryで表示する。

ブラウザーテストではOAuthを模擬し、PKCE・state拒否・更新とローテーション・API認証・本番EditorのPython実行・ログアウトを確認する。AWSへ実際のリクエストは送らない。

```bash
pnpm exec playwright test tests/e2e/online-auth.spec.ts
```
