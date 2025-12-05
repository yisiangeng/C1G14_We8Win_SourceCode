import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowLeft, Calendar, Clock, PieChart, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const UsageBreakdown = ({ setActiveTab }) => {


    // State
    const [weekOffset, setWeekOffset] = useState(0);
    const [energyData, setEnergyData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedBarDate, setSelectedBarDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [hourlyViewDate, setHourlyViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedHour, setSelectedHour] = useState(null);

    const [breakdownData, setBreakdownData] = useState({ AC: 0, Kitchen: 0, Laundry: 0 });
    const [comparisonBreakdownData, setComparisonBreakdownData] = useState(null);

    const getMondayByOffset = (weekOffset) => {
        // HARD-CODE dataset's latest reference date (Nov 29)
        const referenceDate = new Date("2007-11-29");
        const startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - weekOffset * 7);
        return startDate.toISOString().split("T")[0];
    };

    const formatDateLabel = (dateObj) => {
        return `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })}`;
    };

    const getWeekDates = (offset) => {
        const days = [];
        const monday = new Date(getMondayByOffset(offset)); // Start from Monday

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(formatDateLabel(d));
        }
        return days;
    };

    // Pseudo-random generator for consistent data based on string seed
    const pseudoRandom = (seed) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0;
        }
        const x = Math.sin(hash) * 10000;
        return x - Math.floor(x);
    };

    // Define static weekly data structure for lookup
    // const generateWeeklyData = (labels, offset) => {
    //     const data = {};
    //     labels.forEach((date, i) => {
    //         const seed = date + offset; // Unique seed per date and week
    //         data[date] = {
    //             AC: 20 + Math.floor(pseudoRandom(seed + 'AC') * 10),
    //             Kitchen: 15 + Math.floor(pseudoRandom(seed + 'Kitchen') * 8),
    //             Laundry: 10 + Math.floor(pseudoRandom(seed + 'Laundry') * 5),
    //             Other: 5 + Math.floor(pseudoRandom(seed + 'Other') * 3)
    //         };
    //     });
    //     return data;
    // };

    // const weeklyDataMap = useMemo(() => generateWeeklyData(weekLabels, weekOffset), [weekLabels, weekOffset]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const startDate = getMondayByOffset(weekOffset);

            try {
                const res = await fetch(
                    `http://127.0.0.1:8000/get_energy_performance?start_date=${startDate}`
                );

                const data = await res.json();
                setEnergyData(data);
            } catch (err) {
                setEnergyData([]);
            }
            setLoading(false);
        };

        loadData();
    }, [weekOffset]);

    const weekLabels = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);



    // Define static hourly data structure for lookup
    // Define static hourly data structure for lookup
    const generateHourlyData = (dateStr, dailyTotal = 0) => {
        const data = {};
        let generatedTotal = { AC: 0, Kitchen: 0, Laundry: 0 };

        // First pass: generate random proportions
        hourLabels.forEach((hour, i) => {
            const seed = dateStr + hour;
            data[hour] = {
                AC: pseudoRandom(seed + 'AC'),
                Kitchen: pseudoRandom(seed + 'Kitchen'),
                Laundry: pseudoRandom(seed + 'Laundry')
            };
            generatedTotal.AC += data[hour].AC;
            generatedTotal.Kitchen += data[hour].Kitchen;
            generatedTotal.Laundry += data[hour].Laundry;
        });

        // Second pass: normalize to match dailyTotal
        // If dailyTotal is 0, everything is 0.
        // We need to know the breakdown of dailyTotal (AC, Kitchen, Laundry)
        // But we only have the *total* daily kWh passed here? 
        // Actually, we can get the breakdown from energyData for the selected day.
        // Let's assume dailyTotal is an object { AC, Kitchen, Laundry }

        hourLabels.forEach((hour) => {
            data[hour].AC = generatedTotal.AC ? (data[hour].AC / generatedTotal.AC * dailyTotal.AC).toFixed(2) : 0;
            data[hour].Kitchen = generatedTotal.Kitchen ? (data[hour].Kitchen / generatedTotal.Kitchen * dailyTotal.Kitchen).toFixed(2) : 0;
            data[hour].Laundry = generatedTotal.Laundry ? (data[hour].Laundry / generatedTotal.Laundry * dailyTotal.Laundry).toFixed(2) : 0;
        });

        return data;
    };

    const selectedDayTotal = useMemo(() => {
        const dayData = energyData.find(d => {
            const dDate = formatDateLabel(new Date(d.date));
            return dDate === selectedDate;
        });
        if (dayData) {
            return {
                AC: dayData.Sub_metering_3,
                Kitchen: dayData.Sub_metering_1,
                Laundry: dayData.Sub_metering_2
            };
        }
        return { AC: 0, Kitchen: 0, Laundry: 0 };
    }, [energyData, selectedDate]);

    const hourlyDataMap = useMemo(() => generateHourlyData(hourlyViewDate, selectedDayTotal), [hourlyViewDate, selectedDayTotal]);

    const lastMonthAverage = useMemo(() => ({
        total: 17, // Average daily total
        AC: 11,
        Kitchen: 4,
        Laundry: 6
    }), []);

    // Auto-select latest day when data loads
    useEffect(() => {
        if (energyData && energyData.length > 0) {
            // Default to Dec 5 (2007-12-05) if available, otherwise latest
            const targetDateStr = "2007-12-05";
            let targetDay = energyData.find(d => d.date === targetDateStr);

            if (!targetDay) {
                targetDay = energyData[energyData.length - 1];
            }

            const targetDateLabel = formatDateLabel(new Date(targetDay.date));

            setSelectedBarDate(null); // Keep chart unselected visually
            setSelectedDate(targetDateLabel);

            setBreakdownData({
                AC: targetDay.Sub_metering_3,
                Kitchen: targetDay.Sub_metering_1,
                Laundry: targetDay.Sub_metering_2
            });
            setComparisonBreakdownData(lastMonthAverage);
            setHourlyViewDate(targetDay.date);
            setSelectedHour(null);
        }
    }, [energyData, lastMonthAverage]);

    // Chart Data Objects (Visuals)
    // Chart Data Objects (Visuals)
    const weeklyChartData = {
        labels: weekLabels,
        datasets: [
            {
                label: 'AC',
                data: weekLabels.map(date => {
                    const dayData = energyData.find(d => {
                        const dDate = formatDateLabel(new Date(d.date));
                        return dDate === date;
                    });
                    return dayData ? dayData.Sub_metering_3 : 0;
                }),
                backgroundColor: weekLabels.map(date => selectedBarDate === null || date === selectedBarDate ? '#0d6efd' : 'rgba(13, 110, 253, 0.3)'),
                stack: 'Stack 0',
                order: 1
            },
            {
                label: 'Kitchen',
                data: weekLabels.map(date => {
                    const dayData = energyData.find(d => {
                        const dDate = formatDateLabel(new Date(d.date));
                        return dDate === date;
                    });
                    return dayData ? dayData.Sub_metering_1 : 0;
                }),
                backgroundColor: weekLabels.map(date => selectedBarDate === null || date === selectedBarDate ? '#ffc107' : 'rgba(255, 193, 7, 0.3)'),
                stack: 'Stack 0',
                order: 1
            },
            {
                label: 'Laundry',
                data: weekLabels.map(date => {
                    const dayData = energyData.find(d => {
                        const dDate = formatDateLabel(new Date(d.date));
                        return dDate === date;
                    });
                    return dayData ? dayData.Sub_metering_2 : 0;
                }),
                backgroundColor: weekLabels.map(date => selectedBarDate === null || date === selectedBarDate ? '#198754' : 'rgba(25, 135, 84, 0.3)'),
                stack: 'Stack 0',
                order: 1
            },

        ]
    };


    const hourlyChartData = {
        labels: hourLabels,
        datasets: [
            {
                label: 'Hourly Usage (kWh)',
                // Sum of all categories for the line chart total
                data: hourLabels.map(hour => {
                    const d = hourlyDataMap[hour];
                    return (parseFloat(d.AC) + parseFloat(d.Kitchen) + parseFloat(d.Laundry)).toFixed(2);
                }),
                borderColor: selectedHour === null ? '#0d6efd' : 'rgba(13, 110, 253, 0.2)',
                backgroundColor: selectedHour === null ? 'rgba(13, 110, 253, 0.1)' : 'rgba(13, 110, 253, 0.05)',
                pointBackgroundColor: hourLabels.map(hour => selectedHour === null || hour === selectedHour ? '#0d6efd' : 'rgba(13, 110, 253, 0.15)'),
                pointRadius: hourLabels.map(hour => hour === selectedHour ? 6 : 3),
                pointBorderColor: hourLabels.map(hour => selectedHour === null || hour === selectedHour ? '#0d6efd' : 'rgba(13, 110, 253, 0.2)'),
                pointBorderWidth: hourLabels.map(hour => hour === selectedHour ? 2 : 1),
                fill: true,
                tension: 0.4,
                pointHoverRadius: 6,
                order: 2
            },
            {
                label: 'Last Month Avg',
                data: Array(24).fill((lastMonthAverage.total / 24).toFixed(2)),
                borderColor: '#fd7e14', // Orange color to match weekly
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0,
                order: 1
            }
        ]
    };

    // --- Chart Options & Handlers ---

    // Plugin to draw Last Month Average overlay on Weekly Chart
    const horizontalLinePlugin = {
        id: 'horizontalLine',
        afterDraw: (chart) => {
            const { ctx, chartArea: { left, right }, scales: { y } } = chart;
            const yValue = y.getPixelForValue(lastMonthAverage.total);

            if (yValue) {
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = '#fd7e14';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(left, yValue);
                ctx.lineTo(right, yValue);
                ctx.stroke();
                ctx.restore();
            }
        }
    };


    const handleWeeklyChartClick = (event, elements) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            const clickedDate = weekLabels[index];

            if (selectedBarDate === clickedDate) {
                // Deselect
                setSelectedBarDate(null);
                const today = new Date();
                setSelectedDate(formatDateLabel(today));
                setHourlyViewDate(today.toISOString().split('T')[0]);
                setComparisonBreakdownData(null);
            } else {
                // Select
                setSelectedBarDate(clickedDate);
                setSelectedDate(clickedDate);

                // Update breakdown data
                const selectedDayData = energyData.find(d => {
                    const dDate = formatDateLabel(new Date(d.date));
                    return dDate === clickedDate;
                });

                if (selectedDayData) {
                    setBreakdownData({
                        AC: selectedDayData.Sub_metering_3,
                        Kitchen: selectedDayData.Sub_metering_1,
                        Laundry: selectedDayData.Sub_metering_2
                    });
                    // Set comparison data to Last Month Average
                    setComparisonBreakdownData(lastMonthAverage);
                }

                // Sync hourly view date
                const d = new Date(clickedDate + ", " + new Date().getFullYear());
                const offset = d.getTimezoneOffset();
                const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                setHourlyViewDate(localDate.toISOString().split('T')[0]);
                setSelectedHour(null);
            }
        }
    };

    const handleHourlyChartClick = (event, elements) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            const clickedHour = hourLabels[index];

            if (selectedHour === clickedHour) {
                // Deselect
                setSelectedHour(null);
                let dailyTotal = { AC: 0, Kitchen: 0, Laundry: 0 };
                Object.values(hourlyDataMap).forEach(h => {
                    dailyTotal.AC += parseFloat(h.AC);
                    dailyTotal.Kitchen += parseFloat(h.Kitchen);
                    dailyTotal.Laundry += parseFloat(h.Laundry);
                });
                setBreakdownData(dailyTotal);

                // Reset comparison to Last Month Average (Daily) - or maybe hourly average?
                // For simplicity, let's keep showing the daily average comparison when viewing daily total.
                // But if we deselect hour, we are back to viewing the "Day" selected in weekly chart (or today).
                // If we are in "Day" view, we compare against Last Month Daily Average.
                setComparisonBreakdownData(lastMonthAverage);

            } else {
                // Select
                setSelectedHour(clickedHour);

                if (hourlyDataMap[clickedHour]) {
                    setBreakdownData({
                        AC: parseFloat(hourlyDataMap[clickedHour].AC),
                        Kitchen: parseFloat(hourlyDataMap[clickedHour].Kitchen),
                        Laundry: parseFloat(hourlyDataMap[clickedHour].Laundry)
                    });
                }

                // For hourly selection, comparing against "Last Month Average" might mean "Average Hourly Usage".
                // Let's assume average hourly is Daily Average / 24 for simplicity, or just hide comparison for hourly specific view
                // unless we have specific "Last Month Average for this Hour".
                // Let's approximate: Last Month Daily Average / 24
                const hourlyAvg = {
                    AC: lastMonthAverage.AC / 24,
                    Kitchen: lastMonthAverage.Kitchen / 24,
                    Laundry: lastMonthAverage.Laundry / 24
                };
                setComparisonBreakdownData(hourlyAvg);
            }
        }
    };

    const weeklyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end' },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    afterBody: (tooltipItems) => {
                        const total = tooltipItems.reduce((a, b) => a + b.raw, 0);
                        const avg = lastMonthAverage.total;
                        const diff = ((total - avg) / avg * 100).toFixed(1);
                        const sign = diff > 0 ? '+' : '';
                        return [
                            `Last Month Avg: ${avg} kWh`,
                            `Difference: ${sign}${diff}%`
                        ];
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
            x: { grid: { display: false } }
        },
        onClick: handleWeeklyChartClick
    };

    const hourlyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end' },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
            x: { grid: { display: false } }
        },
        onClick: handleHourlyChartClick
    };


    return (
        <div className="container-fluid p-0 h-100 d-flex flex-column gap-4 animate-fade-in-up">


            {/* 1. Weekly Usage Breakdown Bar Chart (Top) */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <Calendar size={20} className="text-primary" />
                        Weekly Performance
                    </h5>

                    {/* Week Navigation */}
                    <div className="d-flex align-items-center bg-light rounded-pill px-2 py-1 border">
                        <button
                            className="btn btn-sm btn-link text-dark p-0"
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            title="Previous Week"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="mx-2 small fw-bold text-muted" style={{ minWidth: '80px', textAlign: 'center' }}>
                            {weekOffset === 0 ? 'Current Week' : `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ago`}
                        </span>
                        <button
                            className="btn btn-sm btn-link text-dark p-0"
                            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                            disabled={weekOffset === 0}
                            title="Next Week"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <Bar
                        data={weeklyChartData}
                        options={weeklyOptions}
                        plugins={[horizontalLinePlugin]}
                    />
                </div>
                <div className="card-footer bg-light border-0 d-flex justify-content-between align-items-center text-muted small py-2 px-4">
                    <span>Click on any bar to see detailed breakdown.</span>
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ width: '20px', height: '0px', borderTop: '2px dashed #fd7e14' }}></div>
                        <span>Last Month Average</span>
                    </div>
                </div>
            </div>

            {/* 2. Breakdown Values Panel (Middle) */}
            <div className="card border-0 shadow-sm bg-white">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                            <PieChart size={20} className="text-success" />
                            Breakdown ({selectedHour ? `${formatDateLabel(new Date(hourlyViewDate))} @ ${selectedHour}` : selectedDate})
                        </h5>
                        <div className="d-flex gap-2">
                            {Object.entries(breakdownData).map(([key, value]) => (
                                <span key={key} className="badge bg-light text-dark border">
                                    {key}: {typeof value === 'number' ? value.toFixed(2) : value} kWh
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Visual Breakdown Bars */}
                    <div className="d-flex flex-column gap-3">
                        {Object.entries(breakdownData).map(([key, value], index) => {
                            const numValue = parseFloat(value);
                            const total = Object.values(breakdownData).reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                            const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : 0;
                            const colors = ['bg-primary', 'bg-warning', 'bg-success', 'bg-secondary'];

                            // Comparison logic
                            let comparisonMarker = null;
                            let comparisonText = null;
                            if (comparisonBreakdownData && comparisonBreakdownData[key] !== undefined) {
                                const compValue = parseFloat(comparisonBreakdownData[key]);
                                const diff = ((numValue - compValue) / compValue * 100).toFixed(1);
                                const sign = diff > 0 ? '+' : '';
                                const colorClass = diff > 0 ? 'text-danger' : 'text-success'; // Red for higher usage, Green for lower
                                let TrendIcon = Minus;
                                if (diff > 0) TrendIcon = ArrowUp;
                                if (diff < 0) TrendIcon = ArrowDown;

                                comparisonText = (
                                    <span className={`small ms-2 ${colorClass} d-flex align-items-center gap-1`} style={{ fontSize: '0.75rem' }}>
                                        (Avg: {compValue.toFixed(2)}, <TrendIcon size={10} /> {sign}{diff}%)
                                    </span>
                                );
                            }

                            return (
                                <div key={key}>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="fw-bold text-dark d-flex align-items-center">
                                            {key}
                                            {comparisonText}
                                        </span>
                                        <span className="text-muted small">{numValue.toFixed(2)} kWh ({percentage}%)</span>
                                    </div>
                                    <div className="progress position-relative" style={{ height: '10px', overflow: 'visible' }}>
                                        <div
                                            className={`progress-bar ${colors[index % colors.length]}`}
                                            role="progressbar"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Hourly Usage Line Chart (Bottom) */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        Hourly Usage ({formatDateLabel(new Date(hourlyViewDate))})
                    </h5>

                    {/* Date Picker */}
                    <input
                        type="date"
                        className="form-control form-control-sm rounded-pill border-0 bg-light fw-bold text-primary px-3"
                        value={hourlyViewDate}
                        onChange={(e) => {
                            setHourlyViewDate(e.target.value);
                            setSelectedDate(formatDateLabel(new Date(e.target.value)));
                            setSelectedHour(null);
                            setSelectedBarDate(null); // Deselect bar if manually changing date
                            setComparisonBreakdownData(null); // Reset comparison
                        }}
                        style={{ width: 'auto' }}
                    />
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <Line
                        data={hourlyChartData}
                        options={hourlyOptions}
                    />
                </div>
                <div className="card-footer bg-light border-0 text-center text-muted small py-2">
                    Click on any point to see specific hour breakdown above.
                </div>
            </div>
        </div>
    );
};

export default UsageBreakdown;
