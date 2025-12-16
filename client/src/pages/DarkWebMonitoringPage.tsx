import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Shield,
  AlertTriangle,
  Globe,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Search,
  Database,
  Eye,
  Lock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Users
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import axios from "axios";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const DarkWebMonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    threatIntelligence: { total: 0, critical: 0, high: 0 },
    discovery: { totalSearches: 0, exposedAccounts: 0 },
    domainMonitoring: { monitoredDomains: 0, totalExposures: 0 },
    searchHistory: { totalSearches: 0, successRate: 0 }
  });

  // Mock data for charts - replace with real API data
  const [activityData, setActivityData] = useState([
    { name: "Mon", threats: 45, discoveries: 28, domains: 15 },
    { name: "Tue", threats: 52, discoveries: 35, domains: 22 },
    { name: "Wed", threats: 38, discoveries: 42, domains: 18 },
    { name: "Thu", threats: 65, discoveries: 38, domains: 28 },
    { name: "Fri", threats: 48, discoveries: 45, domains: 20 },
    { name: "Sat", threats: 35, discoveries: 30, domains: 12 },
    { name: "Sun", threats: 42, discoveries: 32, domains: 16 }
  ]);

  const [threatDistribution, setThreatDistribution] = useState([
    { name: "Critical", value: 12, color: "#ef4444" },
    { name: "High", value: 28, color: "#f97316" },
    { name: "Medium", value: 45, color: "#eab308" },
    { name: "Low", value: 35, color: "#3b82f6" }
  ]);

  const [searchTypeDistribution, setSearchTypeDistribution] = useState([
    { name: "Email Discovery", value: 45, color: "#8b5cf6" },
    { name: "Domain Monitoring", value: 35, color: "#06b6d4" },
    { name: "Threat Intel", value: 20, color: "#f59e0b" }
  ]);

  const [securityScore, setSecurityScore] = useState([
    { category: "Threat Detection", score: 85 },
    { category: "Data Protection", score: 78 },
    { category: "Monitoring Coverage", score: 92 },
    { category: "Response Time", score: 88 },
    { category: "Intelligence Quality", score: 80 }
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { type: "threat", title: "New threat detected", time: "2 min ago", severity: "high" },
    { type: "discovery", title: "Email exposure found", time: "15 min ago", severity: "critical" },
    { type: "domain", title: "Domain breach detected", time: "1 hour ago", severity: "high" },
    { type: "search", title: "New search completed", time: "2 hours ago", severity: "info" }
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch real data from APIs
      const [historyStats] = await Promise.all([
        axios.get('/api/v1/history/stats').catch(() => ({ data: { data: null } }))
      ]);

      if (historyStats.data.data) {
        setStats(prev => ({
          ...prev,
          searchHistory: {
            totalSearches: historyStats.data.data.totalSearches || 0,
            successRate: parseFloat(historyStats.data.data.successRate || "0")
          },
          discovery: {
            totalSearches: historyStats.data.data.discoverySearches || 0,
            exposedAccounts: 0
          },
          domainMonitoring: {
            monitoredDomains: historyStats.data.data.domainSearches || 0,
            totalExposures: 0
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Feature cards configuration
  const features = [
    {
      title: "Threat Intelligence",
      description: "Monitor and analyze emerging threats from dark web sources with real-time intelligence feeds.",
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "from-orange-500 to-red-600",
      path: "/threat-intelligence",
      stats: {
        label: "Active Threats",
        value: stats.threatIntelligence.total,
        trend: "+12%",
        trendUp: true
      },
      highlights: [
        `${stats.threatIntelligence.critical} Critical alerts`,
        `${stats.threatIntelligence.high} High priority items`,
        "Real-time monitoring"
      ]
    },
    {
      title: "Discovery",
      description: "Search for exposed credentials, emails, and sensitive data across breach databases.",
      icon: <Shield className="w-8 h-8" />,
      color: "from-red-500 to-pink-600",
      path: "/discovery",
      stats: {
        label: "Searches Conducted",
        value: stats.discovery.totalSearches,
        trend: "+8%",
        trendUp: true
      },
      highlights: [
        `${stats.discovery.exposedAccounts} Exposures found`,
        "Multi-database search",
        "Instant breach alerts"
      ]
    },
    {
      title: "Domain Monitoring",
      description: "Track domain-level exposures and monitor organization-wide security posture continuously.",
      icon: <Globe className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-600",
      path: "/domain-monitoring",
      stats: {
        label: "Monitored Domains",
        value: stats.domainMonitoring.monitoredDomains,
        trend: "+5%",
        trendUp: true
      },
      highlights: [
        `${stats.domainMonitoring.totalExposures} Total exposures`,
        "Continuous monitoring",
        "Risk scoring"
      ]
    },
    {
      title: "Search History",
      description: "Access comprehensive logs of all searches with detailed analytics and insights.",
      icon: <HistoryIcon className="w-8 h-8" />,
      color: "from-purple-500 to-indigo-600",
      path: "/search-history",
      stats: {
        label: "Total Searches",
        value: stats.searchHistory.totalSearches,
        trend: `${stats.searchHistory.successRate}% success`,
        trendUp: stats.searchHistory.successRate > 80
      },
      highlights: [
        "Complete audit trail",
        "Advanced filtering",
        "Export capabilities"
      ]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-500/10";
      case "high": return "text-orange-500 bg-orange-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      case "info": return "text-blue-500 bg-blue-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "threat": return <AlertTriangle className="w-4 h-4" />;
      case "discovery": return <Shield className="w-4 h-4" />;
      case "domain": return <Globe className="w-4 h-4" />;
      case "search": return <Search className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

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
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-jetBlack text-coolWhite p-6"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Activity className="w-10 h-10 mr-3 text-cyan-400" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Dark Web Monitoring
              </h1>
              <p className="text-gray-400 mt-1">
                Comprehensive intelligence and threat monitoring dashboard
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Last Updated</div>
            <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={fadeIn} className="bg-darkGray rounded-xl p-6 border border-coolWhite/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.threatIntelligence.total}</div>
          <div className="text-sm text-gray-400">Active Threats</div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-darkGray rounded-xl p-6 border border-coolWhite/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.discovery.totalSearches}</div>
          <div className="text-sm text-gray-400">Discovery Searches</div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-darkGray rounded-xl p-6 border border-coolWhite/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.domainMonitoring.monitoredDomains}</div>
          <div className="text-sm text-gray-400">Monitored Domains</div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-darkGray rounded-xl p-6 border border-coolWhite/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <HistoryIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-sm text-green-500">
              {stats.searchHistory.successRate}% success
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.searchHistory.totalSearches}</div>
          <div className="text-sm text-gray-400">Total Searches</div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <motion.div
          variants={fadeIn}
          className="lg:col-span-2 bg-darkGray rounded-xl p-6 border border-coolWhite/10"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-cyan-400" />
            Weekly Activity Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDiscoveries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDomains" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorThreats)"
                name="Threats"
              />
              <Area
                type="monotone"
                dataKey="discoveries"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDiscoveries)"
                name="Discoveries"
              />
              <Area
                type="monotone"
                dataKey="domains"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#colorDomains)"
                name="Domains"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeIn}
          className="bg-darkGray rounded-xl p-6 border border-coolWhite/10"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-jetBlack/50 border border-coolWhite/5 hover:border-coolWhite/10 transition-colors"
              >
                <div className={`p-2 rounded-lg ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coolWhite truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Threat Distribution */}
        <motion.div
          variants={fadeIn}
          className="bg-darkGray rounded-xl p-6 border border-coolWhite/10"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <PieChartIcon className="w-6 h-6 mr-2 text-orange-400" />
            Threat Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={threatDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {threatDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Search Type Distribution */}
        <motion.div
          variants={fadeIn}
          className="bg-darkGray rounded-xl p-6 border border-coolWhite/10"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Database className="w-6 h-6 mr-2 text-purple-400" />
            Search Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={searchTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {searchTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Security Score Radar */}
        <motion.div
          variants={fadeIn}
          className="bg-darkGray rounded-xl p-6 border border-coolWhite/10"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-green-400" />
            Security Score
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={securityScore}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="category" stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis stroke="#9ca3af" />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <motion.div variants={staggerContainer} className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Eye className="w-7 h-7 mr-2 text-cyan-400" />
          Monitoring Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="bg-darkGray rounded-xl overflow-hidden border border-coolWhite/10 hover:border-cyan-400/30 transition-all duration-300 group cursor-pointer"
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
                    <div className={`text-xs flex items-center justify-end mt-1 ${
                      feature.stats.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {feature.stats.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
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
                
                <button
                  className="w-full py-2 px-4 rounded-lg bg-jetBlack border border-coolWhite/10 hover:border-cyan-400/50 text-coolWhite flex items-center justify-center space-x-2 group-hover:bg-cyan-400/10 transition-all duration-300"
                >
                  <span>Access Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        variants={fadeIn}
        className="bg-darkGray rounded-xl p-6 border border-coolWhite/10"
      >
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Lock className="w-6 h-6 mr-2 text-green-400" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">API Services</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-lg font-semibold text-green-500">Operational</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Database</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-lg font-semibold text-green-500">Connected</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Monitoring</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-lg font-semibold text-green-500">Active</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Updates</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="text-lg font-semibold text-blue-500">Up to date</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DarkWebMonitoringPage;
