import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getWeekComparison = async (start, end) => {
    return axios.get(`${API_URL}/compare_weeks`, {
        params: { start, end }
    });
};

export const getEnergyPerformance = async (start_date) => {
    return axios.get(`${API_URL}/get_energy_performance`, {
        params: { start_date }
    });
};
