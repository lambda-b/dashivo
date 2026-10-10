# Dashivo

Pythonによるデータ分析とReactのUIを、ネットワーク接続なしで直接開ける単一HTMLへまとめるダッシュボード基盤です。現在はプロジェクト計画のPhase 4（Builder）を実装しています。

## 前提条件

- Docker
- Visual Studio Code
- Dev Containers 拡張

## セットアップ

1. VSCode でこのリポジトリを開く
2. コマンドパレットから

   ```
   Dev Containers: Reopen in Container
   ```

3. 依存関係をインストールして開発サーバーを起動

   ```bash
   pnpm install
   pnpm dev
   ```

   Viteは `0.0.0.0:3030` で待ち受けます。Dev Container外からは `http://localhost:3030` を開いてください。

   各エリアの編集ボタンから右側の設定パネルを開きます。設定のプレビューと保存は独立しています。「Pythonロジックを管理」ではロジック定義・コード・確認の3領域を持つWorkbenchへ切り替わります。ロジックとCSV定義は自動保存、Pythonコードは明示的に保存します。

   画面上部の「開発用: 認証済み」は、チェックありで既存のローカルAPI（ファイル保存）、チェックなしで未認証のブラウザー保存へ切り替えます。初期状態はチェックありです。タブ単位で選択を記憶し、保存中は切り替えられません。これはローカル開発用の動作確認であり、JWT認証の代わりではありません。公開用Editorには含まれません。

   「HTMLをダウンロード」は保存済みの設定とPythonから閲覧専用の単一HTMLを生成します。EditorとViewerは明示的なビルド対象として分離されており、ViewerにはBuilderと保存APIが含まれません。開発時のAPIもHonoで動作し、ViteプラグインはHonoを開発サーバーへ接続するだけのアダプターです。現在はファイルシステムへ保存しますが、Repository実装を交換してDashboard JSONとPythonコードをDB管理へ移行できます。

## ビルド

AWS向けの配信基盤・検証手順は [infra/cdk/README.md](infra/cdk/README.md) を参照してください。CDK基盤・Cognito設定・ブラウザーの認証・APIのJWT検証を実装済みです。AWS保存先・Lambdaへの接続とサービス公開は後続の実装です。

```bash
pnpm build
```

初回ビルド時は、Pyodide公式配布物からNumPy・pandasとその依存wheelを取得し、SHA-256を検証して `.pyodide-cache/` に保存します。PyodideとPythonのアセットはgzip圧縮して一度ずつHTMLへ埋め込み、ブラウザで起動時に展開します。成果物は `dist/dashboard.html` の1ファイルです。このファイルはChrome / Edgeで直接開け、実行時のWebサーバー、ネットワーク、Node.js、Pythonを必要としません。

```bash
open dist/dashboard.html
```

公開用Editorは `pnpm build:editor` で `dist/editor/` へ生成します。Cognitoの公開設定3項目が必須です。設定方法は [AWS配信基盤の文書](infra/cdk/README.md#公開用editorのビルド) を参照してください。Editorにはローカルの定義・CSV・Pythonを埋め込みません。ローカル開発の `pnpm dev` と、ダウンロード用ViewerのCLIビルド `pnpm build` は実際のCognito認証を必要としません。

## 認証と保存先

公開用Editorはログインしなくても1件のダッシュボードを試用できます。初回は `app/client/src/sample/dashboard.json` の固定サンプルを表示します。未認証では定義・CSV・PythonをIndexedDBへ保存し、Pythonの実行はブラウザー内で行います。ログインは画面上部のボタンからCognito Hosted UIへ移動します。認証済みではユーザー専用のサーバーAPIを利用し、複数ダッシュボードの作成とHTMLのダウンロードが可能になります。

サンプルの `sales_period`（対象期間）は開始日・終了日を含めて全出力を絞り込み、`region`（営業地域）と併用できます。サンプル更新時は `previousRevisionIds` に旧版を記録し、ブラウザーに残っている未編集サンプルだけを更新します。編集済みの試用版は上書きしません。

ログインすると編集済みの試用ダッシュボードをCSV・Pythonとまとめて自動登録します。保存内容が変わったときだけ `revisionId` を更新し、同じユーザーに登録済みの版は重複登録しません。未編集サンプルは既知の版として登録対象から除外します。ログアウトして試用版を再編集した場合は、次回ログイン時に別のダッシュボードとして登録します。継続的な同期・上書きは行いません。ログアウトするとブラウザー内の試用版へ戻り、取得キャッシュは保存先・ユーザーごとに分離します。

保存先の接続は `app/client/src/storage/` にまとめています。ローカルの試用版登録はディレクトリ単位の公開で定義とソースをまとめて保存します。DynamoDB/S3 RepositoryとLambda接続は未実装です。本番Repositoryでも同じユーザー・版の登録を冪等に扱い、定義とソースを原子的に保存する契約を満たす必要があります。

検査は以下で実行します。

`pnpm check` の型検査は、必要に応じてPyodide資産を `.pyodide-cache/` に生成します。初回はパッケージの取得が発生します。

```bash
pnpm check
pnpm build
pnpm test:bundle
pnpm test:e2e
```

## ディレクトリ構成

```
.
├─ dashboard/
│  ├─ data/raw/       # ビルドへ埋め込むソースデータ
│  ├─ logic/          # Python集計ロジック
│  └─ dashboard.json  # UIとデータBindingのSchema
├─ app/
│  ├─ client/         # React UIとPython Worker
│  ├─ server/         # Hono API、サービス、HTML exporter
│  └─ shared/
│     ├─ schema/      # DashboardとHTTP APIのZod契約・URL
│     ├─ utils/       # 環境に依存しない共通関数
│     └─ vite/        # editor/viewerのVite設定・仮想モジュール・plugin
├─ infra/
│  ├─ local/          # ファイル永続化と開発サーバー連携
│  └─ cdk/            # AWS基盤・CognitoのJWT検証アダプター
├─ tests/             # unit・integration・e2e（resultsは実行結果）
└─ work/              # プロジェクト計画（Git管理外）
```

Pythonの分析処理は `dashboard/logic/` の各ファイルに `execute(inputs, params)` として記述します。`inputs` はInput IDをキーにしたDataFrameの辞書、`params` はグローバルパラメータです。DataFrameは呼び出しごとにコピーされます。CSV、Python source、組み込みの `dashivo` ライブラリはいずれもビルド時にHTMLへ埋め込まれます。

```python
from dashivo import plot

def execute(inputs, params):
    monthly = inputs["sales"].groupby("month", as_index=False)["revenue"].sum()
    fig = plot.line(monthly, x="month", y="revenue")
    fig.title("月次売上")
    fig.y_axis(format="currency", minimum=0)
    return fig
```

戻り値は `plot.line`・`bar`・`pie`・`scatter`・`table`・`metric` で作るFigureです。種類、列の対応、タイトル、書式はPython側に集約し、JSONにはロジック参照と配置だけを保持します。Workbenchでは「実行」でのみ出力を更新し、検証用パラメータは閲覧画面へ影響しません。入力CSVはコードの実行に関係なく先頭5行を確認できます。詳細は確認エリアの「ヘルプ」、入力補助はコード内の `#chart` などのスニペットを参照してください。

`app/client/src/` 内のimportは `@/` を起点にし、共有契約は `@shared/api`・`@shared/dashboard` から参照します。Node.jsからも直接読み込むserverとinfraは、workspace package名（`@dashivo/shared-schema/api`、`@dashivo/shared-schema/dashboard` など）を使います。Vite設定と仮想モジュールは `@dashivo/shared-vite` にまとめ、editorとviewerで実装を分けています。Pyodideはdevでは配布ファイルを動的に読み込み、buildでは `virtual:dashivo/pyodide-runtime` を埋め込み実装へ差し替えます。
