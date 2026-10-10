from dashivo import plot
import pandas as pd


def execute(inputs: dict[str, pd.DataFrame], params: dict):
    frame = inputs["logins"]
    platform = params.get("platform", "all")
    if platform != "all":
        frame = frame[frame["platform"] == platform]

    period = params.get("login_period", {})
    dates = pd.to_datetime(frame["date"])
    frame = frame[dates.between(period.get("from") or dates.min(), period.get("to") or dates.max())]

    fig = plot.metric(int(frame["failed_logins"].sum()))
    fig.title("ログイン失敗件数")
    return fig
