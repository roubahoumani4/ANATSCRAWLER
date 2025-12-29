import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, Activity, Database, Search, Users, TrendingUp, 
  Eye, Skull, Globe, Terminal, Zap, AlertTriangle,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Clock, Server, Network, Lock, Wifi, Code2, ArrowRight,
  HardDrive, CheckCircle, UserPlus, Layers
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Tooltip, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

interface ElasticsearchIndex {
  name: string;
  health: string;
  status: string;
  uuid: string;
  pri: string;
  rep: string;
  docsCount: string;
  docsDeleted: string;
  storeSize: string;
  priStoreSize: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  blockedSessions: number;
  deviceBreakdown: Array<{ _id: string; count: number }>;
}

interface ActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  byActionType: Array<{ _id: string; count: number }>;
}

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');
  
  // State for Dark Web Monitoring data
  const [darkWebStats, setDarkWebStats] = useState({
    totalSearches: 0,
    discoverySearches: 0,
    domainSearches: 0,
    successRate: 0
  });

  // Fetch real data from APIs
  const { data: usersData } = useQuery<{ success: boolean; users: User[] }>({
    queryKey: ["/api/v1/admin/users"],
    enabled: isAdmin,
  });

  const { data: sessionStatsData } = useQuery<{ success: boolean; stats: SessionStats }>({
    queryKey: ["/api/v1/admin/sessions/stats"],
    enabled: isAdmin,
  });

  const { data: activityStatsData } = useQuery<{ success: boolean; stats: ActivityStats }>({
    queryKey: ["/api/v1/admin/activity-logs/stats"],
    enabled: isAdmin,
  });

  const { data: indicesData } = useQuery<{ success: boolean; indices: ElasticsearchIndex[] }>({
    queryKey: ["/api/v1/admin/elasticsearch/indices"],
    enabled: isAdmin,
  });

  const { data: clusterStatsData } = useQuery<{ success: boolean; stats: any }>({
    queryKey: ["/api/v1/admin/elasticsearch/cluster/stats"],
    refetchInterval: 5000,
    enabled: isAdmin,
  });

  // Fetch Dark Web Monitoring stats
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchDarkWebStats = async () => {
      try {
        const response = await axios.get('/api/v1/history/stats', { withCredentials: true });
        if (response.data.data) {
          const statsData = response.data.data;
          setDarkWebStats({
            totalSearches: statsData.totalSearches || 0,
            discoverySearches: statsData.discoverySearches || 0,
            domainSearches: statsData.domainSearches || 0,
            successRate: parseFloat(statsData.successRate || "0")
          });
        }
      } catch (error) {
        console.error('Failed to fetch dark web stats:', error);
      }
    };

    fetchDarkWebStats();
    const interval = setInterval(fetchDarkWebStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  const users = usersData?.users || [];
  const sessionStats = sessionStatsData?.stats;
  const activityStats = activityStatsData?.stats;
  const indices = indicesData?.indices || [];
  const clusterStats = clusterStatsData?.stats;

  // Calculate User Management statistics
  const activeUsers = users.filter(u => u.isActive).length;
  const newUsersThisWeek = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }).length;

  // Calculate Index Management statistics
  const totalIndices = indices.length;
  const healthyIndices = indices.filter((i: ElasticsearchIndex) => i.health === 'green').length;
  const totalDocuments = indices.reduce((sum: number, idx: ElasticsearchIndex) => sum + parseInt(idx.docsCount || '0'), 0);
  const totalStorageBytes = indices.reduce((sum: number, idx: ElasticsearchIndex) => {
    const sizeStr = idx.storeSize || '0b';
    const match = sizeStr.match(/^([\d.]+)([a-z]+)$/i);
    if (!match) return sum;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
    return sum + (value * (multipliers[unit] || 1));
  }, 0);

  const formatStorage = (bytes: number): string => {
    if (bytes >= 1024 ** 4) return `${(bytes / (1024 ** 4)).toFixed(2)} TB`;
    if (bytes >= 1024 ** 3) return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / (1024 ** 2)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  // Chart data
  const searchDistribution = [
    { name: 'Discovery', value: darkWebStats.discoverySearches, color: '#8b5cf6' },
    { name: 'Domain Monitoring', value: darkWebStats.domainSearches, color: '#06b6d4' }
  ].filter(d => d.value > 0);

  const indexHealthData = [
    { name: 'Healthy', value: healthyIndices, color: '#10b981' },
    { name: 'Warning', value: indices.filter((i: ElasticsearchIndex) => i.health === 'yellow').length, color: '#f59e0b' },
    { name: 'Critical', value: indices.filter((i: ElasticsearchIndex) => i.health === 'red').length, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const userRoleData = [
    { name: 'Admins', value: users.filter(u => u.roles?.includes('admin')).length, color: '#3b82f6' },
    { name: 'Regular Users', value: users.filter(u => u.roles?.includes('user') && !u.roles?.includes('admin')).length, color: '#10b981' },
    { name: 'Inactive', value: users.filter(u => !u.isActive).length, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const deviceData = sessionStats?.deviceBreakdown.map(d => ({
    name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    value: d.count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][sessionStats?.deviceBreakdown.indexOf(d) % 4]
  })) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const translations = {
    title: {
      English: "ANATSCRAWLER SECURITY OPERATIONS CENTER",
      French: "CENTRE D'OPÉRATIONS DE SÉCURITÉ ANATSCRAWLER",
      Spanish: "CENTRO DE OPERACIONES DE SEGURIDAD ANATSCRAWLER"
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // OSINT data for donut chart
  const osintData = [
    { name: 'Total Scans', value: darkWebStats.totalSearches, color: '#3b82f6' },
    { name: 'Success', value: Math.round(darkWebStats.totalSearches * (darkWebStats.successRate / 100)), color: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-jetBlack text-white p-6"
    >
      <div className="relative z-10">
        {/* Enhanced Header */}
        <motion.div 
          variants={itemVariants}
          className="bg-gray-900/60 border-2 border-cyan-400/20 rounded-2xl p-6 mb-6 backdrop-blur-sm"
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
                  COMPREHENSIVE PLATFORM OVERVIEW & MONITORING
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-cyan-400 font-mono text-lg font-bold">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: "OSINT ENGINE", status: "ACTIVE", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
              { icon: Skull, label: "DARKWEB MONITOR", status: "SCANNING", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
              { icon: Users, label: "USER MANAGEMENT", status: "ONLINE", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
              { icon: Database, label: "INDEX MANAGER", status: "ACTIVE", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" }
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

        {/* Main Platform Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* OSINT Platform Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-blue-900/40 border-2 border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Eye className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-400">OSINT Platform</h2>
                    <p className="text-sm text-gray-400">Open Source Intelligence</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">ACTIVE</Badge>
              </div>
              
              {osintData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={osintData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {osintData.map((entry, index) => (
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
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
                    <div className="bg-gray-900/60 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Scans</p>
                      <p className="text-2xl font-bold text-white">{darkWebStats.totalSearches}</p>
                    </div>
                    <div className="bg-gray-900/60 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                      <p className="text-2xl font-bold text-green-400">{darkWebStats.successRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900/60 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Scans</p>
                    <p className="text-2xl font-bold text-white">{darkWebStats.totalSearches}</p>
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-400">{darkWebStats.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => navigate('/discovery')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Open OSINT Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Dark Web Monitoring Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-purple-900/40 border-2 border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <Skull className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-400">Dark Web Monitoring</h2>
                    <p className="text-sm text-gray-400">Threat Intelligence</p>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-400">SCANNING</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Discovery</p>
                  <p className="text-2xl font-bold text-white">{darkWebStats.discoverySearches}</p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Domain Monitor</p>
                  <p className="text-2xl font-bold text-white">{darkWebStats.domainSearches}</p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/dark-web-monitoring')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Open Dark Web Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* User Management Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-cyan-900/40 via-sky-900/30 to-cyan-900/40 border-2 border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
                    <Users className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-cyan-400">User Management</h2>
                    <p className="text-sm text-gray-400">Users & Sessions</p>
                  </div>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400">ONLINE</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Active Sessions</p>
                  <p className="text-2xl font-bold text-green-400">{sessionStats?.activeSessions || 0}</p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/users')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Open User Management
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Index Management Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-amber-900/40 border-2 border-amber-500/30 rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                    <Database className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-400">Index Management</h2>
                    <p className="text-sm text-gray-400">Elasticsearch Indices</p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400">ACTIVE</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Indices</p>
                  <p className="text-2xl font-bold text-white">{totalIndices}</p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Documents</p>
                  <p className="text-2xl font-bold text-white">{(totalDocuments / 1000).toFixed(1)}K</p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/index')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Open Index Management
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Row */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <Activity className="text-blue-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{activityStats?.today || 0}</p>
              <p className="text-xs text-gray-400">Activity Today</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <UserPlus className="text-purple-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{newUsersThisWeek}</p>
              <p className="text-xs text-gray-400">New Users</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <CheckCircle className="text-emerald-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{healthyIndices}</p>
              <p className="text-xs text-gray-400">Healthy Indices</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <HardDrive className="text-amber-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{formatStorage(totalStorageBytes)}</p>
              <p className="text-xs text-gray-400">Storage Used</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <Search className="text-indigo-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{darkWebStats.totalSearches}</p>
              <p className="text-xs text-gray-400">Total Searches</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <Shield className="text-cyan-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{sessionStats?.activeSessions || 0}</p>
              <p className="text-xs text-gray-400">Active Sessions</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <Layers className="text-yellow-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{totalIndices}</p>
              <p className="text-xs text-gray-400">Total Indices</p>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <TrendingUp className="text-green-400 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{darkWebStats.successRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400">Success Rate</p>
            </div>
          </div>
        </motion.div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          
          {/* Dark Web Search Distribution */}
          {searchDistribution.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Search className="text-purple-400" size={20} />
                  Dark Web Searches
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={searchDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {searchDistribution.map((entry, index) => (
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
                <div className="flex flex-col gap-2 mt-2">
                  {searchDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-white font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Index Health Distribution */}
          {indexHealthData.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="text-emerald-400" size={20} />
                  Index Health
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={indexHealthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {indexHealthData.map((entry, index) => (
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
                <div className="flex flex-col gap-2 mt-2">
                  {indexHealthData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-white font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* User Distribution */}
          {userRoleData.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="text-sky-400" size={20} />
                  User Distribution
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {userRoleData.map((entry, index) => (
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
                <div className="flex flex-col gap-2 mt-2">
                  {userRoleData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-white font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Device Breakdown */}
          {deviceData.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="text-cyan-400" size={20} />
                  Device Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
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
                <div className="flex flex-col gap-2 mt-2">
                  {deviceData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-white font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;
