import numpy as np
from sklearn.linear_model import LinearRegression


def forecast_next_hours(historical_values: list[float], hours_ahead: int = 6) -> tuple[list[float], str]:
    """
    Fit a simple linear regression on historical hourly readings and
    predict the next N hours. Returns (predictions, trend_label).

    This is intentionally simple (linear trend, not a full time-series model)
    since the goal is directionally-useful forecasting for a decision-support
    tool, not scientific-grade prediction.
    """
    if len(historical_values) < 2:
        # Not enough data to fit a trend — just repeat the last known value
        last = historical_values[-1] if historical_values else 0.0
        return [last] * hours_ahead, "stable"

    X = np.arange(len(historical_values)).reshape(-1, 1)
    y = np.array(historical_values)

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.arange(len(historical_values), len(historical_values) + hours_ahead).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Clip to realistic bounds (AQI can't go negative)
    predictions = np.clip(predictions, 0, None)

    slope = model.coef_[0]
    if slope > 1.5:
        trend = "worsening"
    elif slope < -1.5:
        trend = "improving"
    else:
        trend = "stable"

    return [round(float(p), 1) for p in predictions], trend