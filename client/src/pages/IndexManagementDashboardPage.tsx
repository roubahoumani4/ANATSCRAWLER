import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Database, 
  Activity, 
  Search,
  TrendingUp,
  HardDrive,
  Zap,
  BarChart3,
  Settings,
  FileText,
  Shield,
  ArrowRight,
  Server,
  Layers,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const IndexManagementDashboardPage = () => {
  const navigate = useNavigate();
  
  // State to track performance history for chart
  const [performanceHistory, setPerformanceHistory] = useState<Array<{
    time: string;
    indexing: number;
    queries: number;
  }>>([]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Fetch indices data
  const { data: indicesData } = useQuery<{ success: boolean; indices: ElasticsearchIndex[] }>({
    queryKey: ["/api/v1/admin/elasticsearch/indices"],
  });

  // Fetch cluster stats for performance metrics
  const { data: clusterStatsData } = useQuery<{ success: boolean; stats: any }>({
    queryKey: ["/api/v1/admin/elasticsearch/cluster/stats"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time data
  });

  const indices = indicesData?.indices || [];
  const clusterStats = clusterStatsData?.stats;

  // Update performance history when new stats arrive
  useEffect(() => {
    if (clusterStats) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      setPerformanceHistory(prev => {
        const newHistory = [
          ...prev,
          {
            time: timeStr,
            indexing: clusterStats.indexing?.rate || 0,
            queries: clusterStats.search?.rate || 0,
          }
        ];
        
        // Keep only last 20 data points (about 100 seconds of data)
        return newHistory.slice(-20);
      });
    }
  }, [clusterStats]);

  // Calculate statistics
  const totalIndices = indices.length;
  const healthyIndices = indices.filter((i: ElasticsearchIndex) => i.health === 'green').length;
  const yellowIndices = indices.filter((i: ElasticsearchIndex) => i.health === 'yellow').length;
  const redIndices = indices.filter((i: ElasticsearchIndex) => i.health === 'red').length;
  const openIndices = indices.filter((i: ElasticsearchIndex) => i.status === 'open').length;
  const closedIndices = indices.filter((i: ElasticsearchIndex) => i.status === 'close').length;

  // Calculate total documents and storage
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

  // Health distribution data
  const healthData = [
    { name: 'Healthy', value: healthyIndices, color: '#10b981' },
    { name: 'Warning', value: yellowIndices, color: '#f59e0b' },
    { name: 'Critical', value: redIndices, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Top indices by document count
  const topIndicesByDocs = [...indices]
    .sort((a, b) => parseInt(b.docsCount || '0') - parseInt(a.docsCount || '0'))
    .slice(0, 5)
    .map(idx => ({
      name: idx.name.length > 20 ? idx.name.substring(0, 20) + '...' : idx.name,
      documents: parseInt(idx.docsCount || '0'),
      health: idx.health
    }));

  // Top indices by storage size
  const topIndicesBySize = [...indices]
    .map(idx => ({
      ...idx,
      sizeBytes: (() => {
        const sizeStr = idx.storeSize || '0b';
        const match = sizeStr.match(/^([\d.]+)([a-z]+)$/i);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers: Record<string, number> = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
        return value * (multipliers[unit] || 1);
      })()
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 5);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-jetBlack text-coolWhite p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="text-white" size={36} />
              Index Management
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive overview of Elasticsearch indices and performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/index/management')}
              className="bg-crimsonRed hover:bg-crimsonRed/80 text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Indices
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Indices */}
        <div className="bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 rounded-xl p-6 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20 cursor-pointer"
             onClick={() => navigate('/index/management')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Total Indices
              </p>
              <h3 className="text-4xl font-bold text-white">{totalIndices}</h3>
              <p className="text-sm text-gray-300 mt-2">
                {openIndices} open, {closedIndices} closed
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
              <Layers className="text-sky-400" size={24} />
            </div>
          </div>
        </div>

        {/* Healthy Indices */}
        <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Health Status
              </p>
              <h3 className="text-4xl font-bold text-white">{healthyIndices}</h3>
              <p className="text-sm text-gray-300 mt-2">
                {yellowIndices} warnings, {redIndices} critical
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>

        {/* Total Documents */}
        <div className="bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-700/50 rounded-xl p-6 hover:border-amber-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
             onClick={() => navigate('/index/query')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Total Documents
              </p>
              <h3 className="text-4xl font-bold text-white">{totalDocuments.toLocaleString()}</h3>
              <p className="text-sm text-gray-300 mt-2">
                Across all indices
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <FileText className="text-amber-400" size={24} />
            </div>
          </div>
        </div>

        {/* Total Storage */}
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 rounded-xl p-6 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
             onClick={() => navigate('/index/data-management')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-1">
                Total Storage
              </p>
              <h3 className="text-4xl font-bold text-white">{formatStorage(totalStorageBytes)}</h3>
              <p className="text-sm text-gray-300 mt-2">
                Used space
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <HardDrive className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Health Distribution */}
        <motion.div variants={itemVariants}>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="text-emerald-400" size={20} />
              Index Health Distribution
            </h3>
            <p className="text-sm text-gray-400 mb-4">Status of all indices</p>
            {healthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No indices available
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {healthData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-300">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Performance Overview */}
        <motion.div variants={itemVariants}>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-cyan-400" size={20} />
              Performance Overview
            </h3>
            <p className="text-sm text-gray-400 mb-4">Real-time indexing & query activity</p>
            {performanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" label={{ value: 'Operations/sec', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="indexing"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Indexing Rate"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="queries"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    name="Query Rate"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-pulse" />
                  <p className="text-gray-400">Collecting performance metrics...</p>
                  <p className="text-sm text-gray-500 mt-1">Data will appear as operations occur</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Indices Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Indices by Documents */}
        <motion.div variants={itemVariants}>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-amber-400" size={20} />
              Top Indices by Documents
            </h3>
            <p className="text-sm text-gray-400 mb-4">Largest indices by document count</p>
            {topIndicesByDocs.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topIndicesByDocs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="documents" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Indices by Storage */}
        <motion.div variants={itemVariants}>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HardDrive className="text-purple-400" size={20} />
              Top Indices by Storage
            </h3>
            <p className="text-sm text-gray-400 mb-4">Largest indices by disk space</p>
            <div className="space-y-3">
              {topIndicesBySize.length > 0 ? (
                topIndicesBySize.map((idx, index) => (
                  <div key={idx.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{idx.name}</div>
                        <div className="text-xs text-gray-400">{parseInt(idx.docsCount).toLocaleString()} documents</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`
                          ${idx.health === 'green' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          ${idx.health === 'yellow' ? 'bg-amber-500/20 text-amber-400' : ''}
                          ${idx.health === 'red' ? 'bg-red-500/20 text-red-400' : ''}
                        `}
                      >
                        {idx.storeSize}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-[260px] flex items-center justify-center text-gray-400">
                  No indices available
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Navigation */}
      <motion.div variants={itemVariants} className="mt-8">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Quick Navigation</h3>
          <p className="text-sm text-gray-400 mb-6">Access detailed management pages</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              onClick={() => navigate('/index/management')}
              className="h-auto py-6 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              <div className="flex flex-col items-center gap-2">
                <Database className="h-8 w-8 text-white" />
                <div className="text-center">
                  <div className="font-semibold">Manage Indices</div>
                  <div className="text-xs opacity-80">Create, clone, and delete indices</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/index/query')}
              className="h-auto py-6 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Query & Search</div>
                  <div className="text-xs opacity-80">Execute queries and searches</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/index/performance')}
              className="h-auto py-6 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Performance</div>
                  <div className="text-xs opacity-80">Optimization and monitoring</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/index/data-management')}
              className="h-auto py-6 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              <div className="flex flex-col items-center gap-2">
                <Server className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Data Management</div>
                  <div className="text-xs opacity-80">Manage data and lifecycle</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/index/admin-logs')}
              className="h-auto py-6 bg-crimsonRed hover:bg-crimsonRed/80 text-white border border-crimsonRed/30"
            >
              <div className="flex flex-col items-center gap-2">
                <Activity className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Admin Activity Logs</div>
                  <div className="text-xs opacity-80">View admin operations</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IndexManagementDashboardPage;
