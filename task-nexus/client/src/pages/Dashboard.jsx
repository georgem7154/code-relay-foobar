import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Building2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const API_BASE = "https://code-relay-foobar.onrender.com/api";

// Chart Colors
const COLORS = {
  todo: "#94A3B8", // Slate 400
  in_progress: "#F59E0B", // Amber 500
  review: "#8B5CF6", // Violet 500
  done: "#10B981", // Emerald 500
};

const PRIORITY_COLORS = {
  low: "#94A3B8",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexus_token");
    axios
      .get(`${API_BASE}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setStats(response.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Tasks",
      value: stats?.totalTasks || 0,
      icon: BarChart3,
      color: "#3B82F6",
    },
    {
      label: "Completed",
      value: stats?.completedTasks || 0,
      icon: CheckCircle2,
      color: "#10B981",
    },
    {
      label: "In Progress",
      value: stats?.inProgressTasks || 0,
      icon: Clock,
      color: "#F59E0B",
    },
    {
      label: "Overdue",
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      color: "#EF4444",
    },
    {
      label: "Projects",
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: "#8B5CF6",
    },
    {
      label: "Workspaces",
      value: stats?.totalWorkspaces || 0,
      icon: Building2,
      color: "#06B6D4",
    },
  ];

  // Prepare Pie Chart Data
  const pieData =
    stats?.tasksByStatus?.map((item) => ({
      name: item.status.replace("_", " ").toUpperCase(),
      value: item.count,
      key: item.status,
    })) || [];

  // Prepare Line Chart Data (Fill in missing days if necessary)
  const lineData =
    stats?.weeklyProgress?.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      completed: item.count,
    })) || [];

  return (
    <div className="dashboard-page fade-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p className="text-muted">Overview of your task management</p>
      </div>

      {/* Top Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card glass">
            <div
              className="stat-icon"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              <card.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="dashboard-charts"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* 1. Pie Chart: Task Distribution */}
        <div
          className="chart-card glass"
          style={{
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3>Task Distribution</h3>
          <div style={{ flex: 1, width: "100%", minHeight: "300px" }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.key] || "#cbd5e1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No task data available</div>
            )}
          </div>
        </div>

        {/* 2. Line Chart: Weekly Completion */}
        <div
          className="chart-card glass"
          style={{
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3>Weekly Completion Trend</h3>
          <div style={{ flex: 1, width: "100%", minHeight: "300px" }}>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lineData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                    labelStyle={{ color: "var(--text-muted)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="Tasks Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No completion activity in the last 7 days</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
