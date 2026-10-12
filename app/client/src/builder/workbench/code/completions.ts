import { ifNotIn, type CompletionContext } from "@codemirror/autocomplete";

// 実行や型推論は行わず、よく使うAPIの名前と呼び出し方を提示する。
const pandas = {
  DataFrame: "(data=None, index=None, columns=None) — 表データ",
  Series: "(data=None, index=None) — 列データ",
  concat: "(objs, axis=0, ignore_index=False) — データ結合",
  merge: "(left, right, how='inner', on=None) — テーブル結合",
  to_datetime: "(arg, errors='raise', format=None) — 日付変換",
  to_numeric: "(arg, errors='raise') — 数値変換",
  date_range: "(start=None, end=None, periods=None, freq=None) — 日付列",
  pivot_table: "(data, values=None, index=None, columns=None, aggfunc='mean') — ピボット集計",
  crosstab: "(index, columns, values=None, aggfunc=None) — クロス集計",
  cut: "(x, bins, labels=None) — 区間分割",
  qcut: "(x, q, labels=None) — 分位点で分割",
  isna: "(obj) — 欠損値判定",
  notna: "(obj) — 非欠損判定",
  NA: "欠損値",
  NaT: "日付の欠損値",
  Timestamp: "(ts_input) — 日時",
  Timedelta: "(value, unit=None) — 時間差",
};

const numpy = {
  array: "(object, dtype=None) — 配列作成",
  asarray: "(a, dtype=None) — 配列変換",
  arange: "([start,] stop[, step]) — 等間隔の値",
  linspace: "(start, stop, num=50) — 等分割",
  zeros: "(shape, dtype=float) — ゼロ配列",
  ones: "(shape, dtype=float) — 1の配列",
  full: "(shape, fill_value) — 値で埋めた配列",
  where: "(condition, x, y) — 条件分岐",
  select: "(condlist, choicelist, default=0) — 複数条件分岐",
  divide: "(x1, x2) — 除算",
  clip: "(a, a_min, a_max) — 上下限",
  round: "(a, decimals=0) — 丸め",
  sum: "(a, axis=None) — 合計",
  mean: "(a, axis=None) — 平均",
  median: "(a, axis=None) — 中央値",
  std: "(a, axis=None, ddof=0) — 標準偏差",
  var: "(a, axis=None, ddof=0) — 分散",
  min: "(a, axis=None) — 最小値",
  max: "(a, axis=None) — 最大値",
  percentile: "(a, q, axis=None) — パーセンタイル",
  quantile: "(a, q, axis=None) — 分位点",
  nanmean: "(a, axis=None) — 欠損を除いた平均",
  nansum: "(a, axis=None) — 欠損を除いた合計",
  isnan: "(x) — NaN判定",
  isfinite: "(x) — 有限値判定",
  unique: "(ar, return_counts=False) — 一意な値",
  concatenate: "(arrays, axis=0) — 配列結合",
  sqrt: "(x) — 平方根",
  log: "(x) — 自然対数",
  exp: "(x) — 指数関数",
  abs: "(x) — 絶対値",
  nan: "数値の欠損値",
  inf: "無限大",
};

const data = {
  groupby: "(by, as_index=True, dropna=True) — グループ化",
  agg: "(func=None, **kwargs) — 集計",
  transform: "(func) — 元の形を保つ集計",
  merge: "(right, how='inner', on=None) — テーブル結合",
  join: "(other, on=None, how='left') — インデックス結合",
  pivot_table: "(values=None, index=None, columns=None, aggfunc='mean') — ピボット集計",
  melt: "(id_vars=None, value_vars=None) — 縦持ち変換",
  sort_values: "(by, ascending=True) — 並べ替え",
  sort_index: "(ascending=True) — インデックス順",
  reset_index: "(drop=False) — インデックス解除",
  set_index: "(keys) — インデックス設定",
  rename: "(columns=None, index=None) — 名前変更",
  assign: "(**kwargs) — 列の追加",
  query: "(expr) — 条件式による抽出",
  drop: "(labels=None, columns=None) — 行・列の削除",
  drop_duplicates: "(subset=None, keep='first') — 重複除去",
  duplicated: "(subset=None, keep='first') — 重複判定",
  dropna: "(axis=0, how='any') — 欠損行・列の除去",
  fillna: "(value) — 欠損補完",
  isna: "() — 欠損値判定",
  notna: "() — 非欠損判定",
  astype: "(dtype) — 型変換",
  isin: "(values) — 値の集合で絞り込み",
  between: "(left, right, inclusive='both') — 範囲判定（Series）",
  value_counts: "(normalize=False, dropna=True) — 値の出現数",
  nunique: "(dropna=True) — 一意な値の数",
  sum: "() — 合計",
  mean: "() — 平均",
  median: "() — 中央値",
  min: "() — 最小値",
  max: "() — 最大値",
  count: "() — 非欠損件数",
  std: "(ddof=1) — 標準偏差",
  round: "(decimals=0) — 丸め",
  cumsum: "() — 累計",
  diff: "(periods=1) — 差分",
  pct_change: "(periods=1) — 変化率",
  rolling: "(window, min_periods=None) — 移動窓",
  shift: "(periods=1) — 値のシフト",
  apply: "(func) — 関数適用",
  map: "(arg) — 値の変換",
  copy: "(deep=True) — コピー",
  head: "(n=5) — 先頭行",
  tail: "(n=5) — 末尾行",
  to_dict: "(orient='dict') — 辞書変換",
  to_numpy: "() — NumPy配列変換",
  columns: "列名",
  index: "インデックス",
  shape: "行数・列数",
  dtypes: "列の型",
  empty: "空データ判定",
  loc: "[rows, columns] — ラベルによる選択",
  iloc: "[rows, columns] — 位置による選択",
};

const plot = {
  line: "(data, x=..., y=...) — 折れ線グラフ",
  bar: "(data, x=..., y=...) — 棒グラフ",
  pie: "(data, name=..., value=...) — 円グラフ",
  scatter: "(data, x=..., y=...) — 散布図",
  table: "(data, columns=None) — テーブル",
  metric: "(value, columns=1, format='number', emphasis='accent') — 数値または表示名→値の辞書",
};

const figure = {
  title: "(title) — タイトル",
  x_axis: "(**options) — 横軸書式",
  y_axis: "(**options) — 縦軸書式",
  colors: "(*colors) — 系列色",
  legend: "(visible=True, position='bottom') — 凡例",
  grid: "(visible=True) — 目盛線",
  column: "(key, label=None, format=None) — 列書式",
};

const catalogs = Object.fromEntries(
  Object.entries({ pandas, numpy, data, plot, figure }).map(([name, entries]) => [
    name,
    Object.entries(entries).map(([label, detail]) => ({
      label,
      detail,
      type: detail.startsWith("(") ? "function" : "property",
      info: name === "data" ? "pandasの候補です。変数の型推論は行っていません。" : undefined,
    })),
  ]),
);

export const completeLibraries = ifNotIn(
  ["String", "FormatString", "Comment"],
  (context: CompletionContext) => {
    const word = context.matchBefore(/\w*$/);
    if (!word || word.from === 0 || context.state.sliceDoc(word.from - 1, word.from) !== ".")
      return null;

    const receiver = context.matchBefore(/\w+\.\w*$/)?.text.split(".")[0] ?? "";
    const aliases: Record<string, string> = {
      pd: "pandas",
      pandas: "pandas",
      np: "numpy",
      numpy: "numpy",
      plot: "plot",
      fig: "figure",
    };
    for (const match of context.state.doc
      .toString()
      .matchAll(/\bimport\s+(pandas|numpy)\s+as\s+(\w+)/g)) {
      aliases[match[2]] = match[1];
    }

    return {
      from: word.from,
      options: catalogs[aliases[receiver] ?? "data"],
      validFor: /^\w*$/,
    };
  },
);
