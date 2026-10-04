"""Dashivo figures: data and presentation, rendered by the browser."""

import copy
import datetime
import json
import math
import numbers

import pandas as pd


def _value(value):
    if value is None or value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, numbers.Real):
        return value.item() if hasattr(value, "item") else value
    if isinstance(value, (str, bool)):
        return value
    raise TypeError(f"Unsupported cell type: {type(value).__name__}")


def _rows(data):
    frame = data if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    if not frame.columns.is_unique or not all(isinstance(key, str) for key in frame.columns):
        raise ValueError("Column names must be unique strings")
    rows = []
    for record in frame.to_dict(orient="records"):
        row = {}
        for key, value in record.items():
            if isinstance(value, numbers.Real) and not isinstance(value, bool):
                if math.isnan(value):
                    value = None
                elif not math.isfinite(value):
                    raise ValueError(f"Column {key}: infinity is not supported")
            row[key] = _value(value)
        rows.append(row)
    return rows


class Figure:
    def __init__(self, data, view):
        self.data = data
        self.view = view

    def title(self, title):
        self.view["title"] = title
        return self

    def x_axis(self, **options):
        self.view["formatting"]["xAxis"].update(options)
        return self

    def y_axis(self, **options):
        self.view["formatting"]["yAxis"].update(options)
        return self

    def colors(self, *colors):
        self.view["formatting"]["colors"] = list(colors)
        return self

    def legend(self, **options):
        self.view["formatting"]["legend"].update(options)
        return self

    def grid(self, visible=True):
        self.view["formatting"]["gridLines"] = visible
        return self

    def column(self, key, label=None, format=None):
        columns = self.view["columns"]
        column = next((column for column in columns if column["key"] == key), None)
        if column is None:
            raise ValueError(f"Unknown column: {key}")
        if label is not None:
            column["label"] = label
        if format is not None:
            column["format"] = format
        return self

    def to_dict(self):
        return {"data": self.data, "view": copy.deepcopy(self.view)}


class _Plot:
    def _chart(self, data, chart):
        axis = {"title": "", "format": "auto", "minimum": None, "maximum": None}
        return Figure(_rows(data), {
            "type": "chart", "title": "グラフ", "chart": chart,
            "formatting": {
                "colors": ["#ca2420", "#e85d3f", "#f59e0b", "#78716c"],
                "legend": {"visible": True, "position": "bottom"},
                "gridLines": True, "xAxis": axis.copy(), "yAxis": axis.copy(),
            },
        })

    def line(self, data, *, x, y):
        return self._chart(data, {"type": "line", "x": x, "y": [y] if isinstance(y, str) else list(y)})

    def bar(self, data, *, x, y):
        return self._chart(data, {"type": "bar", "x": x, "y": [y] if isinstance(y, str) else list(y)})

    def pie(self, data, *, name, value):
        return self._chart(data, {"type": "pie", "name": name, "value": value})

    def scatter(self, data, *, x, y):
        return self._chart(data, {"type": "scatter", "x": x, "y": y})

    def table(self, data, *, columns=None):
        frame = data if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
        return Figure(_rows(frame), {
            "type": "table", "title": "テーブル",
            "columns": [{"key": key, "label": key} for key in (columns if columns is not None else frame.columns)],
        })

    def metric(self, value, *, format="number", emphasis="accent"):
        return Figure(_value(value), {
            "type": "metric", "title": "数値", "format": format, "emphasis": emphasis,
        })


plot = _Plot()


def serialize(figure):
    if not isinstance(figure, Figure):
        raise TypeError("execute(inputs, params) must return a dashivo Figure")
    return json.dumps(figure.to_dict(), allow_nan=False)
