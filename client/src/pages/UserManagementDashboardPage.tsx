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
import MatrixBackground from "@/components/ui/MatrixBackground";
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
    <div className="min-h-screen relative bg-black">
      <MatrixBackground />
      
      <div className="relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-8 max-w-7xl"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  User Management Dashboard
                </h1>
                <p className="text-gray-400 text-lg">
                  Comprehensive overview of users, sessions, and activities
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/users/management')}
                  className="bg-blue-600 hover:bg-blue-700"
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
            <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('/users/management')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{users.length}</div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    {activeUsers} Active
                  </Badge>
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                    {inactiveUsers} Inactive
                  </Badge>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                  {adminUsers} admins, {regularUsers} users
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-green-500/30 hover:border-green-500/60 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('/users/sessions')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Sessions</CardTitle>
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {sessionStats?.activeSessions || 0}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {sessionStats?.totalSessions || 0} Total
                  </Badge>
                  {(sessionStats?.suspiciousSessions || 0) > 0 && (
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                      {sessionStats?.suspiciousSessions} Suspicious
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <AlertTriangle className="h-3 w-3 mr-1 text-orange-400" />
                  {sessionStats?.blockedSessions || 0} blocked sessions
                </div>
              </CardContent>
            </Card>

            {/* Activity Today */}
            <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('/users/activity-logs')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-300">Activity Today</CardTitle>
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {activityStats?.today || 0}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {activityStats?.thisWeek || 0} This Week
                  </Badge>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                  {activityStats?.total || 0} total activities
                </div>
              </CardContent>
            </Card>

            {/* Recent Registrations */}
            <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-300">New Users</CardTitle>
                  <UserPlus className="h-5 w-5 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {users.filter(u => {
                    const createdDate = new Date(u.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return createdDate >= weekAgo;
                  }).length}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                    Last 7 Days
                  </Badge>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  User growth tracking
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Distribution Chart */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    User Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Breakdown by role and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Trend Chart */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Activity Trend
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    User activities over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Access Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Users */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-cyan-400" />
                      Recent Registrations
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/users/management')}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div 
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:border-cyan-500/50 transition-all cursor-pointer"
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Session Overview */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-green-400" />
                      Session Statistics
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/users/sessions')}
                      className="text-green-400 hover:text-green-300"
                    >
                      Manage <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-gray-300">Active Sessions</span>
                      </div>
                      <span className="text-lg font-bold text-green-400">
                        {sessionStats?.activeSessions || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-gray-300">Suspicious</span>
                      </div>
                      <span className="text-lg font-bold text-orange-400">
                        {sessionStats?.suspiciousSessions || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Overview */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Activity Summary
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/users/activity-logs')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      View Logs <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-gray-300">Today</span>
                      </div>
                      <span className="text-lg font-bold text-purple-400">
                        {activityStats?.today || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-gray-300">This Week</span>
                      </div>
                      <span className="text-lg font-bold text-blue-400">
                        {activityStats?.thisWeek || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Navigation */}
          <motion.div variants={itemVariants} className="mt-8">
            <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Quick Navigation</CardTitle>
                <CardDescription className="text-gray-400">
                  Access detailed management pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => navigate('/users/management')}
                    className="h-auto py-6 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border border-blue-500/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserCog className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Manage Users</div>
                        <div className="text-xs text-blue-200">Create, edit, and delete users</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => navigate('/users/sessions')}
                    className="h-auto py-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border border-green-500/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Session Management</div>
                        <div className="text-xs text-green-200">Monitor and control user sessions</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => navigate('/users/activity-logs')}
                    className="h-auto py-6 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-purple-500/30"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold">Activity Logs</div>
                        <div className="text-xs text-purple-200">View detailed user activity logs</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserManagementDashboardPage;
