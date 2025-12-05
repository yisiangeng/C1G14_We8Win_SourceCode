import React, { useState, useEffect } from "react";
import {
  Zap,
  Activity,
  Cloud,
  BarChart2,
  Home,
  MessageSquare,
  LayoutDashboard,
  PieChart,
  X,
  Bot,
} from "lucide-react";
import Monitoring from "./components/Monitoring";
import Forecast from "./components/Forecast";
import Overview from "./components/Overview";
import UsageBreakdown from "./components/UsageBreakdown";
import Chatbot from "./components/Chatbot";

const logo = "/vite.svg";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update date every minute to keep timeline consistent across all tabs
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Overview setActiveTab={setActiveTab} currentDate={currentDate} />
        );
      case "monitoring":
        return <Monitoring currentDate={currentDate} />;
      case "usage-breakdown":
        return (
          <UsageBreakdown
            setActiveTab={setActiveTab}
            currentDate={currentDate}
          />
        );
      case "forecast":
        return <Forecast currentDate={currentDate} />;
      default:
        return (
          <Overview setActiveTab={setActiveTab} currentDate={currentDate} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className="header-gradient">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="header-logo-container">
                <img src={logo} alt="WattsUp Logo" className="header-logo" />
              </div>
              <div>
                <h1 className="header-title">
                  WattsUp
                </h1>
                <p className="header-subtitle">
                  Stay Current, Stay Safe
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <div className="user-name">Welcome, User</div>
                <div className="user-account">Account: #88291023</div>
              </div>
              <div className="header-icon-box">
                <Zap size={28} className="header-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        className="container"
        style={{ marginTop: "-2rem", position: "relative", zIndex: 10 }}
      >
        {/* Navigation */}
        <nav className="nav-tabs">
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button
            className={`nav-item ${activeTab === "monitoring" ? "active" : ""}`}
            onClick={() => setActiveTab("monitoring")}
          >
            <Activity size={18} />
            In-time Monitoring
          </button>
          <button
            className={`nav-item ${activeTab === "usage-breakdown" ? "active" : ""
              }`}
            onClick={() => setActiveTab("usage-breakdown")}
          >
            <PieChart size={18} />
            Usage Breakdown
          </button>
          <button
            className={`nav-item ${activeTab === "forecast" ? "active" : ""}`}
            onClick={() => setActiveTab("forecast")}
          >
            <Cloud size={18} />
            Forecast
          </button>
        </nav>

        {/* Tab Content */}
        <div className="fade-in pb-24">{renderContent()}</div>
      </main>

      {/* Footer */}
      <footer className="container mt-12 py-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>© 2024 WattsUp. All rights reserved.</p>
        <p className="mt-2">
          Promoting Sustainable Energy for a Better Future.
        </p>
      </footer>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#10b981",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
        }}
      >
        {isChatOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chatbot Panel */}
      {isChatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            left: "24px",
            zIndex: 998,
            animation: "slideInUp 0.3s ease",
          }}
        >
          <Chatbot />
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
