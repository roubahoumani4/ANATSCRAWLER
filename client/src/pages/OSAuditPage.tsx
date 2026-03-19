import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Building2,
  Network,
  Package,
  Server,
  Activity,
  TrendingUp,
  ArrowRight,
  Monitor,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import axios from "axios";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface Summary {
  totalCompanies: number;
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  totalPackages: number;
  totalReports: number;
  recentCompanies: any[];
  companyDistribution: { name: string; devices: number }[];
}

const OSAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalCompanies: 0,
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    totalPackages: 0,
    totalReports: 0,
    recentCompanies: [],
    companyDistribution: []
  });
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeMachines: 0,
    inactiveMachines: 0,
    totalReports: 0,
    averageAuditScore: 0,
    totalWarnings: 0,
    totalSuggestions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, statsRes] = await Promise.all([
        axios.get('/api/v1/os-audit/companies-summary', { withCredentials: true }).catch(() => ({ data: { summary: {} } })),
        axios.get('/api/v1/os-audit/stats', { withCredentials: true }).catch(() => ({ data: { stats: {} } }))
      ]);
      setSummary(summaryRes.data.summary || {});
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error("Error fetching OS Audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const deviceStatusData = [
    { name: 'Active', value: summary.activeDevices || stats.activeMachines || 0, color: '#10b981' },
    { name: 'Inactive', value: summary.inactiveDevices || stats.inactiveMachines || 0, color: '#ef4444' },
    { name: 'Pending', value: Math.max(0, (summary.totalDevices || stats.totalMachines || 0) - (summary.activeDevices || stats.activeMachines || 0) - (summary.inactiveDevices || stats.inactiveMachines || 0)), color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const features = [
    {
      title: "Company Management",
      description: "Create and manage companies. Register organizations, set contact details, and link devices to companies.",
      icon: <Building2 className="w-8 h-8" />,
      color: "from-cyan-500 to-blue-600",
      path: "/os-audit/companies",
      stats: {
        label: "Companies",
        value: summary.totalCompanies || 0,
        trend: "Registered",
        trendUp: true
      },
      highlights: [
        `${summary.totalCompanies || 0} Companies registered`,
        "Sector-based classification",
        "Full contact management"
      ]
    },
    {
      title: "Network Devices",
      description: "View all devices across companies. Monitor active network, manage deleted devices, and view detailed device info.",
      icon: <Network className="w-8 h-8" />,
      color: "from-emerald-500 to-green-600",
      path: "/os-audit/network",
      stats: {
        label: "Devices",
        value: summary.totalDevices || stats.totalMachines || 0,
        trend: `${summary.activeDevices || stats.activeMachines || 0} active`,
        trendUp: true
      },
      highlights: [
        `${summary.activeDevices || stats.activeMachines || 0} Active devices`,
        "Active & deleted network view",
        "Full device details"
      ]
    },
    {
      title: "Installation Packages",
      description: "Create and distribute agent installation packages. Download Linux and Windows agents linked to companies.",
      icon: <Package className="w-8 h-8" />,
      color: "from-purple-500 to-indigo-600",
      path: "/os-audit/packages",
      stats: {
        label: "Packages",
        value: summary.totalPackages || 0,
        trend: "Available",
        trendUp: true
      },
      highlights: [
        `${summary.totalPackages || 0} Packages created`,
        "Linux & Windows agents",
        "Company-linked distribution"
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-jetBlack flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coolWhite/10 border-t-crimsonRed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coolWhite/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-jetBlack text-coolWhite p-6">
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="text-cyan-400" size={36} />
              OS Audit
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive OS security auditing and device management dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <motion.div variants={fadeIn} className="bg-gradient-to-br from-cyan-900/40 via-cyan-800/30 to-cyan-900/40 border border-cyan-700/50 rounded-xl p-6 hover:border-cyan-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer"
          onClick={() => navigate('/os-audit/companies')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wide mb-1">Companies</p>
              <h3 className="text-3xl font-bold text-white">{summary.totalCompanies || 0}</h3>
              <p className="text-sm text-gray-300 mt-2">Registered</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
              <Building2 className="text-cyan-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
          onClick={() => navigate('/os-audit/network')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">Active Devices</p>
              <h3 className="text-3xl font-bold text-white">{summary.activeDevices || stats.activeMachines || 0}</h3>
              <p className="text-sm text-gray-300 mt-2">{summary.totalDevices || stats.totalMachines || 0} total</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Server className="text-emerald-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 rounded-xl p-6 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
          onClick={() => navigate('/os-audit/packages')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-1">Packages</p>
              <h3 className="text-3xl font-bold text-white">{summary.totalPackages || 0}</h3>
              <p className="text-sm text-gray-300 mt-2">Installation</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Package className="text-purple-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-700/50 rounded-xl p-6 hover:border-amber-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-1">Reports</p>
              <h3 className="text-3xl font-bold text-white">{summary.totalReports || stats.totalReports || 0}</h3>
              <p className="text-sm text-gray-300 mt-2">Generated</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <BarChart3 className="text-amber-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 rounded-xl p-6 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-400 text-sm font-semibold uppercase tracking-wide mb-1">Avg Score</p>
              <h3 className="text-3xl font-bold text-white">{stats.averageAuditScore || 0}</h3>
              <p className="text-sm text-gray-300 mt-2">/100</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
              <Shield className="text-sky-400" size={24} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Device Status Distribution */}
        <motion.div variants={fadeIn} className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-cyan-400" />
            Device Status Distribution
          </h2>
          {deviceStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {deviceStatusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs text-gray-400">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <Server className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No device data yet</p>
                <p className="text-sm text-gray-500 mt-1">Register machines to see status distribution</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Company Device Distribution */}
        <motion.div variants={fadeIn} className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
            Devices by Company
          </h2>
          {summary.companyDistribution && summary.companyDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary.companyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="devices" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No company data yet</p>
                <p className="text-sm text-gray-500 mt-1">Create companies and register devices</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Feature Cards - Same style as DarkWebMonitoringPage */}
      <motion.div variants={staggerContainer} className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Monitor className="w-7 h-7 mr-2 text-cyan-400" />
          Audit Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-400/30 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white`}>
                    {feature.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{feature.stats.value}</div>
                    <div className="text-xs text-gray-400">{feature.stats.label}</div>
                    <div className="text-xs flex items-center justify-end mt-1 text-green-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {feature.stats.trend}
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {feature.description}
                </p>

                <div className="space-y-2 mb-4">
                  {feature.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></div>
                      {highlight}
                    </div>
                  ))}
                </div>

                <button className="w-full py-2 px-4 rounded-lg bg-jetBlack border border-coolWhite/10 hover:border-cyan-400/50 text-coolWhite flex items-center justify-center space-x-2 group-hover:bg-cyan-400/10 transition-all duration-300">
                  <span>Access Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Companies */}
      {summary.recentCompanies && summary.recentCompanies.length > 0 && (
        <motion.div variants={fadeIn} className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-cyan-400" />
              Recent Companies
            </h2>
            <button onClick={() => navigate('/os-audit/companies')}
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {summary.recentCompanies.map((company: any, index: number) => (
              <div key={company._id || index}
                className="flex items-center justify-between p-3 rounded-lg bg-jetBlack/50 border border-coolWhite/5 hover:border-coolWhite/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Building2 className="text-cyan-400" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.sector} &middot; {company.email}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(company.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* System Status */}
      <motion.div variants={fadeIn} className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
          Audit Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Audit Agent</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-lg font-semibold text-green-500">Operational</div>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Warnings</span>
              <AlertTriangle className="text-amber-400" size={16} />
            </div>
            <div className="text-lg font-semibold text-amber-500">{stats.totalWarnings || 0}</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Suggestions</span>
              <Activity className="text-blue-400" size={16} />
            </div>
            <div className="text-lg font-semibold text-blue-500">{stats.totalSuggestions || 0}</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Database</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-lg font-semibold text-green-500">Connected</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OSAuditPage;
