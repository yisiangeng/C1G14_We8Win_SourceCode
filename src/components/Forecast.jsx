import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown, DollarSign, Calendar, Clock, Zap, Activity, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
);

const Forecast = () => {
    // State
    const [usageTimeRange, setUsageTimeRange] = useState('week'); // 'week' | 'day'
    const [efficiencyTimeRange, setEfficiencyTimeRange] = useState('week'); // 'week' | 'day'
    const [selectedUsageIndex, setSelectedUsageIndex] = useState(null);
    const [selectedEfficiencyIndex, setSelectedEfficiencyIndex] = useState(null);
    const [forecastList, setForecastList] = useState([]);
    const [forecastList24Hours, setForecastList24Hours] = useState([]);
    const [monthAverage, setMonthAverage] = useState(null);
    const [efficiency7D, setEfficiency7D] = useState([]);
    const [efficiency24H, setEfficiency24H] = useState([]);

    //Convert API response to a list
    const transformForecast = (data) => {
        const dates = data.Date;
        const values = data.Predicted_Daily_Energy_kWh;

        return Object.keys(values).map((key) => ({
            date: dates[key],
            value: values[key]
        }));
    };

    const transformHourlyForecast = (data) => {
        return data.forecast.map((item) => ({
            date: new Date(item.Date),
            value: item.Predicted_Hourly_Energy_kWh
        }));
    };


    // --- Mock Data & Logic ---

    // 1. Bill Data
    const projectedBill = 345.50;
    const lastMonthBill = 310.20;
    const monthToDateBill = 285.75;
    const billDiff = ((projectedBill - lastMonthBill) / lastMonthBill * 100).toFixed(1);
    const isBillIncrease = projectedBill > lastMonthBill;

    // 2. Efficiency Data (Score 0-100)
    const projectedEfficiency = 99.5;
    const lastMonthEfficiencyScore = 82.0;
    const monthToDateEfficiency = 86.2;
    const efficiencyDiff = ((projectedEfficiency - lastMonthEfficiencyScore) / lastMonthEfficiencyScore * 100).toFixed(1);
    const isEfficiencyImprovement = projectedEfficiency > lastMonthEfficiencyScore;

    // Thresholds (Last Month Averages)
    const lastMonthAvgUsage = monthAverage?.average_kwh_per_day ?? 0;
    const lastMonthAvgEfficiency = 82.0; // Efficiency Score

    //api call
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resForecast = await fetch("http://127.0.0.1:8000/predict_next_7_days");
                const jsonForecast = await resForecast.json();
                const transformed = transformForecast(jsonForecast.forecast);
                setForecastList(transformed);

                const resForecast24Hours = await fetch("http://127.0.0.1:8000/predict_next_24_hours");
                const jsonForecast24Hours = await resForecast24Hours.json();
                const transformed24Hours = transformHourlyForecast(jsonForecast24Hours)
                setForecastList24Hours(transformed24Hours)

                // 7-day efficiency forecast
                const resEfficiency7D = await fetch("http://127.0.0.1:8000/efficiency_7_days");
                const jsonEfficiency7D = await resEfficiency7D.json();
                const transformedEfficiency7D = jsonEfficiency7D.map(item => ({
                    date: new Date(item.date),
                    value: item.Predicted_Efficiency
                }));
                setEfficiency7D(transformedEfficiency7D);

                // 24-hour efficiency forecast
                const resEfficiency24H = await fetch("http://127.0.0.1:8000/efficiency_24_hours");
                const jsonEfficiency24H = await resEfficiency24H.json();
                const transformedEfficiency24H = jsonEfficiency24H.map(item => ({
                    datetime: new Date(item.datetime),
                    value: item.Power_factor_pred
                }));
                setEfficiency24H(transformedEfficiency24H);


                const resMonth = await fetch(
                    "http://127.0.0.1:8000/get_month_average?start_date=2007-12-01"
                );
                const jsonMonth = await resMonth.json();
                setMonthAverage(jsonMonth);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    // Usage Data Generation
    const usageDataValues = useMemo(() => {
        if (usageTimeRange === 'week') {
            return forecastList.length > 0
                ? forecastList.map(item => Number(item.value.toFixed(2)))
                : [];
        } else {
            return forecastList24Hours.length > 0
                ? forecastList24Hours.map(item => Number(item.value.toFixed(2)))
                : [];
        }
    }, [usageTimeRange, forecastList, forecastList24Hours]);

    // Efficiency Data Generation
    const efficiencyDataValues = useMemo(() => {
        if (efficiencyTimeRange === 'week') {
            return efficiency7D.length > 0 ? efficiency7D.map(item => Number(item.value.toFixed(4))) : [];
        } else {
            return efficiency24H.length > 0 ? efficiency24H.map(item => Number(item.value.toFixed(4))) : [];
        }
    }, [efficiencyTimeRange, efficiency24H, efficiency7D]);

    // Thresholds
    // For 'day' view (hourly), we use hourly average.
    const currentUsageThreshold = usageTimeRange === 'week' ? lastMonthAvgUsage : (lastMonthAvgUsage / 24);
    const currentEfficiencyThreshold = lastMonthAvgEfficiency;


    // --- Chart Configurations ---
    const usageLabels = useMemo(() => {
        if (usageTimeRange === "week") {
            return forecastList.length > 0
                ? forecastList.map((item, index) => {
                    // Hardcoded start date: Dec 6
                    const d = new Date("2023-12-06");
                    d.setDate(d.getDate() + index);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    // → "Dec 6"
                })
                : [];
        } else {
            return forecastList24Hours.map(d => `${d.date.getHours().toString().padStart(2, '0')}:00`);
        }
    }, [usageTimeRange, forecastList, forecastList24Hours]);

    const efficiencyLabels = useMemo(() => {
        if (efficiencyTimeRange === "week") {
            return efficiency7D.length > 0
                ? efficiency7D.map((item, index) => {
                    // Hardcoded start date: Dec 6
                    const d = new Date("2023-12-06");
                    d.setDate(d.getDate() + index);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    // → "Dec 6"
                })
                : [];
        } else {
            return efficiency24H.map(d => `${d.datetime.getHours().toString().padStart(2, '0')}:00`);
        }
    }, [efficiencyTimeRange, efficiency24H, efficiency7D]);

    // 1. Projected Usage Chart Data
    const usageChartData = {
        labels: usageLabels,
        datasets: [
            {
                type: 'bar',
                label: 'Projected Usage (kWh)',
                data: usageDataValues,
                backgroundColor: (context) => {
                    const index = context.dataIndex;
                    const value = context.dataset.data[index];
                    const isSelected = selectedUsageIndex === null || selectedUsageIndex === index;
                    const opacity = isSelected ? 1 : 0.5;
                    // Red if above threshold, Green if below
                    const color = value > currentUsageThreshold ? `rgba(239, 68, 68, ${opacity})` : `rgba(16, 185, 129, ${opacity})`;
                    return color;
                },
                borderRadius: 4,
                barPercentage: 0.6,
                order: 2
            },
            {
                type: 'line',
                label: 'Last Month Avg',
                data: Array(usageDataValues.length).fill(currentUsageThreshold),
                borderColor: '#fd7e14', // Orange color
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                order: 1 // Draw on top
            }
        ]
    };

    // 2. Projected Efficiency Chart Data
    const efficiencyChartData = {
        labels: efficiencyLabels,
        datasets: [
            {
                type: 'line',
                label: 'Projected Efficiency',
                data: efficiencyDataValues,
                borderColor: '#3B82F6', // Blue line
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                pointBackgroundColor: (context) => {
                    const index = context.dataIndex;
                    const value = context.dataset.data[index];
                    const isSelected = selectedEfficiencyIndex === null || selectedEfficiencyIndex === index;
                    const opacity = isSelected ? 1 : 0.3;
                    // Green if above threshold (good), Red if below (bad)
                    return value >= currentEfficiencyThreshold
                        ? `rgba(16, 185, 129, ${opacity})`
                        : `rgba(239, 68, 68, ${opacity})`;
                },
                pointRadius: (context) => {
                    const index = context.dataIndex;
                    return selectedEfficiencyIndex === index ? 6 : 3; // Smaller radius for 24 points
                },
                pointHoverRadius: 6,
                tension: 0.4,
                order: 2
            },
            {
                type: 'line',
                label: 'Last Month Avg',
                data: Array(efficiencyDataValues.length).fill(currentEfficiencyThreshold),
                borderColor: '#fd7e14', // Orange color
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                order: 1
            }
        ]
    };

    // --- Handlers ---

    const handleUsageClick = (event, elements) => {
        if (elements.length > 0) {
            // We need to filter out the threshold line clicks if any
            // The elements array contains all intersecting items.
            // We want the bar dataset (index 0).
            const barElement = elements.find(el => el.datasetIndex === 0);
            if (barElement) {
                const index = barElement.index;
                if (selectedUsageIndex === index) {
                    setSelectedUsageIndex(null); // Deselect
                } else {
                    setSelectedUsageIndex(index); // Select
                }
            }
        }
    };

    const handleEfficiencyClick = (event, elements) => {
        if (elements.length > 0) {
            const pointElement = elements.find(el => el.datasetIndex === 0);
            if (pointElement) {
                const index = pointElement.index;
                if (selectedEfficiencyIndex === index) {
                    setSelectedEfficiencyIndex(null); // Deselect
                } else {
                    setSelectedEfficiencyIndex(index); // Select
                }
            }
        }
    };

    // --- Options ---

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 10,
                filter: (tooltipItem) => {
                    // Only show tooltip for the main dataset (index 0)
                    return tooltipItem.datasetIndex === 0;
                },
                callbacks: {
                    label: (context) => {
                        const val = context.raw;
                        const threshold = context.chart.canvas.id === 'usageChart' ? currentUsageThreshold : currentEfficiencyThreshold;
                        const diff = ((val - threshold) / threshold * 100).toFixed(1);
                        const sign = diff > 0 ? '+' : '';
                        return [
                            `${context.dataset.label}: ${val}`,
                            `Last Month Avg: ${threshold.toFixed(2)}`,
                            `Difference: ${sign}${diff}%`
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#F3F4F6' },
                ticks: { color: '#9CA3AF' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9CA3AF' }
            }
        }
    };

    const efficiencyOptions = {
        ...commonOptions,
        scales: {
            ...commonOptions.scales, // keep existing x-axis
            y: {
                ...commonOptions.scales.y, // keep common y settings
                beginAtZero: false,
                min: 0.9,
                max: 1,
                ticks: {
                    ...commonOptions.scales.y.ticks,
                    stepSize: 0.02,
                    callback: (value) => (value * 100).toFixed(0) + '%'
                }
            }
        }
    };


    return (
        <div className="container-fluid p-0 d-flex flex-column gap-4 animate-fade-in-up">

            {/* Top Section: Projected Bill & Efficiency Cards */}
            <div className="grid grid-cols-2 gap-4">
                {/* 1. Projected Bill */}
                <div className="card border-0 shadow-sm bg-white">
                    <div className="card-body p-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="text-muted text-uppercase small fw-bold mb-1">Projected Bill</h6>
                            <div className="d-flex align-items-baseline gap-3">
                                <h2 className="fw-bold text-dark mb-0 display-6">RM {projectedBill.toFixed(2)}</h2>
                                <span className={`badge ${isBillIncrease ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill px-2 py-1 d-flex align-items-center gap-1`}>
                                    {isBillIncrease ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {billDiff}%
                                </span>
                            </div>
                            <p className="text-muted mt-2 mb-0 small">
                                Month-to-date: <strong>RM {monthToDateBill.toFixed(2)}</strong>
                            </p>
                        </div>
                        <div className="bg-light p-3 rounded-circle">
                            <DollarSign size={28} className="text-primary" />
                        </div>
                    </div>
                </div>

                {/* 2. Projected Efficiency */}
                <div className="card border-0 shadow-sm bg-white">
                    <div className="card-body p-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="text-muted text-uppercase small fw-bold mb-1">Projected Efficiency</h6>
                            <div className="d-flex align-items-baseline gap-3">
                                <h2 className="fw-bold text-dark mb-0 display-6">{projectedEfficiency.toFixed(1)} <span className="fs-6 text-muted">Score</span></h2>
                                <span className={`badge ${isEfficiencyImprovement ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-2 py-1 d-flex align-items-center gap-1`}>
                                    {isEfficiencyImprovement ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {efficiencyDiff}%
                                </span>
                            </div>
                            <p className="text-muted mt-2 mb-0 small">
                                Month-to-date: <strong>{monthToDateEfficiency.toFixed(1)}</strong>
                            </p>
                        </div>
                        <div className="bg-light p-3 rounded-circle">
                            <Activity size={28} className="text-success" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Projected Usage Chart */}
            <div className="card border-0 shadow-sm bg-white">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                            <Zap size={20} className="text-warning" />
                            Projected Usage
                        </h5>
                        <p className="text-muted small mb-0">Forecasted energy consumption vs last month's average</p>
                    </div>

                    {/* Time Toggle */}
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${usageTimeRange === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => { setUsageTimeRange('week'); setSelectedUsageIndex(null); }}
                        >
                            Week
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${usageTimeRange === 'day' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => { setUsageTimeRange('day'); setSelectedUsageIndex(null); }}
                        >
                            Day
                        </button>
                    </div>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <Bar
                        id="usageChart"
                        data={usageChartData}
                        options={{
                            ...commonOptions,
                            onClick: handleUsageClick
                        }}
                    />
                </div>
                <div className="card-footer bg-light border-0 text-center text-muted small py-2">
                    <span className="d-inline-flex align-items-center gap-2">
                        <span className="d-inline-block rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></span> Above Avg
                        <span className="d-inline-block rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></span> Below Avg
                    </span>
                </div>
            </div>

            {/* 4. Projected Efficiency Chart */}
            <div className="card border-0 shadow-sm bg-white">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                            <TrendingUp size={20} className="text-success" />
                            Projected Efficiency
                        </h5>
                        <p className="text-muted small mb-0">Efficiency score trends vs last month's average</p>
                    </div>

                    {/* Time Toggle */}
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${efficiencyTimeRange === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => { setEfficiencyTimeRange('week'); setSelectedEfficiencyIndex(null); }}
                        >
                            Week
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${efficiencyTimeRange === 'day' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => { setEfficiencyTimeRange('day'); setSelectedEfficiencyIndex(null); }}
                        >
                            Day
                        </button>
                    </div>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <Line
                        id="efficiencyChart"
                        data={efficiencyChartData}
                        options={{
                            ...efficiencyOptions,
                            onClick: handleEfficiencyClick
                        }}
                    />
                </div>
                <div className="card-footer bg-light border-0 text-center text-muted small py-2">
                    <span className="d-inline-flex align-items-center gap-2">
                        <span className="d-inline-block rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></span> High Efficiency
                        <span className="d-inline-block rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></span> Low Efficiency
                    </span>
                </div>
            </div>

        </div>
    );
};

export default Forecast;
