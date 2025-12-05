# ==========================================
# 1. Import libraries
# ==========================================

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor


# ==========================================
# 2. Load dataset
# ==========================================

data = pd.read_excel(r"C:\Users\LeYu267\Documents\Adrian\SDG Hackathon\C1G14_We8Win_SourceCode\ML\household_power_cleaned.xlsx")


# ==========================================
# 3. Create datetime column
# ==========================================

data["datetime"] = pd.to_datetime(
    data["Date"] + " " + data["Time"],
    dayfirst=True
)

data = data.drop(columns=["Date", "Time"])
data = data.sort_values("datetime")
data = data.set_index("datetime")


# ==========================================
# 4. Create Power Factor
# ==========================================

data["p_factor"] = data["Global_active_power"] / np.sqrt(
    data["Global_active_power"]**2 +
    data["Global_reactive_power"]**2
)

data["p_factor"] = data["p_factor"].replace([np.inf, -np.inf], np.nan)
data["p_factor"] = data["p_factor"].interpolate()


# ==========================================
# 5. Resample to hourly
# ==========================================

power_hourly = data.resample("h").mean()


# ==========================================
# 6. Recalculate power factor after resampling
# ==========================================

power_hourly["p_factor"] = power_hourly["Global_active_power"] / np.sqrt(
    power_hourly["Global_active_power"]**2 +
    power_hourly["Global_reactive_power"]**2
)

power_hourly["p_factor"] = power_hourly["p_factor"].replace([np.inf, -np.inf], np.nan)
power_hourly["p_factor"] = power_hourly["p_factor"].interpolate()


# ==========================================
# 7. Create time series features for ML
# ==========================================

df = power_hourly.copy()

# Lag features (past values of active power)
df["lag_1"] = df["Global_active_power"].shift(1)
df["lag_2"] = df["Global_active_power"].shift(2)
df["lag_24"] = df["Global_active_power"].shift(24)
df["lag_48"] = df["Global_active_power"].shift(48)

# Time features
df["hour"] = df.index.hour
df["dayofweek"] = df.index.dayofweek

# Remove rows with NA from lagging
df = df.dropna()


# ==========================================
# 8. Feature matrix and targets (use ALL data)
# ==========================================

X = df[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]
y_active = df["Global_active_power"]
y_reactive = df["Global_reactive_power"]


# ==========================================
# 9. Train Random Forest models on full data
# ==========================================

rf_active = RandomForestRegressor(n_estimators=200, random_state=42)
rf_reactive = RandomForestRegressor(n_estimators=200, random_state=42)

rf_active.fit(X, y_active)
rf_reactive.fit(X, y_reactive)


# ==========================================
# 10. Predict NEXT 24 HOURS
# ==========================================

future_predictions = []

# Start from the last available row
last_data = df.iloc[-1:].copy()

for i in range(24):

    features = last_data[["lag_1", "lag_2", "lag_24", "lag_48", "hour", "dayofweek"]]

    # Predict active and reactive power
    pred_active = rf_active.predict(features)[0]
    pred_reactive = rf_reactive.predict(features)[0]

    # Compute power factor
    pf = pred_active / np.sqrt(pred_active**2 + pred_reactive**2)

    future_predictions.append([pred_active, pred_reactive, pf])

    # Update lag features for next step
    last_data["lag_48"] = last_data["lag_24"]
    last_data["lag_24"] = last_data["lag_2"]
    last_data["lag_2"] = last_data["lag_1"]
    last_data["lag_1"] = pred_active

    # Move time forward by 1 hour
    next_time = last_data.index[0] + pd.Timedelta(hours=1)
    last_data.index = [next_time]
    last_data["hour"] = next_time.hour
    last_data["dayofweek"] = next_time.dayofweek


# ==========================================
# 11. Build 24-hour forecast DataFrame
# ==========================================

future_index = pd.date_range(
    start=power_hourly.index[-1] + pd.Timedelta(hours=1),
    periods=24,
    freq="h"
)

forecast_next24 = pd.DataFrame(
    future_predictions,
    columns=["Active_power_pred", "Reactive_power_pred", "Power_factor_pred"],
    index=future_index
)

# ==========================================
# 12. OUTPUT: Next 24 hours predictions
# ==========================================

print("\n✅ RANDOM FOREST – NEXT 24 HOURS FORECAST:\n")
print(forecast_next24)