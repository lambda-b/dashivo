import { useEffect, useState } from "react";
import clsx from "clsx";
import { executePython } from "./python-client";

type Region = "All" | "East" | "West";

interface AnalysisResult {
  runtime: { python: string; pandas: string; numpy: string };
  summary: Array<{
    date: string;
    revenue: number;
    orders: number;
    average_order_value: number;
  }>;
  totals: { revenue: number; orders: number };
}

const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default function App() {
  const [region, setRegion] = useState<Region>("All");
  const [result, setResult] = useState<AnalysisResult>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    executePython<AnalysisResult>({ region })
      .then((value) => active && setResult(value))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [region]);

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">PHASE 1 · OFFLINE RUNTIME</p>
          <h1>Dashlet</h1>
          <p className="lede">Pythonの分析を、ブラウザだけで動くひとつのダッシュボードへ。</p>
        </div>
        <span
          className={clsx(
            "status",
            loading ? "status-loading" : error ? "status-error" : "status-ready",
          )}
        >
          <i /> {loading ? "Pythonを準備中" : error ? "実行エラー" : "オフライン実行中"}
        </span>
      </header>

      <section className="controls" aria-label="絞り込み条件">
        <span>営業地域</span>
        <div className="segmented">
          {(["All", "East", "West"] as const).map((value) => (
            <button
              className={clsx(region === value && "selected")}
              key={value}
              onClick={() => setRegion(value)}
              type="button"
            >
              {value === "All" ? "すべて" : value}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <section className="error" role="alert">
          <strong>Pythonの実行に失敗しました</strong>
          <pre>{error}</pre>
        </section>
      ) : (
        <>
          <section className="metrics" aria-busy={loading}>
            <article>
              <span>売上</span>
              <strong>{result ? currency.format(result.totals.revenue) : "—"}</strong>
            </article>
            <article>
              <span>注文件数</span>
              <strong>{result?.totals.orders.toLocaleString("ja-JP") ?? "—"}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PANDAS GROUPBY</p>
                <h2>月次サマリー</h2>
              </div>
              {result && (
                <small>
                  Python {result.runtime.python} · pandas {result.runtime.pandas} · NumPy{" "}
                  {result.runtime.numpy}
                </small>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>月</th>
                    <th>売上</th>
                    <th>注文件数</th>
                    <th>平均注文額</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.summary.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{currency.format(row.revenue)}</td>
                      <td>{row.orders.toLocaleString("ja-JP")}</td>
                      <td>{currency.format(row.average_order_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="loading-overlay">WASMを読み込んでいます…</div>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
