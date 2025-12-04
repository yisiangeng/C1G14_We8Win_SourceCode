# from predictor import train_forecast_model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loader import load_data
from processor import aggregate_week
from datetime import datetime, timedelta 
import pandas as pd

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

# Load dataset once
print("Loading data... This may take a few seconds.")
df = load_data("household_power_cleaned.xlsx")
print("Data loaded successfully!")
# predict_next_7days= train_forecast_model(df)

@app.get(/get_weekly_data)
def get_weekly_data(start: str):
  # Convert strings to datetime
    start_date = datetime.fromisoformat(start)
    end_date = start_date + timedelta(days=6) 

    # This week
    this_week_df = df.loc[start_date:end_date]  # use .loc for datetime slicing
    this_week_data = aggregate_week(this_week_df)

    return {
        "this_week": this_week_data
    }

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
    end = start + timedelta(days=6) 

    week_df = df.loc[start:end]

    daily_summary = (
        week_df.groupby(week_df.index.date)[['Sub_metering_1','Sub_metering_2','Sub_metering_3']]
        .sum()
        .reset_index()
    )

    daily_summary['date'] = daily_summary['index'].astype(str)
    daily_summary = daily_summary.drop(columns=['index'])

    result = daily_summary.to_dict(orient='records')
    return result
