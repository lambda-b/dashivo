# AWS配信基盤

サービスURLは `https://dashivo.pisan-zapra.com`。既存のRoute 53 Hosted Zoneを参照し、他のレコードやドメイン自体は作成・変更しません。

## 現在の実装範囲

- `DashivoWeb`：Web配信用の非公開S3、CloudFront OAC、DNS検証付きACM証明書、A/AAAAレコード。
- `DashivoIdentity`：東京リージョンのCognito User Pool、公開クライアント、認可コード方式のHosted UI。削除保護・10分のAccess/ID token・1日のRefresh token・ローテーションを設定する。
- `DashivoStorage`：東京リージョンのDynamoDBと、CSV・生成HTML・アクセスログ用の非公開S3。保存先はWeb/APIから独立した削除保護付きスタックとする。
- `DashivoDeployment`：GitHub Actions用OIDCロール。既存の共有providerを参照し、main限定・承認付き `production` Environmentからのみ引き受けられる。初回デプロイ済み。
- `DashivoApi`：東京リージョンのLambda（Node.js 24 / ARM64コンテナ）へAWS Repositoryを接続。Function URLはIAM認証とCloudFront OACに限定し、アプリケーションでもCognito JWTを検証する。ViteによるHTML生成とS3の署名URL配信まで実装・デプロイ済み。
- APIの認証境界を実装。`X-Dashivo-Token` のAccess tokenを `aws-jwt-verify` で検証し、検証済み `sub` ごとのRepositoryとサービスをリクエストに紐づける。ローカルAPIは従来どおり認証なしで使用できる。
- 公開用Editorのログイン/ログアウト・認可コード+PKCE・セッション更新をAmplify SDKで実装。トークンはタブ単位の `sessionStorage` に保存し、APIへAccess tokenだけを送信する。ログアウト時はQuery cacheも破棄する。
- 未認証では1件の試用ダッシュボードをIndexedDBへ保存する。初回は固定サンプルを表示し、その既知の版は登録対象外とする。ログイン時に編集済みの版をCSV・Pythonとまとめて自動登録し、登録済みのユーザー・revisionIdは重複登録しない。ログイン後はサーバーAPIへ切り替え、複数作成・HTMLダウンロードが可能になる。
- Editorのビルドでは固定サンプルだけを同梱し、ローカル保存先の定義・CSV・Pythonは取り込まない。Python用の配布ファイルとwheelを `pyodide/` に配置し、分析が必要になるまで初期化しない。
- TLS要件に合わせて配信スタックを `us-east-1` に配置。後続のAPI・ユーザーデータは `ap-northeast-1` に分離する。
- バケットは暗号化・HTTPS必須・削除時保持。CloudFront/S3のアクセスログは14日で失効する。
- HTTPSへのリダイレクトと共通セキュリティヘッダーを有効化。
- 費用優先でPrice Class 100を使用する。日本のエッジはこのクラスの対象外なので、必要になった時点で配信遅延を測定して見直す。
- GitHub Actionsでは静的チェック、単体・結合テスト、資格情報を必要としないCDK synthを実行する。

公開EditorはGitHub Actionsから配置する。`pnpm build` の成果物はダウンロード用Viewerであり、サービス用Editorとしてアップロードしない。ローカルのダッシュボードやユーザーデータを配信用バケットへ配置しない。

## デプロイ状況

2026-10-11にアカウント `154539905353` へWeb・Identity・Storage・Deployment・APIをデプロイし、Editorを公開した。GitHub Actions run `38097367869` は成功。トップページの200、未認証GET/POSTの401を確認した。

- Web：`us-east-1`、CloudFront Distribution ID `E20479BV3E4M6Z`。DNS・証明書・HTTPS接続を確認済み。
- 認証・保存：`ap-northeast-1`。Cognitoのローテーション・削除保護、DynamoDBのオンデマンド設定・削除保護、S3の公開アクセス遮断・生成HTMLのLifecycleを確認済み。
- Google連携は東京リージョンのParameter Storeを参照する。Identityへ反映済みで、Google認証画面へのリダイレクトを確認した。実ユーザーによるログイン完了は別途確認する。
- 初回の認証スタックはLiteとローテーションの組み合わせで失敗したため、Essentialsへ修正して再作成した。失敗時に残ったUser Poolはユーザー・アプリクライアントともに0件と確認して削除済みで、未使用リソースは残していない。

各リソースの最新IDはCloudFormationのOutputsから取得する。今後のデプロイも必ず差分を確認し、production Environmentの承認を経て実行する。

GitHubリポジトリは `lambda-b/dashivo`。OIDC、ARM64イメージビルド・RIE起動・約20MBのHTML生成、静的チェック・単体/結合テスト・ブラウザーE2E・CDK synthをCIで確認済み。実AWS上の認証済みHTML生成は未検証。

## ローカル検証

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright test tests/integration/aws-infrastructure.spec.ts
pnpm cdk:synth
pnpm cdk:diff
```

Dockerが利用可能なら `node tests/integration/verify-lambda-image.ts` でLambdaイメージも検証する。現在のCPUアーキテクチャ向けにビルドし、AWS付属のRuntime Interface Emulatorで未認証リクエストの401を確認した後、読み取り専用のルートファイルシステム・512MBの `/tmp`・2GBメモリで実際にHTMLを生成する。生成HTMLのサイズと一時ソースの削除も検証する。AWS資格情報は不要で、AWSリソースには接続しない。

GitHub Actionsの `lambda-image` ジョブは `ubuntu-24.04-arm` を使い、本番と同じARM64で上記を実行する。イメージは検証用で、ECRへの登録やデプロイは行わない。ローカルのDockerがない環境では実行できず、CIの成功を確認するまでイメージ検証済みとは扱わない。

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

GitHubリポジトリは `lambda-b/dashivo`。`DashivoDeployment` は既存のGitHub OIDC providerを参照し、承認付き `production` Environment専用のデプロイロールを定義する。長期アクセスキーは使わない。

## GitHub Actionsからのデプロイ

`Deploy` workflowはmainへのpushまたは手動起動で、共通の検証とARM64 Lambdaイメージ検証を実行する。すべて成功し、`production` Environmentで承認されると、OIDCで1時間以内のAWS資格情報を取得する。

1. 既存の認証/Webスタックから公開設定を読み、Editorをビルドする。
2. CDKでStorageの出力を更新してからAPIの差分を出力し、イメージをビルド・bootstrapのECRへ登録してLambdaをデプロイする。
3. APIのFunction URLを取得し、CloudFrontの `/api/*` を接続する。
4. Editorの関連ファイルをS3へ配置し、最後にindex.htmlを更新する。旧ファイルは即時削除しない。
5. CloudFrontのキャッシュを無効化し、トップページの200・未認証APIの401を確認する。

認証・デプロイ権限スタックはこのworkflowで更新しない。変更が必要な場合は管理者が差分確認の上で別途デプロイする。CDKの `--require-approval never` は無条件の自動公開ではなく、GitHub Environmentで承認済みのジョブ内に限定する。差分は承認後のジョブログに出るため、承認前のレビューはコミット内容と検証結果で行う。

初期設定は管理者が一度だけ実施する。

```bash
pnpm --filter @dashivo/infra-cdk exec cdk diff DashivoDeployment --no-change-set
pnpm --filter @dashivo/infra-cdk exec cdk deploy DashivoDeployment --exclusively --require-approval broadening \
  --parameters DashivoDeployment:WebsiteBucketName=YOUR_WEBSITE_BUCKET \
  --parameters DashivoDeployment:DistributionId=YOUR_DISTRIBUTION_ID
```

GitHubの `production` Environmentにmainブランチ限定・必須レビューを設定し、Environment変数 `AWS_DEPLOY_ROLE_ARN` へ上記スタックの同名出力 `DeployRoleArn` を登録する。このリポジトリではGitHub APIのOIDC設定を確認し、`repo:lambda-b@95673625/dashivo@1358907948:environment:production` の完全一致を使う。名前だけの旧形式やワイルドカードは許可しない。リポジトリ移転・Environment変更時は信頼設定も見直す。

ロールの直接権限は既知の4スタックのOutputs参照、Webバケットの読み書き、対象Distributionのキャッシュ無効化に限定する。CDK用には2リージョン・8個のbootstrapロール（deploy・差分確認用lookup・file/image publishing）だけを引き受けられる。ただしlookupはアカウント内の広い読み取り権限、CloudFormation実行ロールは管理者相当の権限を持つため、デプロイ権限全体がAPIだけの最小権限になるわけではない。Environment承認とmain限定は必須とし、PRにはAWS資格情報を渡さない。将来はCloudFormation実行ロール自体の権限境界も検討する。

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

続いて差分確認後に `DashivoWeb` をデプロイする。`/api/*` のみLambdaへ送り、OACは常にSigV4署名する。APIキャッシュは無効で、[Lambda URL向けの標準ポリシーAllViewerExceptHostHeader](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html#managed-origin-request-policy-all-viewer-except-host-header)を使用する。閲覧側のHostは転送せずLambdaのHostへ置き換え、その他のヘッダー・Cookie・クエリは転送する。AuthorizationはOACの署名で上書きするため、Cognitoトークンには専用ヘッダーを使用する。`x-amz-content-sha256` の個別許可リスト指定はAWSに拒否されるため、独自OriginRequestPolicyは作らない。Lambda側のリソースポリシーも上記Distributionだけを許可する。

LambdaはVPC・NATを使用しない。実行ロールはテーブルの読み取り・条件付き書き込み、CSV・生成HTML prefixのGetObject/PutObject、専用ログへの書き込みに限定する。SDKクライアントは実行環境で再利用する。HTTP本文は4,000,000バイトを上限とし、Base64化されるFunction URLイベントの6MB制限に余裕を持たせる。この制限と `Cache-Control: no-store` はローカルを含む共通サーバーで適用する。

ローカル検証はSDKモックとLambda形式のイベント、CDKテンプレートを使う。実AWSでの権限・JWT・保存動作は、APIデプロイ後に別途確認する。

## 公開後の残作業

実装・確認済みと、実Google認証や運用判断が必要な作業を [OPERATIONS.md](OPERATIONS.md) に整理する。Web/API接続、S3同期、キャッシュ無効化、未認証GET/POSTの拒否は本番で確認済み。CSPとデプロイ後の公開ブラウザーテストを追加した。認証済みCRUD・所有権分離・実LambdaでのHTML生成は、実アカウントでの確認が残る。

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

SDKモックでキー分離・競合時のエラー・トランザクションの構成・再送・ページング・認証済みサーバーとの接続を確認した。GitHub OIDCデプロイとFunction URL/OACの未認証API拒否は本番で確認済み。実Google認証後のトランザクション動作や保存用IAM権限は未検証。

## HTMLダウンロードの共通フロー

ローカルとAWSでAPIやUIを分けない。共通サービスが保存済み定義・CSV・Pythonを読み、同じVite exporterで単一HTMLを生成し、保存先へ渡して `{ "url": "..." }` を返す。画面はそのURLを開くだけで、HTMLをAPIレスポンスやブラウザーのBlobへ詰め直さない。

- ローカル：`.cache/downloads/<UUID>/<dashboard-id>.html` へ保存し、`/api/downloads/<UUID>/<dashboard-id>` で配信する。有効期限は5分。次の生成時に1日以上経過した生成物を回収する。
- AWS：非公開Downloadsバケットの `users/<検証済みsub>/dashboards/<dashboard-id>/<UUID>.html` へ保存し、5分有効の署名付きGET URLを返す。物理削除は既存の1日Lifecycleに任せる。署名URLは持っている人が期限内に使えるため、ログや通知へ出力しない。
- どちらもContent-Dispositionはattachment、生成HTMLのCache-Controlはprivate/no-store。ローカルURLも再ダウンロード可能で、期限切れには410を返す。
- 生成処理はリクエストごとの一時ディレクトリだけへ書き込み、成功・失敗ともに定義・出力・Pyodide用一時ファイルを削除する。アプリの配布領域には書き込まない。ユーザーのPythonはHTMLへ埋め込むだけで、サーバーでexecuteしない。

Viteのネイティブ依存とViewerソースを同じLinux/ARM64環境へまとめるため、`lambda/Dockerfile` を使用する。ビルド対象はコードと固定サンプルのみで、ローカルのdashboard・環境変数ファイル・node_modules・CDK出力はDocker contextから除外する。CDK synthのテストでもこの除外を検証する。実行時のVite依存は遅延importし、一般のAPIリクエストでは初期化しない。

Lambdaは2048MB・60秒、CloudFrontのorigin read timeoutも60秒。オンデマンドのままで常時起動費用を増やさない。サンプルHTMLは約20MBで、Lambdaの同期レスポンス上限を越えるためS3経由にする。追加のPythonパッケージは既存のPyodide配布元から取得するため、初回の生成時間はネットワークにも依存する。実測が制限へ近づく場合は、ローカルも含めた共通の非同期ジョブAPIを検討する。

Dockerが使用可能な環境で、デプロイ前に以下を実行する（ARM64以外ではBuildx/QEMUが必要）。

```bash
docker build --platform linux/arm64 -f infra/cdk/lambda/Dockerfile -t dashivo-api .
```

DockerのARM64実ビルド・Lambda Runtime Interface Emulatorでの起動・約20MBのHTML生成はGitHub Actionsで検証済み。実Lambdaは未認証リクエストの401まで確認済みで、認証済みHTML生成は未検証。

Dockerfileと同じ依存選択・ハンドラーのbundle・production依存への絞り込みは、隔離ディレクトリで検証した。通常のNode.jsで未認証の401応答と約20MBのHTML生成を確認したが、Amazon LinuxのイメージやLambda上の確認を代替するものではない。

実行コードからのIAM権限の自動照合には以下を使用できる。現在の環境にはuvx/pipがないため未実行。デプロイ前に生成結果を確認し、CDKの実行ロールと照合する。IAMへ自動適用するオプションは付けない。

```bash
uvx iam-policy-autopilot@latest generate-policies \
  /workspaces/dashivo/infra/cdk/lambda/handler.ts \
  /workspaces/dashivo/infra/cdk/persistence/aws-dashboard-repository.ts \
  /workspaces/dashivo/infra/cdk/persistence/aws-dashboard-download-storage.ts \
  /workspaces/dashivo/infra/cdk/lambda/google-provider.ts \
  --region ap-northeast-1 --account 154539905353 \
  --service-hints s3 dynamodb ssm cognito-idp --pretty
```

仕様確認：[CDK TableV2](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.TableV2.html)、[S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html)。

Google連携にはGoogle OAuthのクライアントIDとSecretが必要。Secretはチャット・Git・CDK contextへ載せず、AWSのSecret管理に登録する。

## Google連携の設定

Google未設定時はセルフ登録を無効にし、管理者が作成したCognitoユーザーのみがログインできる。Googleを設定すると、Hosted UIのプロバイダーはGoogleだけになる。Googleの属性はemailへマッピングし、データ所有者はemailではなくCognito `sub` とする。メールが同じユーザー同士の自動リンクは行わない。

東京リージョンのParameter Storeに登録済みの以下を使用する。`cdk.json` の `google` にはパラメータ名とバージョンだけを記載し、値は記載しない。

- Client ID: `/pisan-zapra/oauth/google/client-id`（String、version 2）
- Client Secret: `/pisan-zapra/oauth/google/client-secret`（SecureString、version 1、`alias/aws/ssm`）

CognitoのIdP設定はCloudFormationの[SecureString動的参照の対象外](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references-ssm-secure-strings.html)のため、デプロイ時だけ動くCustom ResourceでSSMから読み取り、Cognitoへ設定する。Secretはテンプレート、Custom Resourceの応答、ログ、フロントエンドへ渡さない。読み取り権限はこの2パラメータ、IdPの変更権限はこのUser Poolだけに限定する。既定のSSM管理キーを使用するため、追加のKMS権限は不要。カスタマー管理キーへ変更する場合は、そのキーの復号権限も必要。

GoogleのOAuthクライアントには `GoogleRedirectUri` 出力のURLを登録する。既存のUser PoolとApp Clientは作り直さず、Identityスタックだけを更新する。

```bash
pnpm --filter @dashivo/infra-cdk exec cdk diff DashivoIdentity --no-change-set
pnpm --filter @dashivo/infra-cdk exec cdk deploy DashivoIdentity --exclusively --require-approval broadening
```

資格情報を更新したら、`cdk.json` の対応する `version` を更新してIdentityスタックを再デプロイする。固定バージョンの参照により、更新失敗時は以前のバージョンへロールバックできる（以前のSSMバージョンは削除しない）。SSMの値を更新するだけではCognitoへ反映されない。通常のGitHubデプロイはStorage → API → Webの順で実行し、APIが参照するStorageの出力を先に反映する。Identityの更新は上記で明示的に実行する。

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
