import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faCogs,
  faChartLine,
  faCubes,
  faDatabase,
  faMemory,
  faRotate,
  faCompressAlt,
  faTachometerAlt,
  faClock,
  faExclamationTriangle,
  faFire,
  faSnowflake,
  faThermometerHalf,
  faArrowsRotate,
  faLayerGroup,
  faChartBar,
  faTrash,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/hooks/use-toast";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface IndexStats {
  indexName: string;
  segmentCount: number;
  segmentMemory: number;
  cacheSize: number;
  memoryUsage: number;
  shardCount: number;
  queryCacheHits: number;
  queryCacheMisses: number;
  fieldDataMemory: number;
}

interface SegmentInfo {
  indexName: string;
  shard: number;
  segments: number;
  committed: boolean;
  searchable: boolean;
  size: string;
  memory: string;
}

interface QueryPerformance {
  query: string;
  count: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  timestamp: string;
}

interface SlowQuery {
  indexName: string;
  query: any;
  executionTime: number;
  timestamp: string;
  took: number;
}

interface ShardInfo {
  index: string;
  shard: number;
  prirep: string;
  state: string;
  docs: number;
  store: string;
  node: string;
}

interface TierInfo {
  tier: string;
  indices: string[];
  shardCount: number;
  totalSize: string;
}

const PerformanceOptimizationPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"index-optimization" | "performance" | "shards">(
    "index-optimization"
  );
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [selectedShard, setSelectedShard] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("1h");

  // Fetch all indices
  const { data: indicesData } = useQuery<{ success: boolean; indices: any[] }>({
    queryKey: ["/api/v1/admin/elasticsearch/indices"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/indices`, {
        withCredentials: true,
      });
      return res.data;
    },
  });

  // Fetch index optimization stats
  const { data: optimizationData, refetch: refetchOptimization } = useQuery<{
    success: boolean;
    stats: IndexStats[];
  }>({
    queryKey: ["/api/v1/admin/elasticsearch/performance/optimization"],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/optimization`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Fetch segment information
  const { data: segmentsData } = useQuery<{
    success: boolean;
    segments: SegmentInfo[];
  }>({
    queryKey: [`/api/v1/admin/elasticsearch/performance/segments`, selectedIndex],
    queryFn: async () => {
      const url = selectedIndex
        ? `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/segments/${selectedIndex}`
        : `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/segments`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    },
  });

  // Fetch query performance metrics
  const { data: queryPerformanceData } = useQuery<{
    success: boolean;
    metrics: QueryPerformance[];
  }>({
    queryKey: [`/api/v1/admin/elasticsearch/performance/query-metrics`, timeRange],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/query-metrics?range=${timeRange}`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Fetch slow queries
  const { data: slowQueriesData } = useQuery<{
    success: boolean;
    queries: SlowQuery[];
  }>({
    queryKey: [`/api/v1/admin/elasticsearch/performance/slow-queries`, timeRange],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/slow-queries?range=${timeRange}`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Fetch shard information
  const { data: shardsData, refetch: refetchShards } = useQuery<{
    success: boolean;
    shards: ShardInfo[];
  }>({
    queryKey: ["/api/v1/admin/elasticsearch/performance/shards"],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/shards`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Fetch tier information
  const { data: tierData } = useQuery<{
    success: boolean;
    tiers: TierInfo[];
  }>({
    queryKey: ["/api/v1/admin/elasticsearch/performance/tiers"],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/tiers`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Force merge mutation
  const forceMergeMutation = useMutation({
    mutationFn: async ({ index, maxSegments }: { index: string; maxSegments: number }) => {
      console.log('Force merge mutation called with:', { index, maxSegments });
      console.log('API URL:', `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/force-merge`);
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/force-merge`,
        { index, maxSegments },
        { withCredentials: true }
      );
      console.log('Force merge response:', res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Force merge success:', data);
      toast({
        title: "Force Merge Initiated",
        description: "The force merge operation has been started successfully.",
      });
      refetchOptimization();
    },
    onError: (error: any) => {
      console.error('Force merge error:', error);
      toast({
        title: "Force Merge Failed",
        description: error.response?.data?.error || "Failed to initiate force merge",
        variant: "destructive",
      });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async ({ index, cacheType }: { index: string; cacheType: string }) => {
      console.log('Clear cache mutation called with:', { index, cacheType });
      console.log('API URL:', `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/clear-cache`);
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/clear-cache`,
        { index, cacheType },
        { withCredentials: true }
      );
      console.log('Clear cache response:', res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Clear cache success:', data);
      toast({
        title: "Cache Cleared",
        description: "The cache has been cleared successfully.",
      });
      refetchOptimization();
    },
    onError: (error: any) => {
      console.error('Clear cache error:', error);
      toast({
        title: "Clear Cache Failed",
        description: error.response?.data?.error || "Failed to clear cache",
        variant: "destructive",
      });
    },
  });

  // Reroute shard mutation
  const rerouteMutation = useMutation({
    mutationFn: async ({
      index,
      shard,
      fromNode,
      toNode,
    }: {
      index: string;
      shard: number;
      fromNode: string;
      toNode: string;
    }) => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/performance/reroute-shard`,
        { index, shard, fromNode, toNode },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Shard Rerouted",
        description: "The shard has been rerouted successfully.",
      });
      refetchShards();
    },
    onError: (error: any) => {
      toast({
        title: "Reroute Failed",
        description: error.response?.data?.error || "Failed to reroute shard",
        variant: "destructive",
      });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getCacheHitRate = (hits: number, misses: number) => {
    const total = hits + misses;
    if (total === 0) return 0;
    return ((hits / total) * 100).toFixed(2);
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen relative">
      <MatrixBackground />

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded bg-blue-700/10 text-white">
              <FontAwesomeIcon icon={faGaugeHigh} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Performance & Optimization</h1>
              <p className="text-sm text-gray-400">
                Monitor and optimize your Elasticsearch cluster performance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("index-optimization")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "index-optimization"
                ? "bg-gray-700 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            <FontAwesomeIcon icon={faDatabase} />
            Index Optimization
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("performance")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "performance"
                ? "bg-gray-700 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} />
            Performance Analyzer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("shards")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "shards"
                ? "bg-gray-700 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            <FontAwesomeIcon icon={faCubes} />
            Shard Management
          </motion.button>
        </div>

        {/* Index Optimization Dashboard */}
        {activeTab === "index-optimization" && (
          <div className="space-y-6">
            {/* Index Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Index
              </label>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Indices</option>
                {indicesData?.indices?.map((index: any) => (
                  <option key={index.name} value={index.name}>
                    {index.name}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Optimization Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {optimizationData?.stats?.map((stat, index) => (
                <motion.div
                  key={stat.indexName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {stat.indexName}
                    </h3>
                    <FontAwesomeIcon icon={faDatabase} className="text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Segments</p>
                      <p className="text-xl font-bold text-white">{stat.segmentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Store Size</p>
                      <p className="text-lg text-blue-400">{formatBytes((stat as any).storeSize || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cache Hit Rate</p>
                      <p className="text-lg text-green-400">
                        {stat.queryCacheHits + stat.queryCacheMisses > 0 
                          ? getCacheHitRate(stat.queryCacheHits, stat.queryCacheMisses)
                          : '0.00'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Index Size</p>
                      <p className="text-lg text-yellow-400">{formatBytes((stat as any).storeSize || stat.memoryUsage)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Segment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-purple-400" />
                  Segment Merging Status
                </h2>
                <button
                  onClick={() => {
                    console.log('Force Merge button clicked, selectedIndex:', selectedIndex);
                    if (selectedIndex) {
                      const maxSegments = prompt("Enter max segments (default: 1):", "1");
                      console.log('User entered maxSegments:', maxSegments);
                      if (maxSegments) {
                        console.log('Calling forceMergeMutation.mutate');
                        forceMergeMutation.mutate({
                          index: selectedIndex,
                          maxSegments: parseInt(maxSegments),
                        });
                      }
                    } else {
                      console.log('No index selected, showing toast');
                      toast({
                        title: "No Index Selected",
                        description: "Please select an index first",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!selectedIndex || forceMergeMutation.isPending}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faCompressAlt} />
                  {forceMergeMutation.isPending ? 'Merging...' : 'Force Merge'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Index</th>
                      <th className="text-left py-3 px-4 text-gray-300">Shard</th>
                      <th className="text-left py-3 px-4 text-gray-300">Segments</th>
                      <th className="text-left py-3 px-4 text-gray-300">Size</th>
                      <th className="text-left py-3 px-4 text-gray-300">Memory</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentsData?.segments?.map((segment, index) => (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-white">{segment.indexName}</td>
                        <td className="py-3 px-4 text-gray-300">{segment.shard}</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">
                          {segment.segments}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{segment.size}</td>
                        <td className="py-3 px-4 text-yellow-400">{segment.memory}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {segment.committed && (
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                Committed
                              </span>
                            )}
                            {segment.searchable && (
                              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                Searchable
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Cache Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faMemory} className="text-green-400" />
                  Cache Statistics & Management
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {["query", "request", "fielddata"].map((cacheType) => (
                  <div
                    key={cacheType}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2 capitalize">
                      {cacheType} Cache
                    </h3>
                    <button
                      onClick={() => {
                        console.log('Clear Cache button clicked for:', cacheType, 'selectedIndex:', selectedIndex);
                        if (selectedIndex) {
                          console.log('Calling clearCacheMutation.mutate');
                          clearCacheMutation.mutate({
                            index: selectedIndex,
                            cacheType,
                          });
                        } else {
                          console.log('No index selected, showing toast');
                          toast({
                            title: "No Index Selected",
                            description: "Please select an index first",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!selectedIndex || clearCacheMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg mt-2 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Cache Performance Chart */}
              {optimizationData?.stats && optimizationData.stats.length > 0 ? (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Cache Hit Rates</h3>
                  {optimizationData.stats.some((stat: any) => stat.queryCacheHits > 0 || stat.queryCacheMisses > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={optimizationData.stats.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="indexName" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="queryCacheHits" fill="#10b981" name="Cache Hits" />
                        <Bar dataKey="queryCacheMisses" fill="#ef4444" name="Cache Misses" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No cache activity yet</p>
                      <p className="text-sm text-gray-500 mt-2">Cache statistics will appear after queries are executed</p>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>

            {/* Memory Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faMemory} className="text-yellow-400" />
                Storage Size Per Index
              </h2>

              {optimizationData?.stats && 
               optimizationData.stats.filter((stat: any) => (stat.storeSize || stat.memoryUsage) > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={optimizationData.stats
                        .filter((stat: any) => (stat.storeSize || stat.memoryUsage) > 0)
                        .slice(0, 5)
                        .map((stat: any) => ({
                          name: stat.indexName,
                          value: stat.storeSize || stat.memoryUsage,
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatBytes(entry.value)}`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {optimizationData.stats
                        .filter((stat: any) => (stat.storeSize || stat.memoryUsage) > 0)
                        .slice(0, 5)
                        .map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatBytes(value)}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No index data available with storage size</p>
                  <p className="text-sm text-gray-500 mt-2">Indices may be empty or data hasn't been indexed yet</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Performance Analyzer */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </motion.div>

            {/* Query Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faTachometerAlt} className="text-blue-400" />
                Query Performance Metrics
              </h2>

              {queryPerformanceData?.metrics && queryPerformanceData.metrics.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={queryPerformanceData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#9ca3af"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      stroke="#10b981"
                      name="Avg Time (ms)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxTime"
                      stroke="#ef4444"
                      name="Max Time (ms)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="minTime"
                      stroke="#3b82f6"
                      name="Min Time (ms)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Slow Query Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
                Slow Query Logs
              </h2>

              <div className="space-y-4">
                {slowQueriesData?.queries?.map((query, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{query.indexName}</h3>
                      <span
                        className={`text-sm px-3 py-1 rounded ${
                          query.executionTime > 5000
                            ? "bg-red-600/20 text-red-400"
                            : query.executionTime > 2000
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-green-600/20 text-green-400"
                        }`}
                      >
                        {formatDuration(query.executionTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(query.timestamp).toLocaleString()}
                    </p>
                    <pre className="bg-black/30 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(query.query, null, 2)}
                    </pre>
                  </div>
                ))}
                {(!slowQueriesData?.queries || slowQueriesData.queries.length === 0) && (
                  <p className="text-center text-gray-400 py-8">No slow queries found</p>
                )}
              </div>
            </motion.div>

            {/* Bottleneck Identification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} className="text-red-400" />
                Bottleneck Identification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                  <FontAwesomeIcon icon={faClock} className="text-red-400 text-2xl mb-2" />
                  <h3 className="text-sm font-semibold text-red-400 mb-1">High Latency</h3>
                  <p className="text-xs text-gray-400">
                    Queries taking longer than expected
                  </p>
                </div>
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                  <FontAwesomeIcon icon={faMemory} className="text-yellow-400 text-2xl mb-2" />
                  <h3 className="text-sm font-semibold text-yellow-400 mb-1">Memory Pressure</h3>
                  <p className="text-xs text-gray-400">
                    High memory usage detected
                  </p>
                </div>
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                  <FontAwesomeIcon icon={faDatabase} className="text-blue-400 text-2xl mb-2" />
                  <h3 className="text-sm font-semibold text-blue-400 mb-1">Cache Efficiency</h3>
                  <p className="text-xs text-gray-400">
                    Low cache hit rates
                  </p>
                </div>
                <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                  <FontAwesomeIcon icon={faCubes} className="text-purple-400 text-2xl mb-2" />
                  <h3 className="text-sm font-semibold text-purple-400 mb-1">Shard Balance</h3>
                  <p className="text-xs text-gray-400">
                    Uneven shard distribution
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Shard Management */}
        {activeTab === "shards" && (
          <div className="space-y-6">
            {/* Shard Allocation Viewer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCubes} className="text-blue-400" />
                  Shard Allocation Viewer
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => refetchShards()}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <FontAwesomeIcon icon={faSync} />
                  Refresh
                </motion.button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Index</th>
                      <th className="text-left py-3 px-4 text-gray-300">Shard</th>
                      <th className="text-left py-3 px-4 text-gray-300">Type</th>
                      <th className="text-left py-3 px-4 text-gray-300">State</th>
                      <th className="text-left py-3 px-4 text-gray-300">Docs</th>
                      <th className="text-left py-3 px-4 text-gray-300">Size</th>
                      <th className="text-left py-3 px-4 text-gray-300">Node</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shardsData?.shards?.map((shard, index) => (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-white">{shard.index}</td>
                        <td className="py-3 px-4 text-gray-300">{shard.shard}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              shard.prirep === "p"
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            {shard.prirep === "p" ? "Primary" : "Replica"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              shard.state === "STARTED"
                                ? "bg-green-600/20 text-green-400"
                                : shard.state === "RELOCATING"
                                ? "bg-yellow-600/20 text-yellow-400"
                                : "bg-red-600/20 text-red-400"
                            }`}
                          >
                            {shard.state}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{shard.docs.toLocaleString()}</td>
                        <td className="py-3 px-4 text-yellow-400">{shard.store}</td>
                        <td className="py-3 px-4 text-gray-300">{shard.node}</td>
                        <td className="py-3 px-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const toNode = prompt("Enter target node name:");
                              if (toNode) {
                                rerouteMutation.mutate({
                                  index: shard.index,
                                  shard: shard.shard,
                                  fromNode: shard.node,
                                  toNode,
                                });
                              }
                            }}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                          >
                            Reroute
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Shard Size Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} className="text-green-400" />
                Shard Size Distribution
              </h2>

              {shardsData?.shards && shardsData.shards.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={shardsData.shards
                      .slice(0, 15)
                      .map((shard) => ({
                        name: `${shard.index}[${shard.shard}]`,
                        docs: shard.docs,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="docs" fill="#10b981" name="Document Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Hot/Warm/Cold Tier Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faThermometerHalf} className="text-orange-400" />
                Hot/Warm/Cold Tier Management
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tierData?.tiers?.map((tier) => (
                  <div
                    key={tier.tier}
                    className={`rounded-lg p-6 border-2 ${
                      tier.tier === "hot"
                        ? "bg-red-600/10 border-red-600/30"
                        : tier.tier === "warm"
                        ? "bg-yellow-600/10 border-yellow-600/30"
                        : "bg-blue-600/10 border-blue-600/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FontAwesomeIcon
                        icon={
                          tier.tier === "hot"
                            ? faFire
                            : tier.tier === "warm"
                            ? faThermometerHalf
                            : faSnowflake
                        }
                        className={`text-3xl ${
                          tier.tier === "hot"
                            ? "text-red-400"
                            : tier.tier === "warm"
                            ? "text-yellow-400"
                            : "text-blue-400"
                        }`}
                      />
                      <h3 className="text-2xl font-bold text-white capitalize">{tier.tier} Tier</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-400">Indices</p>
                        <p className="text-xl font-bold text-white">{tier.indices.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Shards</p>
                        <p className="text-lg text-gray-300">{tier.shardCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Size</p>
                        <p className="text-lg text-yellow-400">{tier.totalSize}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-2">Indices:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {tier.indices.map((index) => (
                            <div
                              key={index}
                              className="text-xs bg-gray-900/50 px-2 py-1 rounded mb-1"
                            >
                              {index}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceOptimizationPage;
