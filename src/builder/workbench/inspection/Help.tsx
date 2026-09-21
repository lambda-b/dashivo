import { snippets } from "@/builder/workbench/code/snippets";
export const Help = () => (
  <div className="space-y-4 p-4 text-sm">
    <h3 className="font-bold">Python API</h3>
    <pre className="overflow-auto rounded bg-stone-100 p-3">{`from dashlet import plot

def execute(inputs, params):
    data = inputs["sales"]
    fig = plot.line(data, x="date", y="revenue")
    fig.title(f"売上 - {params['region']}")
    fig.y_axis(format="currency", minimum=0)
    fig.colors("#ca2420")
    fig.legend(visible=False)
    return fig`}</pre>
    <p>executeはFigureを返します。line / bar / pie / scatter / table / metricを利用できます。</p>
    <p>
      line・barのyは列名または列名のリストです。tableのcolumn(key, label=...,
      format=...)で列書式を設定します。
    </p>
    <p>
      軸はtitle・format（auto / number / currency /
      percent）・minimum・maximumを指定できます。凡例はvisible・position（top / right / bottom /
      left）を指定できます。
    </p>
    <p>
      欠損値はnull、日付はISO形式に変換します。無限大、必要な列の欠落、数値列への文字列混入はエラーになります。
    </p>
    <p>
      #chart等を入力すると候補が表示されます。Tabで確定し、入力箇所を移動できます。Shift+Tabで戻ります。
    </p>
    {snippets.map((snippet) => (
      <div key={snippet.label}>
        <strong>
          {snippet.label} — {snippet.detail}
        </strong>
        <pre className="overflow-auto text-xs">{snippet.template}</pre>
      </div>
    ))}
  </div>
);
