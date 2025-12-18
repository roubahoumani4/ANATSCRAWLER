import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import axios from 'axios';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Calendar,
  Clock,
  ArrowLeft,
  LogIn,
  LogOut,
  Globe,
  Eye,
  Shield,
  Terminal,
  FileText,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
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
  const navigate = useNavigate();
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
        <Header />
        <div className="p-8">
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
        <Header />
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
              <p className="text-gray-400">Failed to load user activity data</p>
              <Button onClick={() => navigate('/manage-users')} className="mt-4">
                Back to Manage Users
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(userSummary.statistics.byActionType).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite">
      <Header />
      <motion.div
        className="p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/manage-users')}
            variant="outline"
            className="mb-4 border-gray-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Manage Users
          </Button>

          <div className="flex items-center space-x-4">
            <div className="p-3 rounded bg-blue-700/10 text-blue-400">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{userSummary.user.username}'s Activity Dashboard</h1>
              <p className="text-sm text-gray-400">
                {userSummary.user.email} • Roles: {userSummary.user.roles.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-jetBlack/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-blue-400">{userSummary.statistics.total}</p>
                </div>
                <Activity size={40} className="text-blue-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-jetBlack/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Successful</p>
                  <p className="text-3xl font-bold text-green-400">{userSummary.statistics.byStatus.success || 0}</p>
                </div>
                <CheckCircle size={40} className="text-green-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-jetBlack/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-400">{userSummary.statistics.byStatus.failed || 0}</p>
                </div>
                <XCircle size={40} className="text-red-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

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
