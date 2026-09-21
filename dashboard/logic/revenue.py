from dashlet import plot
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    data = inputs["sales"]
    region = params.get("region", "All")
    if region != "All":
        data = data[data["region"] == region]

    return plot.metric(int(data["revenue"].sum()), format="currency", emphasis="strong").title("売上")
