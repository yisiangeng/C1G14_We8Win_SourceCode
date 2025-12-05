from predictor import HourlyEnergyPredictor
from predictor import EnergyPredictor
from predictor import HourlyEnergyPredictor
from efficiency_predictor import EfficiencyForecast24H, EfficiencyForecast7D
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loader import load_data
from processor import aggregate_week
from datetime import datetime, timedelta 
from calendar import monthrange
import pandas as pd
import os

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# def read_root():
#     return {"message": "Hello World"}

# Load dataset once
print("Loading data... This may take a few seconds.")
data_file = os.path.join(os.path.dirname(__file__), "household_power_cleaned.xlsx")
df = load_data(data_file)
print("Data loaded successfully!")

# Get 7-day forecast from last available date
predictor = EnergyPredictor(df)
forecast_data = predictor.predict_next_7_days()
print(forecast_data['forecast'])

# Get 24 hours forecast from last available date
hourly_predictor = HourlyEnergyPredictor(df)
forecast_24h = hourly_predictor.predict_next_24_hours()
print(forecast_24h['forecast'])

# 24 hours efficiency forecast
hourly_eff = EfficiencyForecast24H(df)
forecast_24h = hourly_eff.predict_next_24_hours
print(forecast_24h)

# 7 days efficiency forecast
daily_eff = EfficiencyForecast7D(df)
forecast_7d = daily_eff.predict_next_7_days()
print(forecast_7d)


@app.get("/compare_weeks")
def compare_weeks(start: str):
  
    # Convert strings to datetime
    start_date = datetime.fromisoformat(start)
    end_date = start_date + timedelta(days=6) 
    delta = end_date - start_date

    # This week
    this_week_df = df.loc[start_date:end_date]  # use .loc for datetime slicing
    this_week_data = aggregate_week(this_week_df)

    # Last week (same number of days before this week start)
    last_week_start = start_date - (delta + timedelta(days=1))
    last_week_end = start_date - timedelta(days=1)
    last_week_df = df.loc[last_week_start:last_week_end]
    last_week_data = aggregate_week(last_week_df)

    # Difference (this week - last week)
    diff = {k + "_diff": this_week_data[k] - last_week_data[k] for k in this_week_data}

    return {
        "this_week": this_week_data,
        "last_week": last_week_data,
        "difference": diff
    }

@app.get("/get_energy_performance")
def get_energy_performance(start_date: str):
    
    start = datetime.fromisoformat(start_date)
    end = start + timedelta(days=7)  # add full 7 days
    week_df = df.loc[start:end - timedelta(seconds=1)] 

    daily_summary = (
        week_df.groupby(week_df.index.date)[['Sub_metering_1','Sub_metering_2','Sub_metering_3']]
        .sum()
        .reset_index()
    )

    daily_summary['date'] = daily_summary['index'].astype(str)
    daily_summary = daily_summary.drop(columns=['index'])

    result = daily_summary.to_dict(orient='records')
    return result

@app.get("/predict_next_7_days")
def get_forecast(start_date: str = None):
    forecast_df = predictor.predict_next_7_days(start_date)

    # If the predictor already produced a list/dict → return directly
    if isinstance(forecast_df, (list, dict)):
        return forecast_df

    # Otherwise convert DataFrame → list of dicts
    response = [
        {
            "date": row['Date'].strftime("%Y-%m-%d"),
            "predicted_kWh": float(row['Predicted_Daily_Energy_kWh'])
        }
        for _, row in forecast_df.iterrows()
    ]

    return response

@app.get("/predict_next_24_hours")
def get_hourly_forecast():
    forecast_data = hourly_predictor.predict_next_24_hours()
    forecast_list = forecast_data['forecast'].to_dict(orient='records')
    return {
        "forecast": forecast_list,
        "lowest_hour": forecast_data['lowest_hour'].to_dict(),
        "highest_hour": forecast_data['highest_hour'].to_dict()
    }

@app.get("/efficiency_24_hours")
def get_eff_24h():
    forecast = hourly_eff.predict_next_24_hours()
    return forecast.reset_index().rename(columns={"index": "datetime"}).to_dict(orient="records")


@app.get("/efficiency_7_days")
def get_eff_7days():
    forecast = daily_eff.predict_next_7_days()
    return forecast.reset_index().rename(columns={"index": "date"}).to_dict(orient="records")

@app.get("/get_month_average")
def get_month_average(start_date: str):
    try:
        # Parse input
        start = datetime.fromisoformat(start_date)
        year = start.year
        month = start.month

        # Determine first & last day of the month
        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, monthrange(year, month)[1], 23, 59, 59)

        # Slice data for the entire month
        month_df = df.loc[month_start:month_end]

        if month_df.empty:
            return {"error": "No data available for this month."}

        # Total energy in kWh (dataset is 1-min interval)
        total_kwh = month_df["Global_active_power"].sum() / 60
        sub_meter_total = month_df['Sub_metering_1'].sum() + month_df['Sub_metering_2'].sum() + month_df['Sub_metering_3'].sum()

        days = monthrange(year, month)[1]

        sub_meter_avg = sub_meter_total / days
        avg_kwh_per_day = total_kwh / days
        average_kwh_per_hour = avg_kwh_per_day /24
        return {
            "month": f"{year}-{str(month).zfill(2)}",
            "total_kwh": round(total_kwh, 3),
            "average_kwh_per_day": round(avg_kwh_per_day, 2),
            "average_kwh_per_hour": round(average_kwh_per_hour, 2),
            "sub_meter_avg": round(sub_meter_avg, 2),
            "days": days
        }

    except Exception as e:
        return {"error": str(e)}


