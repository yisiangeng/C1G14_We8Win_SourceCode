import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

def build_features(power_hourly):
    df = power_hourly.copy()

    # Lag features
    df["lag_1"] = df["Global_active_power"].shift(1)
    df["lag_2"] = df["Global_active_power"].shift(2)
    df["lag_24"] = df["Global_active_power"].shift(24)
    df["lag_48"] = df["Global_active_power"].shift(48)

    # Time features
    df["hour"] = df.index.hour
    df["dayofweek"] = df.index.dayofweek

    df = df.dropna()
    return df

class EfficiencyForecast24H:
    def __init__(self, df):
        """
        df → cleaned dataframe from loader.load_data()
        """
        self.df = df
        # Keep only numeric columns before resampling
        df_numeric = df.select_dtypes(include=[np.number])

        # Hourly aggregation
        self.power_hourly = df_numeric.resample("h").mean()

        # Step 2: power factor
        self.power_hourly["p_factor"] = self.power_hourly["Global_active_power"] / np.sqrt(
            self.power_hourly["Global_active_power"] ** 2 +
            self.power_hourly["Global_reactive_power"] ** 2
        )
        self.power_hourly["p_factor"] = self.power_hourly["p_factor"].replace([np.inf, -np.inf], np.nan).interpolate()

        self.power_hourly = self.power_hourly

        # Step 3: build ML features
        self.feature_df = build_features(self.power_hourly)

        # Step 4: train models
        X = self.feature_df[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]
        y_active = self.feature_df["Global_active_power"]
        y_reactive = self.feature_df["Global_reactive_power"]

        self.rf_active = RandomForestRegressor(n_estimators=200, random_state=42)
        self.rf_reactive = RandomForestRegressor(n_estimators=200, random_state=42)

        self.rf_active.fit(X, y_active)
        self.rf_reactive.fit(X, y_reactive)

    def predict_next_24_hours(self):
        last_data = self.feature_df.iloc[-1:].copy()
        future_predictions = []

        for _ in range(24):
            features = last_data[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]

            pred_active = self.rf_active.predict(features)[0]
            pred_reactive = self.rf_reactive.predict(features)[0]

            pf = pred_active / np.sqrt(pred_active ** 2 + pred_reactive ** 2)

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
    def __init__(self, df):
        """
        df → cleaned dataframe from loader.load_data()
        """
        self.df = df.copy()
        
        # Use only numeric columns
        numeric_df = df.select_dtypes(include=['number'])
        
        # Resample to daily
        daily = numeric_df.resample("D").mean()
        
        # Calculate daily efficiency (power factor)
        daily["p_factor"] = daily["Global_active_power"] / np.sqrt(
            daily["Global_active_power"] ** 2 + daily["Global_reactive_power"] ** 2
        )
        daily["p_factor"] = daily["p_factor"].replace([np.inf, -np.inf], np.nan).interpolate()
        
        self.daily = daily.dropna(subset=["p_factor"])
        
        # Feature engineering for ML
        self.daily["lag_1"] = self.daily["p_factor"].shift(1)
        self.daily["lag_2"] = self.daily["p_factor"].shift(2)
        self.daily["lag_3"] = self.daily["p_factor"].shift(3)
        self.daily["dayofweek"] = self.daily.index.dayofweek
        
        self.daily = self.daily.dropna()
        
        # Features & target
        self.X = self.daily[["lag_1", "lag_2", "lag_3", "dayofweek"]]
        self.y = self.daily["p_factor"]
        
        # Train Random Forest
        self.model = RandomForestRegressor(n_estimators=200, random_state=42)
        self.model.fit(self.X, self.y)
    
    def predict_next_7_days(self):
        last_row = self.daily.iloc[-1:].copy()
        future_predictions = []
        future_dates = []

        for i in range(7):
            features = last_row[["lag_1", "lag_2", "lag_3", "dayofweek"]]
            pred = self.model.predict(features)[0]

            # Clip to 0-1 to ensure efficiency is realistic
            pred = np.clip(pred, 0, 1)
            
            future_predictions.append(pred)
            
            # Prepare next row for rolling prediction
            next_date = last_row.index[0] + pd.Timedelta(days=1)
            future_dates.append(next_date)
            
            new_row = last_row.copy()
            new_row["lag_3"] = new_row["lag_2"]
            new_row["lag_2"] = new_row["lag_1"]
            new_row["lag_1"] = pred
            new_row["dayofweek"] = next_date.dayofweek
            new_row.index = [next_date]
            last_row = new_row

        forecast_df = pd.DataFrame({
            "Predicted_Efficiency": future_predictions
        }, index=future_dates)
        
        return forecast_df