from dashlet import plot
import numpy as np
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    frame = inputs["sales"]
    region = params.get("region", "All")
    if region != "All":
        frame = frame[frame["region"] == region]

    summary = (
        frame.groupby("date", as_index=False)
        .agg(revenue=("revenue", "sum"), orders=("orders", "sum"))
        .sort_values("date")
    )
    summary["average_order_value"] = np.divide(
        summary["revenue"], summary["orders"]
    ).round(2)

    return (plot.table(summary).title("月次サマリー")
            .column("date", label="月")
            .column("revenue", label="売上", format="currency")
            .column("orders", label="注文件数", format="number")
            .column("average_order_value", label="平均注文額", format="currency"))
