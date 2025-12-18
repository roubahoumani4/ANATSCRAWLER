import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  Globe,
  Eye,
  Shield,
  Terminal,
  FileText,
  Search,
  AlertCircle,
  TrendingUp,
  Download,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ActivityLog {
  _id: string;
  actionType: string;
  action: string;
  details?: string;
  module: string;
  ipAddress?: string;
  status: 'success' | 'failed' | 'warning';
  createdAt: string;
}

interface UserSummary {
  user: {
    _id: string;
    username: string;
    email: string;
    roles: string[];
  };
  statistics: {
    total: number;
    byActionType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  recentActivities: ActivityLog[];
  dailyActivity: Array<{ date: string; count: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const UserActivityDashboardPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSummary();
  }, [userId]);

  const fetchUserSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/activity-logs/user-summary/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      setUserSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching user summary:', error);
    } finally {
      setLoading(false);
    }
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
    };
    return icons[actionType] || <Activity size={16} />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-jetBlack text-coolWhite">
        <div className="p-8 pt-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Activity className="animate-spin mx-auto text-blue-400 mb-4" size={48} />
              <p className="text-gray-400">Loading user activity dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userSummary) {
    return (
      <div className="min-h-screen bg-jetBlack text-coolWhite">
        <div className="p-8 pt-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
              <p className="text-gray-400">Failed to load user activity data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(userSummary.statistics.byActionType).map(([name, value]) => ({
    name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
    value,
  }));

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite">
      <motion.div
        className="p-8 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded bg-blue-700/10 text-white">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{userSummary.user.username}'s Activity Dashboard</h1>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity by Type - Bar Chart */}
          <Card className="bg-jetBlack/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <TrendingUp className="mr-2 text-blue-400" size={20} />
                Activity by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity by Type - Pie Chart */}
          <Card className="bg-jetBlack/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <Activity className="mr-2 text-blue-400" size={20} />
                Activity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Trend - Line Chart */}
        <Card className="bg-jetBlack/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-coolWhite">
              <Calendar className="mr-2 text-blue-400" size={20} />
              Activity Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userSummary.dailyActivity && userSummary.dailyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userSummary.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No activity trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-jetBlack/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-coolWhite">
              <Clock className="mr-2 text-gray-400" size={20} />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-gray-400">
              Latest {userSummary.recentActivities.length} activities performed by this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userSummary.recentActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-center justify-between p-4 bg-darkGray/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
                      {getActionTypeIcon(activity.actionType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-coolWhite">{activity.action}</span>
                        <Badge className="text-xs bg-gray-700/50 text-gray-300 border-0">
                          {activity.module}
                        </Badge>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-400 line-clamp-1">{activity.details}</p>
                      )}
                      {activity.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">IP: {activity.ipAddress}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(activity.status)}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserActivityDashboardPage;
