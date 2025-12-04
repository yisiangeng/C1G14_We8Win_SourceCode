import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt

# ============================================================
# 1. LOAD DATA
# ============================================================
df = pd.read_excel(r"C:\Users\LeYu267\Documents\Adrian\SDG Hackathon\C1G14_We8Win_SourceCode\ML\household_power_cleaned.xlsx")

# Combine date + time into datetime
df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], dayfirst=True)
df = df.set_index('datetime')

# Convert Global_active_power to numeric
df['Global_active_power'] = pd.to_numeric(df['Global_active_power'], errors='coerce')
df = df.dropna(subset=['Global_active_power'])

# ============================================================
# 2. RESAMPLE TO HOURLY AVERAGE
# ============================================================
hourly_df = df['Global_active_power'].resample('h').mean().to_frame()

# Convert kW to kWh for each hour (1-hour interval)
hourly_df['Hourly_energy_kWh'] = hourly_df['Global_active_power'] * 1  # 1 kW * 1 hr = kWh

# ============================================================
# 3. FEATURE ENGINEERING
# ============================================================
hourly_df['hour'] = hourly_df.index.hour
hourly_df['day'] = hourly_df.index.day
hourly_df['weekday'] = hourly_df.index.weekday
hourly_df['month'] = hourly_df.index.month

# Lag features (past 24 hours) based on Hourly_energy_kWh
for lag in range(1, 25):
    hourly_df[f'lag_{lag}'] = hourly_df['Hourly_energy_kWh'].shift(lag)

hourly_df = hourly_df.dropna()

# ============================================================
# 4. TRAIN / TEST SPLIT
# ============================================================
X = hourly_df.drop(['Global_active_power', 'Hourly_energy_kWh'], axis=1)
y = hourly_df['Hourly_energy_kWh']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, shuffle=False, test_size=0.1
)

# ============================================================
# 5. TRAIN RANDOM FOREST MODEL
# ============================================================
rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)
predictions = rf_model.predict(X_test)

print("MAE (kWh):", mean_absolute_error(y_test, predictions))

# ============================================================
# 6. PREDICT NEXT 24 HOURS
# ============================================================
last_timestamp = hourly_df.index[-1]
last_row = hourly_df.iloc[-1:].copy()
future_predictions = []
future_hours = []

for i in range(1, 25):
    future_time = last_timestamp + pd.Timedelta(hours=i)
    future_hours.append(future_time)

    new_row = last_row.copy()

    # Update lag features
    for lag in range(1, 25):
        if lag == 1:
            new_row[f"lag_{lag}"] = last_row["Hourly_energy_kWh"].values[0]
        else:
            new_row[f"lag_{lag}"] = last_row[f"lag_{lag-1}"].values[0]

    new_row['hour'] = future_time.hour
    new_row['day'] = future_time.day
    new_row['weekday'] = future_time.weekday()
    new_row['month'] = future_time.month

    predicted_value = rf_model.predict(new_row.drop(['Global_active_power', 'Hourly_energy_kWh'], axis=1))[0]
    future_predictions.append(predicted_value)

    new_row['Hourly_energy_kWh'] = predicted_value
    last_row = new_row.copy()

# ============================================================
# 6b. PRINT NEXT 24 HOURS FORECAST
# ============================================================
print("\nNext 24 hours forecast (kWh):")
for dt, value in zip(future_hours, future_predictions):
    print(f"{dt.strftime('%Y-%m-%d %H:%M')} → {value:.3f} kWh")

# Print min and max of next 24 hours
min_value = min(future_predictions)
max_value = max(future_predictions)

min_index = future_predictions.index(min_value)
max_index = future_predictions.index(max_value)

min_time = future_hours[min_index]
max_time = future_hours[max_index]

print("\nLowest predicted energy:")
print(f"{min_time.strftime('%Y-%m-%d %H:%M')} → {min_value:.3f} kWh")

print("\nHighest predicted energy:")
print(f"{max_time.strftime('%Y-%m-%d %H:%M')} → {max_value:.3f} kWh")

# ============================================================
# 7. DETERMINE BEST HOUR TO CONSUME ELECTRICITY
# ============================================================
best_index = int(np.argmin(future_predictions))
best_time = future_hours[best_index]

print(f"\nBest hour to consume electricity: {best_time.strftime('%Y-%m-%d %H:%M')} (Lowest predicted energy in kWh)")

# ============================================================
# 8. PLOT NEXT 24 HOURS PREDICTION
# ============================================================
plt.figure(figsize=(12, 5))
plt.plot(future_hours, future_predictions, marker='o', color='blue')
plt.title("Predicted Hourly Energy Consumption for Next 24 Hours")
plt.xlabel("Datetime")
plt.ylabel("Predicted Energy (kWh)")
plt.xticks(rotation=45)
plt.grid(True)
plt.tight_layout()
plt.show()
