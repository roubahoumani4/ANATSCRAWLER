import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faUser,
  faCalendar,
  faClock,
  faDatabase,
  faChartBar,
  faFilter,
  faDownload,
  faEye,
  faTrash,
  faEdit,
  faCog,
  faPlus,
  faSync,
  faSearch,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  category: string;
  resource: string;
  details: any;
  status: "success" | "error" | "warning";
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AdminStats {
  totalActions: number;
  successRate: number;
  mostActiveAdmin: string;
  actionsByCategory: { category: string; count: number }[];
  actionsOverTime: { date: string; count: number }[];
  recentActions: AdminLog[];
}

const AdminLogsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Fetch admin logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [
      "/api/v1/admin/elasticsearch/logs",
      selectedCategory,
      selectedStatus,
      searchQuery,
      dateRange,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchQuery) params.append("search", searchQuery);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/logs?${params.toString()}`,
        { withCredentials: true }
      );
      return response.data.logs as AdminLog[];
    },
  });

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/logs/stats"],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/logs/stats`,
        { withCredentials: true }
      );
      return response.data as AdminStats;
    },
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "index", label: "Index Management" },
    { value: "ilm", label: "ILM Policies" },
    { value: "snapshot", label: "Snapshots" },
    { value: "purge", label: "Data Purging" },
    { value: "performance", label: "Performance" },
    { value: "query", label: "Queries" },
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "success", label: "Success" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("add")) return faPlus;
    if (action.includes("delete") || action.includes("remove")) return faTrash;
    if (action.includes("update") || action.includes("edit")) return faEdit;
    if (action.includes("view") || action.includes("get")) return faEye;
    if (action.includes("optimize") || action.includes("merge")) return faCog;
    if (action.includes("snapshot") || action.includes("backup")) return faSync;
    return faDatabase;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-coolWhite";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return faCheckCircle;
      case "error":
        return faTimesCircle;
      case "warning":
        return faExclamationTriangle;
      default:
        return faCheckCircle;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      index: "bg-blue-500/20 text-blue-400",
      ilm: "bg-purple-500/20 text-purple-400",
      snapshot: "bg-green-500/20 text-green-400",
      purge: "bg-red-500/20 text-red-400",
      performance: "bg-orange-500/20 text-orange-400",
      query: "bg-cyan-500/20 text-cyan-400",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const exportLogs = () => {
    if (!logs) return;
    
    const csv = [
      ["Timestamp", "Admin", "Action", "Category", "Resource", "Status", "Details"].join(","),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.adminEmail,
          log.action,
          log.category,
          log.resource,
          log.status,
          JSON.stringify(log.details).replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

  return (
    <div className="relative min-h-screen bg-jetBlack text-coolWhite overflow-hidden">
      <MatrixBackground />

      <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FontAwesomeIcon icon={faClipboardList} className="text-emerald-400" />
            Admin Activity Logs
          </h1>
          <p className="text-coolWhite/70">
            Track and monitor all administrative actions in Index Management
          </p>
        </motion.div>

        {/* Statistics Dashboard */}
        {!statsLoading && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Actions */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faChartBar} className="text-emerald-400 text-2xl" />
                <span className="text-sm text-coolWhite/60">Total</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalActions.toLocaleString()}
              </div>
              <div className="text-sm text-coolWhite/70">Admin Actions</div>
            </div>

            {/* Success Rate */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
                <span className="text-sm text-coolWhite/60">Rate</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-coolWhite/70">Success Rate</div>
            </div>

            {/* Most Active Admin */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUser} className="text-blue-400 text-2xl" />
                <span className="text-sm text-coolWhite/60">Top</span>
              </div>
              <div className="text-xl font-bold text-white mb-1 truncate">
                {stats.mostActiveAdmin}
              </div>
              <div className="text-sm text-coolWhite/70">Most Active Admin</div>
            </div>

            {/* Recent Activity */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faClock} className="text-purple-400 text-2xl" />
                <span className="text-sm text-coolWhite/60">Latest</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {stats.recentActions.length}
              </div>
              <div className="text-sm text-coolWhite/70">Recent Actions</div>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Actions by Category - Pie Chart */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Actions by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.actionsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.actionsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #10b981",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Actions Over Time - Line Chart */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Activity Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.actionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid #10b981",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-jetBlack [&>option]:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-jetBlack [&>option]:text-white"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-coolWhite/40"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportLogs}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Logs
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-jetBlack/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Resource
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    </td>
                  </tr>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-jetBlack/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-coolWhite/70">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-emerald-400" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {log.adminName}
                            </div>
                            <div className="text-xs text-coolWhite/60">
                              {log.adminEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={getActionIcon(log.action)}
                            className="text-blue-400"
                          />
                          <span className="text-sm text-white">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-coolWhite/70">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={getStatusIcon(log.status)}
                            className={getStatusColor(log.status)}
                          />
                          <span
                            className={`text-sm font-medium ${getStatusColor(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-sm text-emerald-400 hover:text-emerald-300"
                          onClick={() => {
                            alert(JSON.stringify(log.details, null, 2));
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-coolWhite/60">
                        No logs found matching the filters
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
