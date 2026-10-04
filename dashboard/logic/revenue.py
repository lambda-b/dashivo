from dashivo import plot
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    data = inputs["sales"]
    region = params.get("region", "All")
    if region != "All":
        data = data[data["region"] == region]

    fig = plot.metric(int(data["revenue"].sum()), format="currency", emphasis="strong")
    fig.title("売上")
    return fig
