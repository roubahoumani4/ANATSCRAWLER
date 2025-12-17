import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, Activity, Database, Search, Users, TrendingUp, 
  Eye, Skull, Globe, Terminal, Zap, AlertTriangle,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Clock, Server, Network, Lock, Wifi, Code2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Tooltip, Legend
} from "recharts";

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  osintScansTotal: number;
  osintScansToday: number;
  darkwebDataPoints: number;
  threatsBlocked: number;
  systemUptime: string;
  dataIndexed: number;
}

const EnhancedDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  // TEMPORARY: r.houmani has admin access
  const isAdmin = user?.roles?.includes('admin') || user?.username === 'r.houmani';
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 1247,
    activeUsers: 342,
    newUsersToday: 23,
    osintScansTotal: 89432,
    osintScansToday: 156,
    darkwebDataPoints: 2845671,
    threatsBlocked: 2156,
    systemUptime: "99.97%",
    dataIndexed: 45234567
  });

  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Sample data for charts
  const userGrowthData = [
    { name: 'Jan', users: 850, newUsers: 45 },
    { name: 'Feb', users: 920, newUsers: 70 },
    { name: 'Mar', users: 1050, newUsers: 130 },
    { name: 'Apr', users: 1180, newUsers: 130 },
    { name: 'May', users: 1247, newUsers: 67 }
  ];

  const osintActivityData = [
    { name: 'Week 1', automated: 45, manual: 12, darkweb: 28 },
    { name: 'Week 2', automated: 62, manual: 18, darkweb: 34 },
    { name: 'Week 3', automated: 78, manual: 25, darkweb: 41 },
    { name: 'Week 4', automated: 89, manual: 31, darkweb: 52 }
  ];

  const threatDistribution = [
    { name: 'Malware', value: 35, color: '#ef4444' },
    { name: 'Phishing', value: 28, color: '#f59e0b' },
    { name: 'Data Breach', value: 22, color: '#8b5cf6' },
    { name: 'Network Intrusion', value: 15, color: '#06b6d4' }
  ];

  const darkwebDataTypes = [
    { name: 'Credentials', value: 1245670, color: '#ef4444' },
    { name: 'Financial Data', value: 789543, color: '#f59e0b' },
    { name: 'Personal Info', value: 567234, color: '#8b5cf6' },
    { name: 'Corporate Data', value: 243224, color: '#06b6d4' }
  ];

  const systemPerformance = [
    { name: '00:00', cpu: 45, memory: 67, network: 23 },
    { name: '06:00', cpu: 52, memory: 71, network: 31 },
    { name: '12:00', cpu: 68, memory: 78, network: 45 },
    { name: '18:00', cpu: 71, memory: 82, network: 52 },
    { name: '24:00', cpu: 58, memory: 74, network: 38 }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        osintScansToday: prev.osintScansToday + Math.floor(Math.random() * 2),
        darkwebDataPoints: prev.darkwebDataPoints + Math.floor(Math.random() * 100)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const translations = {
    title: {
      English: "DARKSCRAWLER SECURITY OPERATIONS CENTER",
      French: "CENTRE D'OPÉRATIONS DE SÉCURITÉ DARKSCRAWLER",
      Spanish: "CENTRO DE OPERACIONES DE SEGURIDAD DARKSCRAWLER"
    },
    dashboard: {
      English: "DASHBOARD",
      French: "TABLEAU DE BORD",
      Spanish: "PANEL DE CONTROL"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      {/* Enhanced Matrix Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        {/* Matrix rain similar to landing page */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-400 font-mono text-xs opacity-10 select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
            }}
            animate={{
              y: ["0vh", "110vh"],
            }}
            transition={{
              duration: Math.random() * 6 + 8,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "linear"
            }}
          >
            {Array.from({ length: 15 }, (_, idx) => (
              <div key={idx} className="mb-1">
                {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <motion.div 
          className="bg-gray-900/60 border-2 border-cyan-400/20 rounded-2xl p-6 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(79, 70, 229, 0.3)",
                    "0 0 25px rgba(79, 70, 229, 0.6)",
                    "0 0 15px rgba(79, 70, 229, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                  {translations.title[language as keyof typeof translations.title]}
                </h1>
                <p className="text-sm text-gray-400">
                  REAL-TIME INTELLIGENCE & THREAT MONITORING
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-cyan-400 font-mono text-lg font-bold">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-400">
                  SYSTEM UPTIME: {metrics.systemUptime}
                </div>
              </div>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { icon: Terminal, label: "OSINT ENGINE", status: "ACTIVE", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
              { icon: Wifi, label: "NETWORK", status: "ONLINE", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
              { icon: Eye, label: "SURVEILLANCE", status: "MONITORING", color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/30" },
              { icon: Skull, label: "DARKWEB", status: "SCANNING", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
              { icon: Lock, label: "SECURITY", status: "SECURED", color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
              { icon: Database, label: "DATABASE", status: "ACTIVE", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className={`text-center p-3 ${item.bg} rounded-lg border ${item.border}`}
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  delay: idx * 0.2,
                  repeat: Infinity,
                }}
              >
                <item.icon size={20} className={`${item.color} mx-auto mb-1`} />
                <p className={`text-xs ${item.color} font-bold`}>{item.label}</p>
                <p className={`text-xs ${item.color}`}>{item.status}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Users */}
          <motion.div 
            className="bg-gray-900/60 border border-blue-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-blue-400 text-sm font-bold">REGISTERED USERS</h3>
                <p className="text-3xl font-black text-white">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">+{metrics.newUsersToday} today</span>
            </div>
          </motion.div>

          {/* OSINT Scans */}
          <motion.div 
            className="bg-gray-900/60 border border-indigo-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-indigo-400 text-sm font-bold">OSINT SCANS</h3>
                <p className="text-3xl font-black text-white">{metrics.osintScansTotal.toLocaleString()}</p>
              </div>
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-400 text-sm">{metrics.osintScansToday} today</span>
            </div>
          </motion.div>

          {/* Dark Web Data */}
          <motion.div 
            className="bg-gray-900/60 border border-purple-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-purple-400 text-sm font-bold">DARKWEB DATA INDEXED</h3>
                <p className="text-3xl font-black text-white">{(metrics.darkwebDataPoints / 1000000).toFixed(1)}M</p>
              </div>
              <Skull className="w-12 h-12 text-purple-400" />
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm">Live monitoring</span>
            </div>
          </motion.div>

          {/* Active Users */}
          <motion.div 
            className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-cyan-400 text-sm font-bold">ACTIVE USERS</h3>
                <p className="text-3xl font-black text-white">{metrics.activeUsers}</p>
              </div>
              <Activity className="w-12 h-12 text-cyan-400" />
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm">Real-time</span>
            </div>
          </motion.div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Growth */}
          <motion.div 
            className="lg:col-span-2 bg-gray-900/60 border border-blue-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400 flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                USER REGISTRATION ANALYTICS
              </h3>
              <div className="text-xs text-gray-400">Last 5 months</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
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
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="newUsers" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Dark Web Data Distribution */}
          <motion.div 
            className="bg-gray-900/60 border border-purple-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              DARKWEB DATA TYPES
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={darkwebDataTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {darkwebDataTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value.toLocaleString(), 'Records']}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* OSINT Activity & System Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* OSINT Activity */}
          <motion.div 
            className="bg-gray-900/60 border border-indigo-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              OSINT SEARCH ANALYTICS
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={osintActivityData}>
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
                <Bar dataKey="automated" fill="#8b5cf6" name="Automated OSINT" />
                <Bar dataKey="manual" fill="#06b6d4" name="Manual OSINT" />
                <Bar dataKey="darkweb" fill="#e11d48" name="Dark Web Monitoring" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* System Performance */}
          <motion.div 
            className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              SYSTEM PERFORMANCE
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={systemPerformance}>
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
                <Line type="monotone" dataKey="cpu" stroke="#f59e0b" name="CPU %" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory %" strokeWidth={2} />
                <Line type="monotone" dataKey="network" stroke="#3b82f6" name="Network %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Actions & Latest Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div 
            className="bg-gray-900/60 border border-green-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              QUICK ACTIONS
            </h3>
            <div className="space-y-3">
              {[
                { label: "Run Automated OSINT", icon: Search, color: "indigo" },
                { label: "View Dark Web Alerts", icon: Skull, color: "purple" },
                { label: "System Diagnostics", icon: Terminal, color: "cyan" },
                ...(isAdmin ? [{ label: "User Management", icon: Users, color: "blue" }] : [])
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  className={`w-full p-3 rounded-lg bg-${action.color}-500/20 border border-${action.color}-500/30 text-${action.color}-400 hover:bg-${action.color}-500/30 transition-all duration-300 flex items-center space-x-3`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="lg:col-span-2 bg-gray-900/60 border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              RECENT SYSTEM ACTIVITY
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { time: "14:23", action: "New automated OSINT scan initiated", type: "osint", color: "indigo" },
                { time: "14:20", action: "Dark web data breach detected", type: "alert", color: "red" },
                { time: "14:18", action: "User authentication successful", type: "auth", color: "green" },
                { time: "14:15", action: "System backup completed", type: "system", color: "blue" },
                { time: "14:12", action: "Threat intelligence updated", type: "intel", color: "purple" },
                { time: "14:10", action: "Network security scan finished", type: "scan", color: "cyan" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <div className={`w-2 h-2 rounded-full bg-${item.color}-400`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium bg-${item.color}-500/20 text-${item.color}-400`}>
                    {item.type.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
