import React, { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Activity, Zap, TrendingUp, AlertCircle,
    ArrowUp, ArrowDown, Minus, MoreHorizontal,
    Calendar, Sun, CloudRain, ExternalLink, Droplets, Lightbulb, Thermometer, Wind, Clock, ArrowDownRight, ArrowUpRight
} from 'lucide-react';

const Overview = ({ setActiveTab }) => {
    const [date, setDate] = useState(new Date());
    const [energyData, setEnergyData] = useState(null);
    const [energyPerformance, setEnergyPerformance] = useState(null);
    const [subMeterDonut, setSubMeterDonut] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // --- Mock Data ---
    const weatherData = {
        temp: 32,
        humidity: 45,
        condition: 'Sunny',
        isRaining: false
    };

    // --- API Data ---

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [perfRes, weeklyRes] = await Promise.all([
                    fetch("http://127.0.0.1:8000/get_energy_performance?start_date=2007-12-01"),
                    fetch("http://127.0.0.1:8000/compare_weeks?start=2007-12-01")
                ]);

                const perfData = await perfRes.json();
                const weeklyData = await weeklyRes.json();

                const transformed = {
                    AC: perfData.map(d => d.Sub_metering_3),
                    Kitchen: perfData.map(d => d.Sub_metering_1),
                    Laundry: perfData.map(d => d.Sub_metering_2),
                };
                const meterArray = [
                    weeklyData.this_week.sub_metering_1,
                    weeklyData.this_week.sub_metering_2,
                    weeklyData.this_week.sub_metering_3
                ];

                // Calculate total
                const total = meterArray.reduce((sum, value) => sum + value, 0);
                // Convert each value to percentage
                const meterPercentages = meterArray.map(value => ((value / total) * 100).toFixed(1)); // 1 decimal place
                setSubMeterDonut(meterPercentages);
                setEnergyPerformance(transformed);
                setEnergyData(weeklyData);
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };

        loadAll();
    }, []);


    // --- Chart Configurations ---
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 }, line: { borderWidth: 2 } }
    };

    // Helper to get last 7 days dates
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return days;
    };

    // Stacked Bar Chart for Weekly Performance
    // Build last week avg array dynamically using state
    const lastWeekAvgArray = energyData
        ? Array(7).fill(energyData.this_week.sub_metering_avg ?? 0)
        : Array(7).fill(0);

    const performanceData = {
        labels: getLast7Days(),
        datasets: [
            {
                type: 'line',
                label: 'Last Week Avg',
                data: lastWeekAvgArray,
                borderColor: '#fd7e14',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0,
                order: 0
            },
            {
                label: 'AC',
                data: energyPerformance?.AC ?? [],
                backgroundColor: '#0d6efd',
                stack: 'Stack 0',
                order: 1
            },
            {
                label: 'Kitchen',
                data: energyPerformance?.Kitchen ?? [],
                backgroundColor: '#ffc107',
                stack: 'Stack 0',
                order: 1
            },
            {
                label: 'Laundry',
                data: energyPerformance?.Laundry ?? [],
                backgroundColor: '#198754',
                stack: 'Stack 0',
                order: 1
            }
        ]
    };

    const performanceOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: '#F3F4F6' },
                ticks: { font: { size: 10 } }
            },
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { font: { size: 10 } }
            }
        }
    };

    const breakdownData = {
        labels: ['Kitchen', 'Laundry', 'AC'],
        datasets: [{
            data: subMeterDonut,
            backgroundColor: ['#ffc107', '#198754', '#0d6efd'],
            borderWidth: 0,
            cutout: '60%'
        }]
    };

    // --- Smart Tip Logic ---
    const generateSmartTips = () => {
        const tips = [];
        const { temp, humidity, isRaining } = weatherData;

        // 1. AC Tips
        if (temp > 30) {
            tips.push({
                category: "AC",
                text: `It’s ${temp}°C — AC recommended at 24–26°C. Avoid running between 1–4 PM to save energy.`,
                icon: Thermometer,
                color: "primary"
            });
        } else if (temp >= 25) {
            tips.push({
                category: "AC",
                text: `It’s ${temp}°C — AC optional. Use a fan if comfortable, or run AC during cooler hours.`,
                icon: Wind,
                color: "info"
            });
        } else {
            tips.push({
                category: "AC",
                text: `It’s ${temp}°C — AC not needed. Natural ventilation is sufficient.`,
                icon: Wind,
                color: "success"
            });
        }

        // 2. Laundry Tips
        if (isRaining || humidity > 70) {
            tips.push({
                category: "Laundry",
                text: "High humidity/rain detected — avoid using dryer now; clothes may take longer to dry.",
                icon: CloudRain,
                color: "warning"
            });
        } else {
            tips.push({
                category: "Laundry",
                text: "Sunny & low humidity — great time for line drying to save dryer energy.",
                icon: Sun,
                color: "success"
            });
        }

        // 3. Heavy Appliance Tips (Time based - Mocking current time as morning)
        tips.push({
            category: "Appliances",
            text: "Best time to run heavy appliances (washer, dishwasher) is 2–4 PM when energy demand is low.",
            icon: Clock,
            color: "secondary"
        });

        return tips;
    };

    const smartTips = generateSmartTips();

    // --- Components ---

    const KPICard = ({ title, value, subtext, icon: Icon, trend, colorClass, onClick, targetTab, lowerIsBetter = false, setActiveTab }) => {
        const isGood = lowerIsBetter ? trend === 'down' : trend === 'up';
        const badgeClass = isGood ? 'text-success bg-success bg-opacity-10' : 'text-danger bg-danger bg-opacity-10';

        let TrendIcon = Minus;
        if (trend === 'up') TrendIcon = ArrowUp;
        if (trend === 'down') TrendIcon = ArrowDown;

        return (
            <div className="card h-100 shadow-sm border-0">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <button
                                onClick={() => setActiveTab(targetTab)}
                                className="btn btn-link p-0 text-decoration-none text-secondary fw-bold text-uppercase"
                                style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                            >
                                {title} <ExternalLink size={10} className="ms-1 mb-1" />
                            </button>
                            <h3 className="fw-bold text-dark mt-1 mb-0">{value}</h3>
                        </div>
                        <div className={`p-2 rounded bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                            <Icon size={18} className={colorClass} />
                        </div>
                    </div>
                    <div className="d-flex flex-column gap-1 mt-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${badgeClass} px-2 py-1 d-flex align-items-center gap-1`}>
                                <TrendIcon size={12} />
                                {subtext}
                            </span>
                        </div>
                        <span className="text-muted small" style={{ fontSize: '0.65rem' }}>Est. This Week vs Last Week</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid p-0 h-100 d-flex flex-column gap-3 animate-fade-in-up">
            {/* Header Row */}
            <div className="d-flex justify-content-between align-items-end mb-2">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Overview Dashboard</h4>
                    <p className="text-muted small mb-0">Real-time energy monitoring & analytics</p>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted small bg-white px-3 py-2 rounded border shadow-sm">
                    <Calendar size={14} />
                    {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Alerts Row */}
            <div className="row g-0 mb-1">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
                        <div className="card-body p-2 d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 text-danger fw-bold small text-uppercase">
                                <AlertCircle size={16} /> Active Alerts
                            </div>
                            <div className="vr opacity-25"></div>
                            <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                                <span className="badge bg-danger">High Usage</span>
                                <span className="small text-dark fw-medium text-truncate">Kitchen usage is 50% higher than average. Check appliances.</span>
                            </div>
                            <button
                                className="btn btn-sm btn-link text-danger p-0 text-decoration-none small fw-bold"
                                onClick={() => setActiveTab('usage-breakdown')}
                            >
                                View All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="row g-3 flex-grow-1">

                {/* KPI 1: Live Usage */}
                <div className="col-md-3 col-sm-6">
                    <KPICard
                        title="Live Usage"
                        value={energyData?.this_week.total_active_power_kwh
                            ? energyData.this_week.total_active_power_kwh.toFixed(2)
                            : "-"}
                        subtext="12%"
                        trend="down"
                        lowerIsBetter={true}
                        icon={Activity}
                        colorClass="text-primary"
                        targetTab="monitoring"
                        setActiveTab={setActiveTab}
                    />
                </div>

                {/* KPI 2: Efficiency */}
                <div className="col-md-3 col-sm-6">
                    <KPICard
                        title="Efficiency"
                        value={energyData?.this_week.efficiency ? (energyData?.this_week.efficiency * 100).toFixed(2) : "-"}
                        subtext="5%"
                        trend="up"
                        icon={TrendingUp}
                        colorClass="text-success"
                        targetTab="forecast"
                        setActiveTab={setActiveTab}
                    />
                </div>

                {/* KPI 3: Savings */}
                <div className="col-md-3 col-sm-6">
                    <KPICard
                        title="Est. Savings"
                        value="RM 450"
                        subtext="8%"
                        trend="up"
                        icon={Zap}
                        colorClass="text-warning"
                        targetTab="forecast"
                        setActiveTab={setActiveTab}
                    />
                </div>

                {/* KPI 4: Weather */}
                <div className="col-md-3 col-sm-6">
                    <div
                        className="card h-100 border-0 shadow-sm bg-primary text-white overflow-hidden position-relative"
                        role="button"
                        onClick={() => document.getElementById('smart-tips-section')?.scrollIntoView({ behavior: 'smooth' })}
                        style={{ cursor: 'pointer' }}
                        title="Click to view Smart Tips"
                    >
                        <div className="card-body p-3 position-relative z-1 d-flex flex-column justify-content-center">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-white-50 fw-bold text-uppercase small mb-0">Weather</p>
                                    <div className="d-flex align-items-baseline gap-2">
                                        <h3 className="fw-bold mt-1 mb-0">{weatherData.temp}°C</h3>
                                        <span className="small text-white-50"><Droplets size={12} className="me-1" />{weatherData.humidity}%</span>
                                    </div>
                                    <p className="text-white-50 small mb-0">{weatherData.condition}</p>
                                </div>
                                <Sun size={32} className="text-warning" />
                            </div>
                        </div>
                        <CloudRain size={80} className="position-absolute bottom-0 end-0 text-white opacity-10 me-n3 mb-n3" />
                    </div>
                </div>

                {/* Main Chart Area: Energy Performance */}
                <div className="col-md-9">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 px-3 pb-0">
                            <div className="d-flex align-items-center gap-3">
                                <button
                                    onClick={() => setActiveTab('usage-breakdown')}
                                    className="btn btn-link text-dark fw-bold text-decoration-none p-0 d-flex align-items-center gap-2"
                                >
                                    Energy Performance <ExternalLink size={14} className="text-muted" />
                                </button>
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                    <ArrowDownRight size={12} className="me-1" />
                                    5% vs Last Week
                                </span>
                            </div>
                            <button className="btn btn-sm btn-outline-light text-muted border-0"><MoreHorizontal size={18} /></button>
                        </div>
                        <div className="card-body position-relative">
                            <div className="w-100 h-100">
                                <Bar data={performanceData} options={performanceOptions} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Panel: Breakdown */}
                <div className="col-md-3">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-header bg-white border-0 pt-3 px-3 pb-0">
                            <button
                                onClick={() => setActiveTab('usage-breakdown')}
                                className="btn btn-link text-dark fw-bold text-decoration-none p-0 d-flex align-items-center gap-2"
                            >
                                Split (Week to Date) <ExternalLink size={14} className="text-muted" />
                            </button>
                        </div>
                        <div className="card-body d-flex flex-column justify-content-center align-items-center position-relative">
                            <div style={{ width: '150px', height: '150px' }}>
                                <Doughnut data={breakdownData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
                            </div>
                            <div className="w-100 mt-3">
                                {['AC', 'Kitchen', 'Laundry'].map((label, i) => (
                                    <div key={label} className="d-flex justify-content-between align-items-center mb-1 small">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: breakdownData.datasets[0].backgroundColor[i] }}></span>
                                            <span className="text-muted">{label}</span>
                                        </div>
                                        <span className="fw-bold">{breakdownData.datasets[0].data[i]}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Smart Tips Section (Consolidated) */}
            <div className="row g-0" id="smart-tips-section">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-white">
                        <div className="card-header bg-white border-0 pt-3 px-3 pb-0">
                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                <Lightbulb size={18} className="text-warning" /> Smart Energy Tips
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="row g-3">
                                {smartTips.map((tip, index) => (
                                    <div key={index} className="col-md-4">
                                        <div className={`p-3 rounded h-100 bg-${tip.color} bg-opacity-10 border border-${tip.color} border-opacity-25`}>
                                            <div className="d-flex align-items-start gap-3">
                                                <div className={`p-2 rounded-circle bg-${tip.color} text-white flex-shrink-0`}>
                                                    <tip.icon size={18} />
                                                </div>
                                                <div>
                                                    <h6 className={`fw-bold text-${tip.color} mb-1 small text-uppercase`}>{tip.category}</h6>
                                                    <p className="mb-0 small text-dark opacity-85 lh-sm">
                                                        Tip: {tip.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
