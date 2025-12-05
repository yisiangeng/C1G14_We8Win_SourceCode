# predictor.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

class EnergyPredictor:
    def __init__(self, df):
       
        self.df = df.copy()
        self.daily_df = None
        self.model = None
        self._prepare_data()
        self._train_model()

    def _prepare_data(self):
        # Resample to daily mean
        daily_df = self.df['Global_active_power'].resample('D').mean().to_frame()
        daily_df['Daily_energy_kWh'] = daily_df['Global_active_power'] * 24

        # Feature engineering
        daily_df['day_of_week'] = daily_df.index.weekday
        daily_df['month'] = daily_df.index.month
        for lag in range(1, 8):
            daily_df[f'lag_{lag}'] = daily_df['Daily_energy_kWh'].shift(lag)

        daily_df.dropna(inplace=True)
        self.daily_df = daily_df

    def _train_model(self):
        X = self.daily_df.drop(['Global_active_power','Daily_energy_kWh'], axis=1)
        y = self.daily_df['Daily_energy_kWh']

        split = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        model = RandomForestRegressor(n_estimators=300, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        print("MAE (kWh/day):", mae)

        self.model = model

    def predict_next_7_days(self, start_date=None):
        """
        Predict next 7 days starting from the last row or a given start_date.

        start_date: str or pd.Timestamp, optional
            If provided, forecast starts from this date.
        """
        if self.model is None:
            raise ValueError("Model is not trained yet.")

        df = self.daily_df.copy()

        # Determine starting point
        if start_date:
            start_dt = pd.to_datetime(start_date)
            if start_dt > df.index[-1]:
                raise ValueError("start_date is beyond the last available data")
            last_row = df[df.index <= start_dt].iloc[-1:].copy()
        else:
            last_row = df.iloc[-1:].copy()

        future_predictions = []
        future_dates = []

        for i in range(1, 8):
            next_date = last_row.index[0] + pd.Timedelta(days=i)
            future_dates.append(next_date)

            new_row = last_row.copy()
            # Update lag features
            for lag in range(1, 8):
                if lag == 1:
                    new_row[f'lag_{lag}'] = last_row['Daily_energy_kWh'].values[0]
                else:
                    new_row[f'lag_{lag}'] = last_row[f'lag_{lag-1}'].values[0]

            new_row['day_of_week'] = next_date.weekday()
            new_row['month'] = next_date.month

            pred_features = new_row.drop(['Global_active_power','Daily_energy_kWh'], axis=1)
            pred = self.model.predict(pred_features)[0]
            future_predictions.append(pred)

            new_row['Daily_energy_kWh'] = pred
            last_row = new_row.copy()

        forecast_df = pd.DataFrame({
            'Date': future_dates,
            'Predicted_Daily_Energy_kWh': future_predictions
        })

        # Summary info: lowest & highest day
        min_idx = np.argmin(future_predictions)
        max_idx = np.argmax(future_predictions)
        forecast_summary = {
            "forecast": forecast_df,
            "lowest_day": forecast_df.iloc[min_idx],
            "highest_day": forecast_df.iloc[max_idx]
        }

        return forecast_summary

class HourlyEnergyPredictor:
    def __init__(self, df):
        self.df = df.copy()
        self.hourly_df = None
        self.model = None
        self._prepare_data()
        self._train_model()

    def _prepare_data(self):
        df = self.df
        df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], dayfirst=True)
        df = df.set_index('datetime')
        df['Global_active_power'] = pd.to_numeric(df['Global_active_power'], errors='coerce')
        df = df.dropna(subset=['Global_active_power'])

        # Hourly resample
        hourly_df = df['Global_active_power'].resample('h').mean().to_frame()
        hourly_df['Hourly_energy_kWh'] = hourly_df['Global_active_power'] * 1

        # Feature engineering
        hourly_df['hour'] = hourly_df.index.hour
        hourly_df['day'] = hourly_df.index.day
        hourly_df['weekday'] = hourly_df.index.weekday
        hourly_df['month'] = hourly_df.index.month

        # Lag features (past 24 hours)
        for lag in range(1, 25):
            hourly_df[f'lag_{lag}'] = hourly_df['Hourly_energy_kWh'].shift(lag)

        self.hourly_df = hourly_df.dropna()

    def _train_model(self):
        X = self.hourly_df.drop(['Global_active_power', 'Hourly_energy_kWh'], axis=1)
        y = self.hourly_df['Hourly_energy_kWh']

        split = int(len(X) * 0.9)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        self.model = RandomForestRegressor(n_estimators=300, random_state=42)
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        print("MAE (kWh/hour):", mean_absolute_error(y_test, y_pred))

    def predict_next_24_hours(self):
        last_row = self.hourly_df.iloc[-1:].copy()
        future_predictions = []
        future_hours = []

        for i in range(1, 25):
            next_time = last_row.index[0] + pd.Timedelta(hours=i)
            future_hours.append(next_time)

            new_row = last_row.copy()
            for lag in range(1, 25):
                new_row[f'lag_{lag}'] = last_row[f'lag_{lag-1}'].values[0] if lag > 1 else last_row['Hourly_energy_kWh'].values[0]

            new_row['hour'] = next_time.hour
            new_row['day'] = next_time.day
            new_row['weekday'] = next_time.weekday()
            new_row['month'] = next_time.month

            pred = self.model.predict(new_row.drop(['Global_active_power', 'Hourly_energy_kWh'], axis=1))[0]
            future_predictions.append(pred)
            new_row['Hourly_energy_kWh'] = pred
            last_row = new_row.copy()

        forecast_df = pd.DataFrame({
            'Date': future_hours,
            'Predicted_Hourly_Energy_kWh': future_predictions
        })

        min_idx = np.argmin(future_predictions)
        max_idx = np.argmax(future_predictions)

        return {
            "forecast": forecast_df,
            "lowest_hour": forecast_df.iloc[min_idx],
            "highest_hour": forecast_df.iloc[max_idx]
        }

class EfficiencyForecast24H:
    def __init__(self, df, rf_active, rf_reactive, power_hourly):
        self.df = df
        self.rf_active = rf_active
        self.rf_reactive = rf_reactive
        self.power_hourly = power_hourly

    def predict_next_24h(self):
        future_predictions = []

        last_data = self.df.iloc[-1:].copy()

        for i in range(24):

            features = last_data[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]

            pred_active = self.rf_active.predict(features)[0]
            pred_reactive = self.rf_reactive.predict(features)[0]

            pf = pred_active / np.sqrt(pred_active**2 + pred_reactive**2)

            future_predictions.append([pred_active, pred_reactive, pf])

            # update lags
            last_data["lag_48"] = last_data["lag_24"]
            last_data["lag_24"] = last_data["lag_2"]
            last_data["lag_2"] = last_data["lag_1"]
            last_data["lag_1"] = pred_active

            next_time = last_data.index[0] + pd.Timedelta(hours=1)
            last_data.index = [next_time]
            last_data["hour"] = next_time.hour
            last_data["dayofweek"] = next_time.dayofweek

        # Build DF
        future_index = pd.date_range(
            start=self.power_hourly.index[-1] + pd.Timedelta(hours=1),
            periods=24,
            freq="h"
        )

        forecast_df = pd.DataFrame(
            future_predictions,
            columns=["Active_power_pred", "Reactive_power_pred", "Power_factor_pred"],
            index=future_index
        )

        return forecast_df

class EfficiencyForecast7D:
    def __init__(self, df, rf_active, rf_reactive, power_hourly):
        self.df = df
        self.rf_active = rf_active
        self.rf_reactive = rf_reactive
        self.power_hourly = power_hourly

    def predict_next_7d(self):
        future_predictions = []

        last_data = self.df.iloc[-1:].copy()

        for i in range(168):  # 7 days * 24 hours
            features = last_data[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]

            pred_active = self.rf_active.predict(features)[0]
            pred_reactive = self.rf_reactive.predict(features)[0]

            pf = pred_active / np.sqrt(pred_active**2 + pred_reactive**2)

            future_predictions.append([pred_active, pred_reactive, pf])

            # update lag features
            last_data["lag_48"] = last_data["lag_24"]
            last_data["lag_24"] = last_data["lag_2"]
            last_data["lag_2"] = last_data["lag_1"]
            last_data["lag_1"] = pred_active

            next_time = last_data.index[0] + pd.Timedelta(hours=1)
            last_data.index = [next_time]
            last_data["hour"] = next_time.hour
            last_data["dayofweek"] = next_time.dayofweek

        future_index = pd.date_range(
            start=self.power_hourly.index[-1] + pd.Timedelta(hours=1),
            periods=168,
            freq="h"
        )

        forecast_df = pd.DataFrame(
            future_predictions,
            columns=["Active_power_pred", "Reactive_power_pred", "Power_factor_pred"],
            index=future_index
        )

        return forecast_df
