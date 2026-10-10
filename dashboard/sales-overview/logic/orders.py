from dashivo import plot
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    data = inputs["sales"]
    region = params.get("region", "All")
    if region != "All":
        data = data[data["region"] == region]

    period = params.get("sales_period", {})
    dates = pd.to_datetime(data["date"])
    data = data[dates.between(period.get("from") or dates.min(), period.get("to") or dates.max())]

    fig = plot.metric(int(data["orders"].sum()), format="number", emphasis="accent")
    fig.title("注文件数")
    return fig
