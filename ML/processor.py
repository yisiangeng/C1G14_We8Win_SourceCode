import numpy as np

def aggregate_week(week_df):
 
    total_active_power_kwh = week_df['Global_active_power'].sum() / 60
    P_sum = week_df['Global_active_power'].sum()
    Q_sum = week_df['Global_reactive_power'].sum()
    efficiency = P_sum / np.sqrt(P_sum**2 + Q_sum**2) if (P_sum**2 + Q_sum**2) > 0 else 0
    sub_meter_total = week_df['Sub_metering_1'].sum() + week_df['Sub_metering_2'].sum() + week_df['Sub_metering_3'].sum()
    sub_meter_avg = sub_meter_total / 7
    return {
        "total_active_power_kwh": total_active_power_kwh,
        "avg_active_power_kw": week_df['Global_active_power'].mean(),
        "sub_metering_1": week_df['Sub_metering_1'].sum(),
        "sub_metering_2": week_df['Sub_metering_2'].sum(),
        "sub_metering_3": week_df['Sub_metering_3'].sum(),
        "sub_metering_avg": sub_meter_avg,
        "efficiency": efficiency
    }
