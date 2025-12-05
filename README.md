# WattsUp ⚡

**WattsUp** is a comprehensive energy monitoring and analytics dashboard designed to empower users with real-time insights into their energy consumption. Aligned with **SDG 7 (Affordable and Clean Energy)**, it helps users stay current with their usage patterns and make informed decisions to optimize efficiency.

## 🚀 Features

- **Overview Dashboard**: High-level summary of energy performance, including weekly comparisons and daily breakdowns.
- **Real-time Monitoring**: Live tracking of energy usage to identify immediate spikes or anomalies.
- **Usage Breakdown**: Detailed analysis of energy consumption by category (e.g., AC, Kitchen, Laundry).
- **Smart Forecasting**:
  - **7-Day Energy Forecast**: Predict future consumption to plan ahead.
  - **24-Hour Efficiency Forecast**: Optimize appliance usage based on predicted efficiency.
- **Interactive Chatbot**: AI-powered assistant to answer questions about usage, provide tips, and explain anomalies.

## 🛠️ Tech Stack

### Frontend
- **React** (Vite)
- **Chart.js** & **React-Chartjs-2** for visualizations
- **Lucide React** for icons
- **Bootstrap** & **Custom CSS** for styling

### Backend & ML
- **FastAPI**: Main API for serving ML predictions and energy data (`ML/app.py`).
- **Flask**: Additional backend services (`backend/run.py`).
- **Python Libraries**: Pandas, NumPy, Scikit-learn, Statsmodels.

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** (comes with Node.js)

## ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd C1G14_We8Win_SourceCode
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## ▶️ Running the Application

The easiest way to run the entire stack (Frontend + Backend + ML Server) is using the provided script:

```bash
python run_all.py
```

This script will automatically start:
1.  **Flask Backend**
2.  **FastAPI ML Server** (Port 8000)
3.  **Vite Frontend** (Port 5173)

Access the application at: `http://localhost:5173`

## 📂 Project Structure

```
├── ML/                     # Machine Learning models & FastAPI app
│   ├── app.py              # Main FastAPI entry point
│   ├── predictor.py        # Energy prediction logic
│   └── ...
├── backend/                # Flask backend service
├── src/                    # React Frontend source code
│   ├── components/         # UI Components (Overview, Monitoring, etc.)
│   ├── App.jsx             # Main application component
│   └── ...
├── public/                 # Static assets
├── run_all.py              # Startup script for all services
└── requirements.txt        # Python dependencies
```

## 🔌 API Endpoints (FastAPI)

The ML server runs on `http://localhost:8000`. Key endpoints include:

- `GET /compare_weeks`: Compare current week's usage vs last week.
- `GET /get_energy_performance`: Get daily sub-metering breakdown.
- `GET /predict_next_7_days`: 7-day energy consumption forecast.
- `GET /predict_next_24_hours`: Hourly energy forecast for the next day.
- `GET /efficiency_24_hours`: 24-hour efficiency trend.
- `GET /get_month_average`: Monthly energy usage summary.

---
*Promoting Sustainable Energy for a Better Future.*
