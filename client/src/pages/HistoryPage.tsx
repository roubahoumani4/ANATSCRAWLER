import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import BackButton from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Clock, 
  User, 
  Activity, 
  FileText, 
  ArrowRight,
  Calendar,
  Shield,
  TrendingUp,
  BarChart3,
  PieChart,
  Search,
  Download,
  LogIn,
  Eye
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

const HistoryPage = () => {
  const { user } = useAuth();

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

  // Mock data for analytics charts
  const activityTrendData = [
    { name: 'Mon', searches: 12, logins: 3, exports: 2 },
    { name: 'Tue', searches: 18, logins: 4, exports: 5 },
    { name: 'Wed', searches: 24, logins: 2, exports: 3 },
    { name: 'Thu', searches: 15, logins: 5, exports: 1 },
    { name: 'Fri', searches: 30, logins: 3, exports: 7 },
    { name: 'Sat', searches: 8, logins: 1, exports: 0 },
    { name: 'Sun', searches: 6, logins: 2, exports: 1 }
  ];

  const moduleUsageData = [
    { name: 'OSINT Framework', value: 45, color: '#06b6d4' },
    { name: 'Darkweb Monitoring', value: 25, color: '#a855f7' },
    { name: 'Malware Analysis', value: 20, color: '#ef4444' },
    { name: 'Web Security', value: 10, color: '#f97316' }
  ];

  const accountChangesData = [
    { name: 'Jan', changes: 8 },
    { name: 'Feb', changes: 12 },
    { name: 'Mar', changes: 15 },
    { name: 'Apr', changes: 9 },
    { name: 'May', changes: 24 }
  ];

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite">
      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <div className="mb-8">
          <BackButton to="/dashboard" color="cyan" />
          <div className="flex items-center mt-6 mb-4">
            <Clock className="mr-3 text-cyan-400" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              History Analytics
            </h1>
          </div>
          <p className="text-gray-400">
            Comprehensive overview of your activity patterns, usage statistics, and account changes
          </p>
        </div>

        {/* Quick Stats Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Search className="text-cyan-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-cyan-400 mb-2">157</div>
                <div className="text-sm text-gray-400">Total Searches</div>
                <div className="text-xs text-green-400 mt-1">+12% this week</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <LogIn className="text-blue-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-2">42</div>
                <div className="text-sm text-gray-400">Login Sessions</div>
                <div className="text-xs text-green-400 mt-1">+5% this week</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Download className="text-green-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-green-400 mb-2">28</div>
                <div className="text-sm text-gray-400">Files Exported</div>
                <div className="text-xs text-green-400 mt-1">+8% this week</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <User className="text-purple-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-2">15</div>
                <div className="text-sm text-gray-400">Account Changes</div>
                <div className="text-xs text-yellow-400 mt-1">+3 this month</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Navigation Cards to Subpages */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
        >
          {/* Account Changes Section */}
          <motion.div variants={itemVariants}>
            <Link href="/account-changes" className="no-underline">
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    <User className="mr-3" size={24} />
                    Account Changes
                    <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Detailed history of profile modifications and security updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Profile Updates:</span>
                      <span className="text-cyan-400">8 changes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Password Changes:</span>
                      <span className="text-green-400">3 changes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Email Updates:</span>
                      <span className="text-blue-400">2 changes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Activity Logs Section */}
          <motion.div variants={itemVariants}>
            <Link href="/activity-logs" className="no-underline">
              <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                    <Activity className="mr-3" size={24} />
                    Activity Logs
                    <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete timeline of system usage and feature interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Search Activities:</span>
                      <span className="text-purple-400">157 queries</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Login Sessions:</span>
                      <span className="text-blue-400">42 sessions</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Data Exports:</span>
                      <span className="text-green-400">28 files</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* Analytics Charts Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Activity Trend Chart */}
          <motion.div variants={itemVariants} className="w-full">
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-coolWhite">
                  <TrendingUp className="mr-3 text-cyan-400" size={24} />
                  Weekly Activity Trends
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your activity patterns over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="searches" stroke="#06b6d4" strokeWidth={2} />
                      <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="exports" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Module Usage Chart */}
          <motion.div variants={itemVariants} className="w-full">
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-coolWhite">
                  <PieChart className="mr-3 text-purple-400" size={24} />
                  Module Usage Distribution
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Breakdown of your security module interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Pie data={moduleUsageData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                        {moduleUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {moduleUsageData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>


      </motion.div>
    </div>
  );
};

export default HistoryPage;