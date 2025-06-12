import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import BackButton from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Clock, 
  Search, 
  Download, 
  LogIn, 
  Globe,
  Eye,
  Bug,
  Shield,
  Terminal,
  FileText,
  TrendingUp
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActivityLogsPage = () => {
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

  // Activity timeline data for graph
  const activityTimelineData = [
    { time: '00:00', activities: 2 },
    { time: '04:00', activities: 1 },
    { time: '08:00', activities: 8 },
    { time: '12:00', activities: 15 },
    { time: '16:00', activities: 12 },
    { time: '20:00', activities: 6 }
  ];

  // Mock data for activity logs
  const activityLogs = [
    {
      id: 1,
      type: "OSINT Search",
      action: "Performed social media intelligence search",
      details: "Query: 'john.doe@example.com' - 15 results found",
      timestamp: "2024-05-22 14:45:30",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <Search size={16} />,
      color: "cyan",
      module: "OSINT Framework"
    },
    {
      id: 2,
      type: "Data Export",
      action: "Exported search results to Excel",
      details: "File: osint_results_20240522.xlsx - 42 records",
      timestamp: "2024-05-22 14:30:15",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <Download size={16} />,
      color: "green",
      module: "Export System"
    },
    {
      id: 3,
      type: "Login Session",
      action: "User authentication successful",
      details: "Login via username/password - Session duration: 4h 32m",
      timestamp: "2024-05-22 10:15:45",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <LogIn size={16} />,
      color: "blue",
      module: "Authentication"
    },
    {
      id: 4,
      type: "Darkweb Monitoring",
      action: "Accessed threat intelligence dashboard",
      details: "Viewed 23 new threat indicators and 5 alerts",
      timestamp: "2024-05-22 09:20:12",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <Eye size={16} />,
      color: "purple",
      module: "Darkweb Monitoring"
    },
    {
      id: 5,
      type: "Malware Analysis",
      action: "Initiated file hash lookup",
      details: "Hash: SHA256:a1b2c3... - Match found in database",
      timestamp: "2024-05-21 16:45:28",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <Bug size={16} />,
      color: "red",
      module: "Malware Analysis"
    },
    {
      id: 6,
      type: "Web Security Scan",
      action: "Vulnerability assessment completed",
      details: "Target: example.com - 3 vulnerabilities detected",
      timestamp: "2024-05-21 14:22:18",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      icon: <Shield size={16} />,
      color: "orange",
      module: "Web Security Scanning"
    }
  ];

  const getColorClass = (color: string) => {
    const colors = {
      cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      green: "text-green-400 bg-green-400/10 border-green-400/20",
      yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      red: "text-red-400 bg-red-400/10 border-red-400/20",
      purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      orange: "text-orange-400 bg-orange-400/10 border-orange-400/20"
    };
    return colors[color as keyof typeof colors] || colors.cyan;
  };

  const getModuleBadgeColor = (module: string) => {
    const moduleColors = {
      "OSINT Framework": "bg-cyan-600/20 text-cyan-400",
      "Darkweb Monitoring": "bg-purple-600/20 text-purple-400",
      "Malware Analysis": "bg-red-600/20 text-red-400",
      "Web Security Scanning": "bg-orange-600/20 text-orange-400",
      "Export System": "bg-green-600/20 text-green-400",
      "Authentication": "bg-blue-600/20 text-blue-400"
    };
    return moduleColors[module as keyof typeof moduleColors] || "bg-gray-600/20 text-gray-400";
  };

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
          <BackButton to="/dashboard" color="red" />
          <div className="flex items-center mt-6 mb-4">
            <Activity className="mr-3 text-red-400" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Activity Logs
            </h1>
          </div>
          <p className="text-gray-400">
            Monitor your system usage, security activities, and feature interactions
          </p>
        </div>

        {/* Summary Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-red-400 mb-2">157</div>
                <div className="text-sm text-gray-400">Total Activities</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-2">42</div>
                <div className="text-sm text-gray-400">Searches Made</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">18</div>
                <div className="text-sm text-gray-400">Files Exported</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">8</div>
                <div className="text-sm text-gray-400">Login Sessions</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Activity Timeline Graph */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <TrendingUp className="mr-3 text-red-400" size={24} />
                Activity Timeline Graph
              </CardTitle>
              <CardDescription className="text-gray-400">
                Hourly breakdown of system activities and security interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activities" 
                      stroke="#f87171" 
                      strokeWidth={3}
                      dot={{ fill: '#f87171', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#f87171', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <Calendar className="mr-3 text-gray-400" size={24} />
                Recent Activity Timeline
              </CardTitle>
              <CardDescription className="text-gray-400">
                Chronological log of your system interactions and security activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    variants={itemVariants}
                    className="p-4 bg-darkGray/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg border ${getColorClass(log.color)}`}>
                          {log.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-coolWhite">{log.type}</h3>
                            <Badge className={`text-xs ${getModuleBadgeColor(log.module)}`}>
                              {log.module}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                              Success
                            </Badge>
                          </div>
                          
                          <p className="text-gray-300 mb-3">{log.action}</p>
                          
                          <div className="bg-jetBlack/50 p-3 rounded border border-gray-700/30 mb-3">
                            <div className="flex items-center mb-2">
                              <FileText size={14} className="mr-2 text-gray-400" />
                              <span className="text-xs text-gray-400 uppercase tracking-wider">Details</span>
                            </div>
                            <p className="text-sm text-coolWhite font-mono">{log.details}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {log.timestamp}
                            </div>
                            <div className="flex items-center">
                              <Globe size={12} className="mr-1" />
                              {log.ipAddress}
                            </div>
                            <div className="flex items-center">
                              <Terminal size={12} className="mr-1" />
                              {log.userAgent.split(' ')[0]}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Load More Button */}
              <div className="text-center mt-6">
                <button className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-colors">
                  Load More Activities
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ActivityLogsPage;