import { snippets } from "@/builder/workbench/code/snippets";

export const Help = () => (
  <div className="m-5 space-y-4 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-5 text-stone-600">
    <h3 className="text-sm font-bold text-stone-700">Python API</h3>
    <pre className="overflow-auto rounded-md bg-stone-50 p-3 font-mono text-[0.6875rem]">{`from dashivo import plot

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
      metricは数値1つ、または表示名をキーとした数値の辞書を受け取ります。
      columnsは既定で1（縦並び）、2なら横並びです。formatとemphasisは全カードに共通です。
    </p>
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
    <p>
      pd.・np.で主要API、plot.・fig.でFigure APIの候補と呼び出し方を表示します。
      変数やキーワードも補完します。その他の変数のドット以降にはpandasの候補を提示しますが、型推論は行いません。
      Ctrl+Spaceでも補完を開けます。
    </p>
    {snippets.map((snippet) => (
      <div className="rounded-md border border-stone-200 p-3" key={snippet.label}>
        <strong>
          {snippet.label} — {snippet.detail}
        </strong>
        <pre className="overflow-auto text-xs">{snippet.template}</pre>
      </div>
    ))}
  </div>
);
