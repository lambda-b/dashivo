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

    fig = plot.line(summary, x="date", y="revenue")
    fig.title("日次売上")
    fig.legend(visible=False)
    fig.y_axis(format="number")
    return fig
