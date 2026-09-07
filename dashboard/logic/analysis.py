import numpy as np
import pandas as pd


def execute(data: pd.DataFrame, params: dict):
    frame = data
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

    return summary.to_dict(orient="records")
