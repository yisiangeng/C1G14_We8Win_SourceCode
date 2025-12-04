import pandas as pd

def load_data(path):
  
    df = pd.read_excel(path)

    df['datetime'] = pd.to_datetime(df['Date'] + " " + df['Time'], dayfirst=True)


    df = df.set_index('datetime')

    start = "2007-01-01"
    end = "2007-12-31"
    df = df.loc[start:end]

    # Convert numeric columns
    df['Global_active_power'] = pd.to_numeric(df['Global_active_power'], errors='coerce')
    df['kwh'] = df['Global_active_power'] / 60  # kW-min → kWh

    df['Sub_metering_1'] = pd.to_numeric(df['Sub_metering_1'], errors='coerce') / 1000
    df['Sub_metering_2'] = pd.to_numeric(df['Sub_metering_2'], errors='coerce') / 1000
    df['Sub_metering_3'] = pd.to_numeric(df['Sub_metering_3'], errors='coerce') / 1000

    return df
