import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Layers,
  Globe,
  Server,
  Lock,
  FileText,
  Calendar,
  Zap,
  BarChart3,
} from 'lucide-react';

interface DashboardStats {
  totalScans: number;
  completedScans: number;
  runningScans: number;
  failedScans: number;
  totalTargets: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  avgScanDuration: number;
  scansOverTime: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  riskLevels: Array<{ level: string; count: number }>;
  topTargets: Array<{ target: string; scans: number; lastScan: string }>;
  vulnerabilityTrends: Array<{ date: string; critical: number; high: number; medium: number; low: number }>;
  recentActivity: Array<{
    jobId: string;
    target: string;
    status: string;
    startTime: string;
    vulnerabilities?: number;
  }>;
}

const OsintPlatformPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/assessment/dashboard/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    finished: '#10b981',
    running: '#f59e0b',
    failed: '#ef4444',
    pending: '#6b7280',
    aborted: '#8b5cf6',
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-jetBlack text-coolWhite flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-400"></div>
          <p className="text-gray-400">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-xl font-bold text-center mb-2">Error Loading Dashboard</h2>
            <p className="text-center text-red-300">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="mt-4 mx-auto block px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <Shield className="mx-auto mb-4 text-gray-500" size={64} />
          <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-400 mb-6">Start your first assessment to see analytics</p>
          <button
            onClick={() => navigate('/osint/assessment')}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="text-sky-400" size={36} />
              OSINT Platform Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive overview of your security assessments and intelligence gathering
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
            </div>
            <button
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Activity size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Scans */}
        <div className="bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 rounded-xl p-6 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Total Scans
              </p>
              <h3 className="text-4xl font-bold text-white">{stats.totalScans}</h3>
              <p className="text-sm text-gray-300 mt-2">
                {stats.completedScans} completed
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
              <Target className="text-sky-400" size={24} />
            </div>
          </div>
        </div>

        {/* Active Scans */}
        <div className="bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-700/50 rounded-xl p-6 hover:border-amber-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Active Scans
              </p>
              <h3 className="text-4xl font-bold text-white">{stats.runningScans}</h3>
              <p className="text-sm text-gray-300 mt-2">
                Currently running
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <Clock className="text-amber-400 animate-pulse" size={24} />
            </div>
          </div>
        </div>

        {/* Total Vulnerabilities */}
        <div className="bg-gradient-to-br from-red-900/40 via-red-800/30 to-red-900/40 border border-red-700/50 rounded-xl p-6 hover:border-red-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Vulnerabilities
              </p>
              <h3 className="text-4xl font-bold text-white">{stats.totalVulnerabilities}</h3>
              <p className="text-sm text-gray-300 mt-2">
                {stats.criticalVulnerabilities} critical
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Avg Duration
              </p>
              <h3 className="text-4xl font-bold text-white">
                {Math.round(stats.avgScanDuration / 60)}m
              </h3>
              <p className="text-sm text-gray-300 mt-2">
                Per scan
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Zap className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Scan Status Distribution */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="text-sky-400" size={20} />
            Scan Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scans Over Time */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            Scans Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.scansOverTime}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Levels */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="text-purple-400" size={20} />
            Risk Level Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.riskLevels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="level" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vulnerability Trends */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-red-400" size={20} />
            Vulnerability Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.vulnerabilityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Targets and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Targets */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="text-cyan-400" size={20} />
            Most Scanned Targets
          </h3>
          <div className="space-y-3">
            {stats.topTargets.length > 0 ? (
              stats.topTargets.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.target}</p>
                    <p className="text-xs text-gray-400">
                      Last scan: {new Date(item.lastScan).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-400">{item.scans}</p>
                    <p className="text-xs text-gray-400">scans</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No targets scanned yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-amber-400" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                  onClick={() => navigate(`/osint/assessment/output?jobId=${item.jobId}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'finished'
                          ? 'bg-emerald-400'
                          : item.status === 'running'
                          ? 'bg-amber-400 animate-pulse'
                          : item.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.target}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.vulnerabilities !== undefined && (
                      <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">
                        {item.vulnerabilities} vulns
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.status === 'finished'
                          ? 'bg-emerald-700 text-emerald-100'
                          : item.status === 'running'
                          ? 'bg-amber-700 text-amber-100'
                          : item.status === 'failed'
                          ? 'bg-red-700 text-red-100'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/osint/assessment')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 hover:border-emerald-500/70 transition-all duration-300 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
              <Zap className="text-emerald-400" size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white">New Assessment</h4>
              <p className="text-sm text-gray-300">Start a new scan</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/osint/assessment/history')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 hover:border-purple-500/70 transition-all duration-300 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
              <FileText className="text-purple-400" size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white">View History</h4>
              <p className="text-sm text-gray-300">Browse past scans</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/osint/assessment/output')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 hover:border-sky-500/70 transition-all duration-300 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center group-hover:bg-sky-600/30 transition-colors">
              <BarChart3 className="text-sky-400" size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white">View Output</h4>
              <p className="text-sm text-gray-300">See scan results</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OsintPlatformPage;
