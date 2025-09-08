import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Server,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface MetricsData {
  status: string;
  timestamp: string;
  health: {
    service: string;
    wrapperExists: boolean;
    pythonExists: boolean;
    pythonVersion: string;
  };
  performance: {
    activeScans: number;
    availableMemory: number;
    totalMemory: number;
    memoryUsage: number;
    availableCpu: number;
    cpuUsage: number;
    activeConnections: number;
    cacheHitRate: number;
    compressionEnabled: boolean;
    uptime: number;
  };
  scans: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    averageDuration: number;
  };
  errors: {
    total: number;
    recent: number;
    recoveryRate: number;
  };
  system?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    startTime: string;
  };
}

const SystemMetricsWidget = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      // Placeholder for future OSINT engine metrics fetching
      setMetrics({
        status: 'No OSINT engine configured',
        timestamp: new Date().toISOString(),
        health: {
          service: 'Not configured',
          wrapperExists: false,
          pythonExists: false,
          pythonVersion: 'N/A'
        },
        performance: {
          activeScans: 0,
          availableMemory: 0,
          totalMemory: 0,
          memoryUsage: 0,
          availableCpu: 0,
          cpuUsage: 0,
          activeConnections: 0,
          cacheHitRate: 0,
          compressionEnabled: false,
          uptime: 0
        },
        scans: {
          total: 0,
          running: 0,
          completed: 0,
          failed: 0,
          averageDuration: 0
        },
        errors: {
          total: 0,
          recent: 0,
          recoveryRate: 0
        }
      });
      setError('OSINT engine not configured. Please integrate your preferred OSINT tool.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Failed to fetch system metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`;
    return `${mb}MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Activity className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Loading metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-center text-red-400">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Health Overview */}
      <motion.div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-400" />
            System Health
          </h3>
          <div className={`flex items-center ${getStatusColor(metrics.status)}`}>
            {getStatusIcon(metrics.status)}
            <span className="ml-2 text-sm font-medium capitalize">{metrics.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Service</div>
              <div className="text-white font-mono">{metrics.health.service}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Python</div>
              <div className="text-white font-mono">{metrics.health.pythonVersion}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-white font-mono">{formatUptime(metrics.performance.uptime)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Active Scans</div>
              <div className="text-white font-mono">{metrics.performance.activeScans}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Activity className="w-5 h-5 mr-2 text-green-400" />
          Performance
        </h3>

        <div className="space-y-4">
          {/* CPU Usage */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-sm text-gray-400">
                <Cpu className="w-4 h-4 mr-1" />
                CPU Usage
              </div>
              <span className="text-white font-mono">{metrics.performance.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.performance.cpuUsage > 80
                    ? 'bg-red-500'
                    : metrics.performance.cpuUsage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(metrics.performance.cpuUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-sm text-gray-400">
                <HardDrive className="w-4 h-4 mr-1" />
                Memory
              </div>
              <span className="text-white font-mono">
                {formatMemory(metrics.performance.memoryUsage)} /{' '}
                {formatMemory(metrics.performance.totalMemory)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  (metrics.performance.memoryUsage / metrics.performance.totalMemory) * 100 > 80
                    ? 'bg-red-500'
                    : (metrics.performance.memoryUsage / metrics.performance.totalMemory) * 100 > 60
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(
                    (metrics.performance.memoryUsage / metrics.performance.totalMemory) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-sm text-gray-400">
                <Zap className="w-4 h-4 mr-1" />
                Cache Hit Rate
              </div>
              <span className="text-white font-mono">{metrics.performance.cacheHitRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(metrics.performance.cacheHitRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scan Statistics */}
      <motion.div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <Activity className="w-5 h-5 mr-2 text-cyan-400" />
          Scan Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Total Scans</div>
              <div className="text-2xl font-bold text-white">{metrics.scans.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Running</div>
              <div className="text-2xl font-bold text-green-400">{metrics.scans.running}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Completed</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.scans.completed}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Failed</div>
              <div className="text-2xl font-bold text-red-400">{metrics.scans.failed}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              Avg Duration
            </div>
            <span className="text-white font-mono">
              {metrics.scans.averageDuration > 0
                ? formatUptime(metrics.scans.averageDuration)
                : 'N/A'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Error Tracking */}
      <motion.div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
          Error Tracking
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400">Total Errors</div>
              <div className="text-xl font-bold text-red-400">{metrics.errors.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Recent</div>
              <div className="text-xl font-bold text-yellow-400">{metrics.errors.recent}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Recovery Rate</div>
              <div className="text-xl font-bold text-green-400">{metrics.errors.recoveryRate}%</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm text-gray-400">Error Recovery</div>
              <span className="text-white font-mono">{metrics.errors.recoveryRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.errors.recoveryRate > 80
                    ? 'bg-green-500'
                    : metrics.errors.recoveryRate > 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.errors.recoveryRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemMetricsWidget;
