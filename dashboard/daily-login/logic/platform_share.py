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

    summary = frame.groupby("platform", as_index=False).agg(logins=("successful_logins", "sum"))
    summary["platform"] = summary["platform"].replace({"web": "Web", "mobile": "モバイル"})

    fig = plot.pie(summary, name="platform", value="logins")
    fig.title("ログイン成功件数の端末別内訳")
    return fig
