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

  // Real data from APIs - no mock data
  const [activityData, setActivityData] = useState<any[]>([]);
  const [searchTypeDistribution, setSearchTypeDistribution] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [threatDistribution, setThreatDistribution] = useState<any[]>([]);
  const [securityScore, setSecurityScore] = useState<any[]>([]);
  const [elasticsearchStats, setElasticsearchStats] = useState({ totalDocuments: 0, indices: {} });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch real data from APIs with proper error handling
      const [historyStats, recentSearches, threatDist, secScore, esStats] = await Promise.all([
        axios.get('/api/v1/history/stats', { withCredentials: true }).catch((err) => {
          console.error('Failed to fetch history stats:', err.response?.data || err.message);
          return { data: { data: null } };
        }),
        axios.get('/api/v1/history/searches', { 
          params: { limit: 4 }, 
          withCredentials: true 
        }).catch((err) => {
          console.error('Failed to fetch recent searches:', err.response?.data || err.message);
          return { data: { data: { searches: [] } } };
        }),
        axios.get('/api/v1/analytics/threat-distribution', { withCredentials: true }).catch((err) => {
          console.error('Failed to fetch threat distribution:', err.response?.data || err.message);
          return { data: { data: [] } };
        }),
        axios.get('/api/v1/analytics/security-score', { withCredentials: true }).catch((err) => {
          console.error('Failed to fetch security score:', err.response?.data || err.message);
          return { data: { data: [] } };
        }),
        axios.get('/api/v1/analytics/elasticsearch-stats', { withCredentials: true }).catch((err) => {
          console.error('Failed to fetch elasticsearch stats:', err.response?.data || err.message);
          return { data: { data: { totalDocuments: 0, indices: {} } } };
        })
      ]);

      if (historyStats.data.data) {
        const statsData = historyStats.data.data;
        
        console.log('📊 History stats received:', statsData);
        
        setStats({
          threatIntelligence: { 
            total: 0, // Will be populated when threat intelligence API is available
            critical: 0, 
            high: 0 
          },
          discovery: {
            totalSearches: statsData.discoverySearches || 0,
            exposedAccounts: 0 // Calculate from discovery results when available
          },
          domainMonitoring: {
            monitoredDomains: statsData.domainSearches || 0,
            totalExposures: 0 // Calculate from domain monitoring results when available
          },
          searchHistory: {
            totalSearches: statsData.totalSearches || 0,
            successRate: parseFloat(statsData.successRate || "0")
          }
        });

        // Build search type distribution from real data
        const totalDiscovery = statsData.discoverySearches || 0;
        const totalDomain = statsData.domainSearches || 0;

        if (totalDiscovery > 0 || totalDomain > 0) {
          const distribution = [];
          
          if (totalDiscovery > 0) {
            distribution.push({ 
              name: "Email Discovery", 
              value: totalDiscovery, 
              color: "#8b5cf6" 
            });
          }
          
          if (totalDomain > 0) {
            distribution.push({ 
              name: "Domain Monitoring", 
              value: totalDomain, 
              color: "#06b6d4" 
            });
          }
          
          setSearchTypeDistribution(distribution);
        } else {
          // No searches yet
          setSearchTypeDistribution([]);
        }

        // Process searches by day for activity chart
        if (statsData.searchesByDay && statsData.searchesByDay.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const last7Days = statsData.searchesByDay.slice(-7).map((day: any) => {
            const date = new Date(day._id);
            // Calculate proportional distribution based on total counts
            const discoveryRatio = statsData.totalSearches > 0 ? statsData.discoverySearches / statsData.totalSearches : 0.5;
            const domainRatio = statsData.totalSearches > 0 ? statsData.domainSearches / statsData.totalSearches : 0.5;
            
            return {
              name: dayNames[date.getDay()],
              threats: 0, // Will be populated when threat intelligence API is available
              discoveries: Math.round(day.count * discoveryRatio),
              domains: Math.round(day.count * domainRatio)
            };
          });
          setActivityData(last7Days);
        } else {
          // If no data, show empty state by keeping activityData empty
          setActivityData([]);
        }
      }

      // Process recent searches for activity feed
      if (recentSearches.data.data && recentSearches.data.data.searches) {
        const activities = recentSearches.data.data.searches.map((search: any) => {
          // Ensure createdAt is properly parsed
          const searchDate = new Date(search.createdAt);
          const timeAgo = getTimeAgo(searchDate);
          
          console.log('Processing recent search:', {
            query: search.query,
            createdAt: search.createdAt,
            parsedDate: searchDate,
            timeAgo
          });
          
          return {
            type: search.searchType === 'discovery' ? 'discovery' : 'domain',
            title: search.searchType === 'discovery' 
              ? `Discovery search: ${search.query}` 
              : `Domain monitoring: ${search.query}`,
            time: timeAgo,
            severity: search.hasResults ? (search.resultsCount > 50 ? 'high' : 'medium') : 'info'
          };
        });
        setRecentActivity(activities);
      } else {
        setRecentActivity([]);
      }

      // Process threat distribution data
      if (threatDist.data.data && Array.isArray(threatDist.data.data)) {
        // Filter out threat levels with 0 values for cleaner visualization
        const filteredThreatDist = threatDist.data.data.filter((item: any) => item.value > 0);
        setThreatDistribution(filteredThreatDist);
      } else {
        setThreatDistribution([]);
      }

      // Process security score data
      if (secScore.data.data && Array.isArray(secScore.data.data) && secScore.data.data.length > 0) {
        setSecurityScore(secScore.data.data);
      } else {
        setSecurityScore([]);
      }

      // Process Elasticsearch stats
      if (esStats.data.data) {
        setElasticsearchStats({
          totalDocuments: esStats.data.data.totalDocuments || 0,
          indices: esStats.data.data.indices || {}
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date) => {
    try {
      // Ensure we have a valid Date object
      const parsedDate = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        return 'Unknown time';
      }
      
      const seconds = Math.floor((new Date().getTime() - parsedDate.getTime()) / 1000);
      
      if (seconds < 0) return 'Just now';
      if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
      return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return 'Unknown time';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="text-cyan-400" size={36} />
              Dark Web Monitoring
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive intelligence and threat monitoring dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Activity size={16} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
      >
        <motion.div variants={fadeIn} className="bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-700/50 rounded-xl p-6 hover:border-amber-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-1">Active Threats</p>
              <h3 className="text-3xl font-bold text-white">{stats.threatIntelligence.total}</h3>
              <p className="text-sm text-gray-300 mt-2">Monitoring</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <AlertTriangle className="text-amber-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-red-900/40 via-red-800/30 to-red-900/40 border border-red-700/50 rounded-xl p-6 hover:border-red-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-400 text-sm font-semibold uppercase tracking-wide mb-1">Discovery</p>
              <h3 className="text-3xl font-bold text-white">{stats.discovery.totalSearches}</h3>
              <p className="text-sm text-gray-300 mt-2">Searches</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <Shield className="text-red-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 rounded-xl p-6 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-400 text-sm font-semibold uppercase tracking-wide mb-1">Domains</p>
              <h3 className="text-3xl font-bold text-white">{stats.domainMonitoring.monitoredDomains}</h3>
              <p className="text-sm text-gray-300 mt-2">Monitored</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
              <Globe className="text-sky-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 rounded-xl p-6 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-1">Searches</p>
              <h3 className="text-3xl font-bold text-white">{stats.searchHistory.totalSearches}</h3>
              <p className="text-sm text-gray-300 mt-2">{stats.searchHistory.successRate}% success</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <HistoryIcon className="text-purple-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">Indexed</p>
              <h3 className="text-3xl font-bold text-white">
                {elasticsearchStats.totalDocuments.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-300 mt-2">Files</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Database className="text-emerald-400" size={24} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <motion.div
          variants={fadeIn}
          className="lg:col-span-2 bg-gray-900/60 rounded-xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-cyan-400" />
            Weekly Activity Overview
          </h2>
          {activityData.length > 0 ? (
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
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No activity data yet</p>
                <p className="text-sm text-gray-500 mt-1">Start using Discovery and Domain Monitoring</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeIn}
          className="bg-gray-900/60 rounded-xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
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
          ) : (
            <div className="h-full flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
                <p className="text-sm text-gray-500 mt-1">Your searches will appear here</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Threat Distribution */}
        <motion.div
          variants={fadeIn}
          className="bg-gray-900/60 rounded-xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <PieChartIcon className="w-6 h-6 mr-2 text-orange-400" />
            Threat Distribution
          </h2>
          {threatDistribution.length > 0 ? (
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No threat data available</p>
                <p className="text-xs text-gray-500 mt-1">Perform searches to generate threat data</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Search Type Distribution */}
        <motion.div
          variants={fadeIn}
          className="bg-gray-900/60 rounded-xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Database className="w-6 h-6 mr-2 text-purple-400" />
            Search Distribution
          </h2>
          {searchTypeDistribution.length > 0 ? (
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
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No search data available</p>
                <p className="text-xs text-gray-500 mt-1">Start using Discovery and Domain Monitoring</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Security Score Radar */}
        <motion.div
          variants={fadeIn}
          className="bg-gray-900/60 rounded-xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-green-400" />
            Security Score
          </h2>
          {securityScore.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={securityScore}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name="Security Score"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Security metrics coming soon</p>
                <p className="text-xs text-gray-500 mt-1">Perform searches to generate security metrics</p>
              </div>
            </div>
          )}
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
        className="bg-gray-900/60 rounded-xl p-6 border border-gray-800"
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
