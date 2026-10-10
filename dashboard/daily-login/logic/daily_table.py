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

    daily = (
        frame.groupby("date", as_index=False)
        .agg(successful_logins=("successful_logins", "sum"), failed_logins=("failed_logins", "sum"))
        .sort_values("date")
    )

    attempts = daily["successful_logins"] + daily["failed_logins"]
    daily["failure_rate"] = daily["failed_logins"].div(attempts.where(attempts > 0)).fillna(0).mul(100).round(2)

    fig = plot.table(daily)
    fig.title("日別ログイン集計")
    fig.column("date", label="日付")
    fig.column("successful_logins", label="成功件数", format="number")
    fig.column("failed_logins", label="失敗件数", format="number")
    fig.column("failure_rate", label="失敗率（%）", format="number")
    return fig
