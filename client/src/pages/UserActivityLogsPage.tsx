import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Calendar,
  Clock,
  Search,
  Download,
  LogIn,
  LogOut,
  Globe,
  Eye,
  Bug,
  Shield,
  Terminal,
  FileText,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import MatrixBackground from '@/components/ui/MatrixBackground';

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  username?: string;
  email?: string;
  actionType: string;
  action: string;
  details?: string;
  module: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'warning';
  metadata?: any;
  createdAt: string;
}

interface Stats {
  totalActivities: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  actionTypeCounts: Array<{ _id: string; count: number }>;
}

interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
}

const UserActivityLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, selectedUser, selectedActionType, selectedStatus, searchTerm, startDate, endDate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (selectedUser && selectedUser !== 'all') params.userId = selectedUser;
      if (selectedActionType && selectedActionType !== 'all') params.actionType = selectedActionType;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs`, { 
        params,
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      
      setLogs(response.data.data.logs);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedUser && selectedUser !== 'all') params.userId = selectedUser;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs/stats`, { 
        params,
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const params: any = { format };
      
      if (selectedUser && selectedUser !== 'all') params.userId = selectedUser;
      if (selectedActionType && selectedActionType !== 'all') params.actionType = selectedActionType;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs/export`, {
        params,
        responseType: format === 'csv' ? 'text' : 'json',
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      // Create download link
      const blob = new Blob(
        [format === 'csv' ? response.data : JSON.stringify(response.data, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString()}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleUserExport = async (userId: string, format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs/export/user/${userId}`, {
        params: { format },
        responseType: format === 'csv' ? 'text' : 'json',
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      const user = users.find(u => u._id === userId);
      const username = user?.username || 'user';

      // Create download link
      const blob = new Blob(
        [format === 'csv' ? response.data : JSON.stringify(response.data, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${username}-${new Date().toISOString()}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting user logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedUser('');
    setSelectedActionType('');
    setSelectedStatus('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionTypeIcon = (actionType: string) => {
    const icons: Record<string, any> = {
      login: <LogIn size={16} />,
      logout: <LogOut size={16} />,
      failed_login: <XCircle size={16} />,
      search: <Search size={16} />,
      scan: <Shield size={16} />,
      export: <Download size={16} />,
      settings_change: <Terminal size={16} />,
      user_management: <Eye size={16} />,
      api_access: <Globe size={16} />,
      security_event: <AlertTriangle size={16} />,
      other: <FileText size={16} />,
    };
    return icons[actionType] || <Activity size={16} />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-green-400 bg-green-400/10 border-green-400/20',
      failed: 'text-red-400 bg-red-400/10 border-red-400/20',
      warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    };
    return colors[status] || colors.success;
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      Authentication: 'bg-blue-600/20 text-blue-400',
      'OSINT Framework': 'bg-cyan-600/20 text-cyan-400',
      Discovery: 'bg-purple-600/20 text-purple-400',
      'Domain Monitoring': 'bg-indigo-600/20 text-indigo-400',
      'Threat Intelligence': 'bg-red-600/20 text-red-400',
      Assessment: 'bg-orange-600/20 text-orange-400',
      'User Management': 'bg-pink-600/20 text-pink-400',
      Settings: 'bg-gray-600/20 text-gray-400',
      'Export System': 'bg-green-600/20 text-green-400',
      API: 'bg-yellow-600/20 text-yellow-400',
      Security: 'bg-red-600/20 text-red-400',
      System: 'bg-gray-600/20 text-gray-400',
    };
    return colors[module] || 'bg-gray-600/20 text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle size={16} className="text-green-400" />;
    if (status === 'failed') return <XCircle size={16} className="text-red-400" />;
    return <AlertCircle size={16} className="text-yellow-400" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
      failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
      warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    };
    const variant = variants[status] || variants.success;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} ${variant.bg} border-0`}>
        <Icon size={12} className="mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite relative">
      <MatrixBackground />
      <motion.div
        className="p-8 pt-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section - Match Manage Users style */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded bg-blue-700/10 text-white">
                <Activity size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">User Activity Logs</h1>
                <p className="text-sm text-gray-400">
                  Track and audit all user actions across the platform
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="bg-[hsl(var(--crimsonRed))] hover:bg-[hsl(var(--crimsonRed),.85)] text-white"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="bg-[hsl(var(--crimsonRed))] hover:bg-[hsl(var(--crimsonRed),.85)] text-white"
              >
                <Download size={16} className="mr-2" />
                Export JSON
              </Button>
              <Button
                onClick={() => {
                  fetchLogs();
                  fetchStats();
                }}
                className="bg-[hsl(var(--crimsonRed))] hover:bg-[hsl(var(--crimsonRed),.85)] text-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {stats.totalActivities}
                  </div>
                  <div className="text-sm text-gray-400">Total Activities</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {stats.successCount}
                  </div>
                  <div className="text-sm text-gray-400">Successful</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-red-400 mb-2">
                    {stats.failedCount}
                  </div>
                  <div className="text-sm text-gray-400">Failed</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {stats.warningCount}
                  </div>
                  <div className="text-sm text-gray-400">Warnings</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Filters Section - Smaller and more compact */}
        <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-coolWhite text-lg">
              <Filter className="mr-2 text-blue-400" size={20} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Action Type</label>
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                    <SelectItem value="search">Search</SelectItem>
                    <SelectItem value="scan">Scan</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="settings_change">Settings</SelectItem>
                    <SelectItem value="user_management">User Mgmt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-darkGray border-gray-700 text-coolWhite h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="border-gray-700"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <Calendar className="mr-3 text-gray-400" size={24} />
                Activity Timeline
              </CardTitle>
              <CardDescription className="text-gray-400">
                Chronological log of all user actions and system interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto text-blue-400 mb-4" size={32} />
                  <p className="text-gray-400">Loading activity logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <motion.div
                      key={log._id}
                      variants={itemVariants}
                      className="p-4 bg-darkGray/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-2 rounded-lg border ${getStatusColor(log.status)}`}>
                            {getActionTypeIcon(log.actionType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                              <h3 className="font-semibold text-coolWhite">{log.action}</h3>
                              <Badge className={`text-xs ${getModuleColor(log.module)}`}>
                                {log.module}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(log.status)}
                                <span className="text-xs text-gray-400 capitalize">
                                  {log.status}
                                </span>
                              </div>
                            </div>

                            {log.details && (
                              <div className="bg-jetBlack/50 p-3 rounded border border-gray-700/30 mb-3">
                                <p className="text-sm text-coolWhite">{log.details}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-gray-400">
                              <div className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {new Date(log.createdAt).toLocaleString()}
                              </div>
                              {log.userId && (
                                <div className="flex items-center">
                                  <Eye size={12} className="mr-1" />
                                  {log.userId.username}
                                </div>
                              )}
                              {log.ipAddress && (
                                <div className="flex items-center">
                                  <Globe size={12} className="mr-1" />
                                  {log.ipAddress}
                                </div>
                              )}
                              {log.userAgent && (
                                <div className="flex items-center">
                                  <Terminal size={12} className="mr-1" />
                                  {log.userAgent.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    variant="outline"
                    className="border-gray-700"
                  >
                    Previous
                  </Button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    variant="outline"
                    className="border-gray-700"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserActivityLogsPage;
