import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Activity, 
  Shield, 
  UserCog, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Globe,
  LogIn,
  UserPlus,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Session {
  _id: string;
  userId: any;
  isActive: boolean;
  isSuspicious: boolean;
  isBlocked: boolean;
  deviceType: string;
  lastActivity: string;
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

const UserManagementDashboardPage = () => {
  const navigate = useNavigate();

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

  // Fetch users data
  const { data: usersData } = useQuery<{ success: boolean; users: User[] }>({
    queryKey: ["/api/v1/admin/users"],
  });

  // Fetch sessions data
  const { data: sessionsData } = useQuery<{ success: boolean; sessions: Session[] }>({
    queryKey: ["/api/v1/admin/sessions"],
  });

  // Fetch session stats
  const { data: sessionStatsData } = useQuery<{ success: boolean; stats: SessionStats }>({
    queryKey: ["/api/v1/admin/sessions/stats"],
  });

  // Fetch activity logs stats
  const { data: activityStatsData } = useQuery<{ success: boolean; stats: ActivityStats }>({
    queryKey: ["/api/v1/admin/activity-logs/stats"],
  });

  const users = usersData?.users || [];
  const sessions = sessionsData?.sessions || [];
  const sessionStats = sessionStatsData?.stats;
  const activityStats = activityStatsData?.stats;

  // Calculate user statistics
  const activeUsers = users.filter(u => u.isActive).length;
  const adminUsers = users.filter(u => u.roles?.includes('admin')).length;
  const regularUsers = users.filter(u => u.roles?.includes('user') && !u.roles?.includes('admin')).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;

  // User role distribution data for chart
  const userRoleData = [
    { name: 'Admins', value: adminUsers, color: '#3b82f6' },
    { name: 'Regular Users', value: regularUsers, color: '#10b981' },
    { name: 'Inactive', value: inactiveUsers, color: '#ef4444' }
  ];

  // Device breakdown data for chart
  const deviceData = sessionStats?.deviceBreakdown.map(d => ({
    name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    value: d.count
  })) || [];

  // Activity trend data (mock data - would come from API)
  const activityTrendData = [
    { name: 'Mon', activities: 45 },
    { name: 'Tue', activities: 52 },
    { name: 'Wed', activities: 61 },
    { name: 'Thu', activities: 58 },
    { name: 'Fri', activities: 70 },
    { name: 'Sat', activities: 35 },
    { name: 'Sun', activities: 28 }
  ];

  // Recent registrations
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
              <Users className="text-cyan-400" size={36} />
              User Management
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive overview of users, sessions, and activities
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/users/management')}
              className="bg-crimsonRed hover:bg-crimsonRed/80 text-white"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 rounded-xl p-6 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20 cursor-pointer"
                 onClick={() => navigate('/users/management')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sky-400 text-sm font-semibold uppercase tracking-wide mb-1">
                    Total Users
                  </p>
                  <h3 className="text-4xl font-bold text-white">{users.length}</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    {activeUsers} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-sky-600/20 flex items-center justify-center">
                  <Users className="text-sky-400" size={24} />
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
                 onClick={() => navigate('/users/sessions')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">
                    Active Sessions
                  </p>
                  <h3 className="text-4xl font-bold text-white">
                    {sessionStats?.activeSessions || 0}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    {sessionStats?.totalSessions || 0} total
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <Shield className="text-emerald-400" size={24} />
                </div>
              </div>
            </div>

            {/* Activity Today */}
            <div className="bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-700/50 rounded-xl p-6 hover:border-amber-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
                 onClick={() => navigate('/users/activity-logs')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-1">
                    Activity Today
                  </p>
                  <h3 className="text-4xl font-bold text-white">
                    {activityStats?.today || 0}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    {activityStats?.thisWeek || 0} this week
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                  <Activity className="text-amber-400" size={24} />
                </div>
              </div>
            </div>

            {/* New Users */}
            <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 rounded-xl p-6 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-1">
                    New Users
                  </p>
                  <h3 className="text-4xl font-bold text-white">
                    {users.filter(u => {
                      const createdDate = new Date(u.createdAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return createdDate >= weekAgo;
                    }).length}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    Last 7 days
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <UserPlus className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Distribution Chart */}
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="text-sky-400" size={20} />
                  User Distribution
                </h3>
                <p className="text-sm text-gray-400 mb-4">Breakdown by role and status</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
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
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {userRoleData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-xs text-gray-400">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            {/* Activity Trend Chart */}
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="text-amber-400" size={20} />
                  Activity Trend
                </h3>
                <p className="text-sm text-gray-400 mb-4">User activities over the last 7 days</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityTrendData}>
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
                      <Line 
                        type="monotone" 
                        dataKey="activities" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
          </div>

          {/* Quick Access Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Users */}
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="text-cyan-400" size={20} />
                    Recent Registrations
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/users/management')}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div 
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => navigate('/users/management')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.username}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={
                        user.roles?.includes('admin') 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }>
                        {user.roles?.includes('admin') ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  ))}
                  {recentUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No recent registrations
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Session Overview */}
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Monitor className="text-emerald-400" size={20} />
                    Session Statistics
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/users/sessions')}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Manage <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-300">Active Sessions</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">
                      {sessionStats?.activeSessions || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-gray-300">Suspicious</span>
                    </div>
                    <span className="text-lg font-bold text-orange-400">
                      {sessionStats?.suspiciousSessions || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-gray-300">Blocked</span>
                    </div>
                    <span className="text-lg font-bold text-red-400">
                      {sessionStats?.blockedSessions || 0}
                    </span>
                  </div>

                  {deviceData.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2">Device Breakdown</div>
                      {deviceData.slice(0, 3).map((device, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-xs text-gray-300">{device.name}</span>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            {device.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Activity Overview */}
            <motion.div variants={itemVariants}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="text-amber-400" size={20} />
                    Activity Summary
                  </h3>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="text-amber-400" size={20} />
                    Activity Summary
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/users/activity-logs')}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    View Logs <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Today</span>
                    </div>
                    <span className="text-lg font-bold text-purple-400">
                      {activityStats?.today || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-300">This Week</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">
                      {activityStats?.thisWeek || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-gray-300">All Time</span>
                    </div>
                    <span className="text-lg font-bold text-cyan-400">
                      {activityStats?.total || 0}
                    </span>
                  </div>

                  {activityStats?.byActionType && activityStats.byActionType.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2">Top Actions</div>
                      {activityStats.byActionType.slice(0, 3).map((action, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-xs text-gray-300">{action._id}</span>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            {action.count}
                          </Badge>
                        </div>
                      ))}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => navigate('/users/management')}
                    className="h-auto py-6 bg-crimsonRed hover:bg-crimsonRed/80 text-white border border-crimsonRed/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserCog className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Manage Users</div>
                        <div className="text-xs opacity-80">Create, edit, and delete users</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => navigate('/users/sessions')}
                    className="h-auto py-6 bg-crimsonRed hover:bg-crimsonRed/80 text-white border border-crimsonRed/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Session Management</div>
                        <div className="text-xs opacity-80">Monitor and control user sessions</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => navigate('/users/activity-logs')}
                    className="h-auto py-6 bg-crimsonRed hover:bg-crimsonRed/80 text-white border border-crimsonRed/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Activity Logs</div>
                        <div className="text-xs opacity-80">View detailed user activity logs</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </motion.div>
    </motion.div>
  );
};

export default UserManagementDashboardPage;
