# Dashlet

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

   開発画面右下の「Builderを開く」からDashboardの基本情報とRadio Controlを編集できます。Zodによる検証に成功したSchemaだけがプレビューへ反映され、編集結果は `dashboard.json` として保存できます。Builderは開発時専用で、本番成果物には含まれません。

## ビルド

```bash
pnpm build
```

初回ビルド時は、Pyodide公式配布物からNumPy・pandasとその依存wheelを取得し、SHA-256を検証して `.pyodide-cache/` に保存します。成果物は `dist/dashboard.html` の1ファイルです。このファイルはChrome / Edgeで直接開け、実行時のWebサーバー、ネットワーク、Node.js、Pythonを必要としません。

```bash
open dist/dashboard.html
```

検査は以下で実行します。

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
├─ scripts/           # Pyodide asset収集
├─ src/               # React UIとPython Worker
├─ vite/
│  ├─ plugins/        # Dashlet固有のVite plugin
│  └─ virtual/        # serve/buildで差し替えるvirtual module実装
├─ work/              # プロジェクト計画（Git管理外）
└─ vite.config.ts     # 単一HTML packaging
```

Pythonの分析処理は `dashboard/logic/analysis.py` の `execute(params)` に記述します。`dashboard/data/raw/` のCSVとPython sourceはいずれもビルド時にHTMLへ埋め込まれます。

`src/` 内のimportは `@/` を起点にします。Pyodideはdevでは配布ファイルを動的に読み込み、buildでは `virtual:dashlet/pyodide-runtime` を埋め込み実装へ差し替えます。
