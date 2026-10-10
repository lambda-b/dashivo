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

    fig = plot.line(daily, x="date", y=["successful_logins", "failed_logins"])
    fig.title("日別ログイン件数")
    fig.x_axis(title="日付")
    fig.y_axis(title="件数", format="number", minimum=0)
    return fig
