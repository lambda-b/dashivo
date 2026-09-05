import io

import numpy as np
import pandas as pd


def execute(params):
    frame = pd.read_csv(io.StringIO(params["csv"]))
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

    return {
        "runtime": {
            "python": __import__("sys").version.split()[0],
            "pandas": pd.__version__,
            "numpy": np.__version__,
        },
        "summary": summary.to_dict(orient="records"),
        "totals": {
            "revenue": int(summary["revenue"].sum()),
            "orders": int(summary["orders"].sum()),
        },
    }
