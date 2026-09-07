import pandas as pd


def execute(data: pd.DataFrame, params: dict):
    region = params.get("region", "All")
    if region != "All":
        data = data[data["region"] == region]

    return int(data["revenue"].sum())
