# AWS配信基盤

サービスURLは `https://dashivo.pisan-zapra.com`。既存のRoute 53 Hosted Zoneを参照し、他のレコードやドメイン自体は作成・変更しません。

## 現在の実装範囲

- `DashivoWeb`：Web配信用の非公開S3、CloudFront OAC、DNS検証付きACM証明書、A/AAAAレコード。
- `DashivoIdentity`：東京リージョンのCognito User Pool、公開クライアント、認可コード方式のHosted UI。削除保護・10分のAccess/ID token・1日のRefresh token・ローテーションを設定する。
- `DashivoStorage`：東京リージョンのDynamoDBと、CSV・生成HTML・アクセスログ用の非公開S3。保存先はWeb/APIから独立した削除保護付きスタックとする。
- `DashivoApi`：東京リージョンのLambda（Node.js 24 / ARM64）へAWS Repositoryを接続。Function URLはIAM認証とCloudFront OACに限定し、アプリケーションでもCognito JWTを検証する。未デプロイ。HTML生成・署名URL配信は未接続で、ダウンロード要求には501を返す。
- APIの認証境界を実装。`X-Dashivo-Token` のAccess tokenを `aws-jwt-verify` で検証し、検証済み `sub` ごとのRepositoryとサービスをリクエストに紐づける。ローカルAPIは従来どおり認証なしで使用できる。
- 公開用Editorのログイン/ログアウト・認可コード+PKCE・セッション更新をAmplify SDKで実装。トークンはタブ単位の `sessionStorage` に保存し、APIへAccess tokenだけを送信する。ログアウト時はQuery cacheも破棄する。
- 未認証では1件の試用ダッシュボードをIndexedDBへ保存する。初回は固定サンプルを表示し、その既知の版は登録対象外とする。ログイン時に編集済みの版をCSV・Pythonとまとめて自動登録し、登録済みのユーザー・revisionIdは重複登録しない。ログイン後はサーバーAPIへ切り替え、複数作成・HTMLダウンロードが可能になる。
- Editorのビルドでは固定サンプルだけを同梱し、ローカル保存先の定義・CSV・Pythonは取り込まない。Python用の配布ファイルとwheelを `pyodide/` に配置し、分析が必要になるまで初期化しない。
- TLS要件に合わせて配信スタックを `us-east-1` に配置。後続のAPI・ユーザーデータは `ap-northeast-1` に分離する。
- バケットは暗号化・HTTPS必須・削除時保持。CloudFront/S3のアクセスログは14日で失効する。
- HTTPSへのリダイレクトと共通セキュリティヘッダーを有効化。
- 費用優先でPrice Class 100を使用する。日本のエッジはこのクラスの対象外なので、必要になった時点で配信遅延を測定して見直す。
- GitHub Actionsでは静的チェック、単体・結合テスト、資格情報を必要としないCDK synthを実行する。

**まだサービス公開はできません。** このスタックはS3へアプリやダッシュボードをアップロードしません。HTML生成とEditorの配信接続を完成させてから公開します。`pnpm build` の成果物はダウンロード用Viewerであり、サービス用Editorとしてアップロードしないでください。

## デプロイ状況

2026-10-11にアカウント `154539905353` へ `DashivoWeb`・`DashivoIdentity`・`DashivoStorage` の初回デプロイを完了した。アプリの配置とAPI接続は未実施のため、サービスURLは現時点では403を返す。

- Web：`us-east-1`、CloudFront Distribution ID `E20479BV3E4M6Z`。DNS・証明書・HTTPS接続を確認済み。
- 認証・保存：`ap-northeast-1`。Cognitoのローテーション・削除保護、DynamoDBのオンデマンド設定・削除保護、S3の公開アクセス遮断・生成HTMLのLifecycleを確認済み。
- Google連携は未設定。公開前にOAuthクライアントとSecretを設定する。
- 初回の認証スタックはLiteとローテーションの組み合わせで失敗したため、Essentialsへ修正して再作成した。失敗時に残ったUser Poolはユーザー・アプリクライアントともに0件と確認して削除済みで、未使用リソースは残していない。

各リソースの最新IDはCloudFormationのOutputsから取得する。今後のデプロイも必ず差分を確認し、公開までの残作業を完了するまではEditorを配置しない。

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
4. 公開内容と料金面の確認後に対象スタックを指定してデプロイする。APIは以下のパラメータを必要とするため、初回に引数なしの全スタックデプロイは行わない。スタックの削除保護は有効。

初回bootstrapの対象：

```bash
pnpm --filter @dashivo/infra-cdk exec cdk bootstrap aws://154539905353/us-east-1
pnpm --filter @dashivo/infra-cdk exec cdk bootstrap aws://154539905353/ap-northeast-1
```

現在はCIにデプロイ権限を与えていない。後続でGitHub OIDCの信頼を `lambda-b/dashlet` の承認付きEnvironmentへ限定し、bootstrapロールを引き受けるデプロイロールを定義する。長期アクセスキーは使わない。

## APIの段階的な接続

Webはバージニア、APIは東京にある。リージョン間の循環参照を作らないため、既存スタックのOutputsをAPIのCloudFormationパラメータとして渡す。

```bash
pnpm --filter @dashivo/infra-cdk exec cdk deploy DashivoApi \
  --require-approval broadening \
  --parameters DashivoApi:UserPoolId=ap-northeast-1_CrNgnPExa \
  --parameters DashivoApi:UserPoolClientId=7mcm5dvr39nae59k137vibhdrp \
  --parameters DashivoApi:DistributionId=E20479BV3E4M6Z
```

APIデプロイ後、`ApiUrl` 出力からホスト名だけを取得し、`infra/cdk/cdk.json` の `context.apiOriginDomain` に保存する。公開情報なのでGit管理してよい。後続のsynth/deployでも同じ値を使用し、省略によってAPI経路を消さないようにする。値は東京のLambda Function URLホスト名のみ許可する。

続いて差分確認後に `DashivoWeb` をデプロイする。`/api/*` のみLambdaへ送り、OACは常にSigV4署名する。APIキャッシュは無効で、Cognitoトークン・Content-Type・本文SHA-256とクエリのみ転送する。Cookieや閲覧側のHost/Authorizationは転送しない。Lambda側のリソースポリシーも上記Distributionだけを許可する。

LambdaはVPC・NATを使用しない。実行ロールはテーブルの読み取り・条件付き書き込み、CSV prefixのGetObject/PutObject、専用ログへの書き込みに限定する。SDKクライアントは実行環境で再利用する。HTTP本文は4,000,000バイトを上限とし、Base64化されるFunction URLイベントの6MB制限に余裕を持たせる。全レスポンスに `Cache-Control: no-store` を付ける。

ローカル検証はSDKモックとLambda形式のイベント、CDKテンプレートを使う。実AWSでの権限・JWT・保存動作は、APIデプロイ後に別途確認する。

## 公開までの残作業

1. 認証済みEditorと公開Lambdaの接続。ブラウザーのログイン/ログアウト・PKCE・更新処理とAPIトークン送信、サーバーのJWT検証は実装済み。実Cognitoでの結合確認はデプロイ後に行う。
2. DynamoDB/S3 Repositoryの実AWS結合確認。実装とSDKモックによる検証は完了。Python登録とJSON更新はDynamoDBトランザクションで整合性を保証する。
3. Lambda Function URL + CloudFront `/api/*` のデプロイと実AWS検証。IAM認証・OAC・必要ヘッダーの転送設定は実装済み。
4. 公開EditorへCognitoの公開設定を渡し、配信用バケットへ配置する。Editor/Viewerの用途判定とローカルデータの分離は実装済み。
5. サーバー側HTML生成のLambda対応。Vite/Pyodideの実行・依存ファイル・生成サイズを検証し、大きいHTMLのダウンロードにはS3の期限付きURLを使用する。
6. GitHub OIDCデプロイ、EditorのS3同期・CloudFront invalidation。HTMLは短いTTL、hash付きアセットは長いTTLを設定する。
7. 本番公開前にCSPをWorker/WASM/Cognitoに合わせて設定し、WAFの費用・レート制限、ログ・アラーム、バックアップを決定する。Shield AdvancedやWAFをこの初期スタックで自動購入しない。
8. 試用版の自動登録APIを本番Repositoryへ接続する。同じユーザー・revisionIdの再送は既存登録を返し、サーバー側の編集内容を上書きしない。定義・CSV・Pythonの原子的な保存を保証する。

## 保存基盤と次の実装境界

`DashivoStorage` は保存先の定義だけを担当する。APIのサービスやトランザクション制御をCDKスタックに置かず、後続のAWS Repositoryを既存のサーバーへ注入する。Web・Cognitoの既存Construct IDは変更していない。

| リソース     | 用途                             | 現在の設定                                                                                                                |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Dashboards` | JSON定義・Python・CSV参照情報    | 単一リージョン、オンデマンド、AWS所有キーで暗号化、削除保護・削除時保持。GSI・Streams・レプリカ追加なし。                 |
| `Assets`     | ダッシュボードごとのCSV          | 非公開、S3管理キーで暗号化、HTTPS必須、ACL無効。データ自体は自動失効させない。未完了multipart uploadのみ1日後に中止対象。 |
| `Downloads`  | 生成した単一HTML                 | 非公開・暗号化・HTTPS必須・ACL無効。オブジェクトは1日後に削除対象。CSVとはバケットを分け、誤失効を防ぐ。                  |
| `AccessLogs` | Assets/DownloadsのS3アクセスログ | 非公開・暗号化・HTTPS必須・ACL無効。14日後に削除対象。                                                                    |

S3 Lifecycleは削除時刻を保証しない。ダウンロードのアクセス期限は、後続実装で認証後に発行する短時間の署名URLによって別途制御する。保存用バケットはCloudFrontへ公開しない。

費用優先でDynamoDB PITR・S3バージョニング・カスタマー管理KMSキーは有効化していない。**削除時保持はバックアップではない**ため、誤更新・オブジェクト削除からの復旧は保証しない。公開前にバックアップ方針を決める。オンデマンド課金も料金上限を意味しない。

後続Repositoryのキー設計は以下を前提とする。キー生成はCDKではなくRepository側に実装する。

- `pk = USER#<検証済みCognito sub>`。クライアントから所有者IDを受け取らない。
- 定義は `sk = DASHBOARD#<dashboard-id>`。一覧はユーザーのpartitionに対するprefix Queryで取得し、全ユーザーのScanは行わない。
- Pythonは `sk = LOGIC#<dashboard-id>#<path>`。CSV参照情報は `sk = CSV#<dashboard-id>#<path>` として定義と分離する。既存Repositoryのファイルパスによる読み書き・一覧取得に対応する。
- S3は `users/<sub>/dashboards/<dashboard-id>/...` を起点とする。ユーザーが渡すファイルパスだけで保存先を決めない。
- JSONとPythonの更新は、`expectedVersion` の条件付き書き込みとDynamoDBトランザクションで公開する。Lambdaプロセス内の排他制御は使わない。
- CSVは不変のオブジェクトキーへ保存した後、参照情報をDynamoDBで確定する。S3とDynamoDBをまたぐDBトランザクションはないため、未確定オブジェクトの扱い・再試行・冪等登録もRepository実装で検証する。

`persistence/aws-dashboard-repository.ts` に既存RepositoryのAWS実装を追加した。認証済みサーバーの `repositoryForUser` へ、検証済み `sub` を渡して使用する。SDKクライアントはLambdaハンドラー外で作成して共有し、DocumentClientは `removeUndefinedValues: true` を設定する。アプリケーションサービスはAWS SDKに依存しない。

- 一覧はユーザーpartitionのprefix Queryをページングする。定義の読み取りは強い整合性を使い、更新は保存済みversionを条件にする。
- Python登録は定義更新とソース新規作成を一つのTransactWriteへまとめる。CSV本体はユーザー・ダッシュボード・内容のSHA-256から決まるS3キーへ保存し、その後に参照を条件付き登録する。
- 試用版登録は定義と全ソースの参照を一度に確定する。同じIDへの再送や同時登録では既存の定義を返し、サーバー編集を上書きしない。
- 初期の安全上限は1項目350,000バイト、1トランザクション3,500,000バイト、一括登録99ファイル。CSV本体はDynamoDBのサイズ計算に含めない。上限超過は413で返す。
- S3とDynamoDBは同時にロールバックできない。DBの成否不明時にCSVを削除すると確定済み参照を壊すため、自動削除しない。失敗・競合した登録の未参照オブジェクトが残る場合があり、公開前に参照照合による回収を実装する。Assets全体へ一律の失効は設定しない。

SDKモックでキー分離・競合時のエラー・トランザクションの構成・再送・ページング・認証済みサーバーとの接続を確認した。実AWSでのトランザクション動作やIAM権限は未検証。次はLambda Function URL/OACと実AWS結合確認、その後にHTMLの署名URLダウンロード、GitHub OIDCデプロイの順に接続する。

仕様確認：[CDK TableV2](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.TableV2.html)、[S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html)。

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

Refresh token rotationにはEssentials以上が必要なため、Essentialsプランを使用する。直接認証・Googleログインは月1万MAUまで無料枠がある。ログイン画面は従来のClassic hosted UIを維持し、ブラウザーのPKCE・トークン更新・ログアウトはAmplify SDKに任せる。

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
