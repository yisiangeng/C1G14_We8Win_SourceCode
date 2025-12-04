# predictor.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

def train_forecast_model(df):
    df = df.copy()
    df['Daily_energy_kWh'] = df['Global_active_power'] * 24

    # Features
    df['day_of_week'] = df.index.weekday
    df['month'] = df.index.month

    for lag in range(1, 8):
        df[f'lag_{lag}'] = df['Daily_energy_kWh'].shift(lag)

    df = df.dropna()

    # Only numeric columns for X
    feature_cols = ['day_of_week', 'month'] + [f'lag_{i}' for i in range(1, 8)]
    X = df[feature_cols]
    y = df['Daily_energy_kWh']

    split = int(len(X)*0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    model = RandomForestRegressor(n_estimators=300, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print("MAE (kWh/day):", mae)

    def predict_next_7_days():
        last_row = df.iloc[-1:].copy()
        future_predictions = []
        future_dates = []

        for i in range(1, 8):
            next_date = df.index[-1] + pd.Timedelta(days=i)
            future_dates.append(next_date)

            new_row = last_row.copy()
            for lag in range(1, 8):
                if lag == 1:
                    new_row[f'lag_{lag}'] = last_row['Daily_energy_kWh'].values[0]
                else:
                    new_row[f'lag_{lag}'] = last_row[f'lag_{lag-1}'].values[0]

            new_row['day_of_week'] = next_date.weekday()
            new_row['month'] = next_date.month

            # Only numeric columns for prediction
            pred_features = new_row[feature_cols]
            pred = model.predict(pred_features)[0]
            future_predictions.append(pred)

            new_row['Daily_energy_kWh'] = pred
            last_row = new_row.copy()

        forecast_df = pd.DataFrame({
            'Date': future_dates,
            'Predicted_Daily_Energy_kWh': future_predictions
        })
        return forecast_df

    return predict_next_7_days
