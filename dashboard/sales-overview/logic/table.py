from dashivo import plot
import numpy as np
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    frame = inputs["sales"]
    region = params.get("region", "All")
    if region != "All":
        frame = frame[frame["region"] == region]

    period = params.get("sales_period", {})
    dates = pd.to_datetime(frame["date"])
    frame = frame[dates.between(period.get("from") or dates.min(), period.get("to") or dates.max())]

    summary = (
        frame.groupby("date", as_index=False)
        .agg(revenue=("revenue", "sum"), orders=("orders", "sum"))
        .sort_values("date")
    )
    summary["average_order_value"] = np.divide(
        summary["revenue"], summary["orders"]
    ).round(2)

    fig = plot.table(summary)
    fig.title("日次サマリー")
    fig.column("date", label="月")
    fig.column("revenue", label="売上", format="currency")
    fig.column("orders", label="注文件数", format="number")
    fig.column("average_order_value", label="平均注文額", format="currency")
    return fig
