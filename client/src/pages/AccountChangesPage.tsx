import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import BackButton from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Calendar, 
  Clock, 
  Shield, 
  Mail, 
  Building, 
  UserCog,
  Key,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AccountChangesPage = () => {
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

  // Mock data for account changes timeline
  const accountChangesData = [
    { name: 'Jan', changes: 8 },
    { name: 'Feb', changes: 12 },
    { name: 'Mar', changes: 15 },
    { name: 'Apr', changes: 9 },
    { name: 'May', changes: 24 }
  ];

  // Mock data for account changes
  const accountChanges = [
    {
      id: 1,
      type: "Profile Update",
      field: "Full Name",
      oldValue: "John Smith",
      newValue: "John A. Smith",
      timestamp: "2024-05-22 14:30:15",
      ipAddress: "192.168.1.100",
      status: "success",
      icon: <User size={16} />,
      color: "cyan"
    },
    {
      id: 2,
      type: "Email Change",
      field: "Email Address",
      oldValue: "john.smith@old-email.com",
      newValue: "john.smith@company.com",
      timestamp: "2024-05-22 09:45:22",
      ipAddress: "192.168.1.100",
      status: "success",
      icon: <Mail size={16} />,
      color: "blue"
    },
    {
      id: 3,
      type: "Organization Update",
      field: "Organization",
      oldValue: "Tech Corp",
      newValue: "ANAT Security Solutions",
      timestamp: "2024-05-21 16:20:08",
      ipAddress: "192.168.1.100",
      status: "success",
      icon: <Building size={16} />,
      color: "green"
    },
    {
      id: 4,
      type: "Username Change",
      field: "Username",
      oldValue: "johnsmith",
      newValue: "admin",
      timestamp: "2024-05-21 11:15:45",
      ipAddress: "192.168.1.100",
      status: "success",
      icon: <UserCog size={16} />,
      color: "yellow"
    },
    {
      id: 5,
      type: "Password Update",
      field: "Password",
      oldValue: "••••••••",
      newValue: "••••••••",
      timestamp: "2024-05-20 13:22:18",
      ipAddress: "192.168.1.100",
      status: "success",
      icon: <Key size={16} />,
      color: "red"
    }
  ];

  const getStatusIcon = (status: string) => {
    return status === "success" ? (
      <CheckCircle className="text-green-400" size={16} />
    ) : (
      <AlertCircle className="text-red-400" size={16} />
    );
  };

  const getColorClass = (color: string) => {
    const colors = {
      cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      green: "text-green-400 bg-green-400/10 border-green-400/20",
      yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      red: "text-red-400 bg-red-400/10 border-red-400/20"
    };
    return colors[color as keyof typeof colors] || colors.cyan;
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
          <BackButton to="/dashboard" color="cyan" />
          <div className="flex items-center mt-6 mb-4">
            <User className="mr-3 text-cyan-400" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Account Changes
            </h1>
          </div>
          <p className="text-gray-400">
            Complete history of all modifications made to your account information and settings
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
                <div className="text-2xl font-bold text-cyan-400 mb-2">24</div>
                <div className="text-sm text-gray-400">Total Changes</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">23</div>
                <div className="text-sm text-gray-400">Successful</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-red-400 mb-2">1</div>
                <div className="text-sm text-gray-400">Failed</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">7</div>
                <div className="text-sm text-gray-400">Days Active</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Account Changes Timeline Chart */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <BarChart3 className="mr-3 text-yellow-400" size={24} />
                Account Changes Timeline
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monthly overview of account modifications and security updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountChangesData}>
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
                    <Bar dataKey="changes" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Changes History */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-coolWhite">
                <Calendar className="mr-3 text-gray-400" size={24} />
                Recent Account Changes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detailed log of all account modifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountChanges.map((change, index) => (
                  <motion.div
                    key={change.id}
                    variants={itemVariants}
                    className="p-4 bg-darkGray/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg border ${getColorClass(change.color)}`}>
                          {change.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-coolWhite">{change.type}</h3>
                            <Badge variant="outline" className="text-xs">
                              {change.field}
                            </Badge>
                            {getStatusIcon(change.status)}
                          </div>
                          
                          {change.type !== "Password Update" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-400">Previous Value:</span>
                                <div className="text-gray-300 bg-jetBlack/50 p-2 rounded mt-1 font-mono">
                                  {change.oldValue}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">New Value:</span>
                                <div className="text-green-300 bg-jetBlack/50 p-2 rounded mt-1 font-mono">
                                  {change.newValue}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-6 text-xs text-gray-400">
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {change.timestamp}
                            </div>
                            <div className="flex items-center">
                              <Shield size={12} className="mr-1" />
                              {change.ipAddress}
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
                <button className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-colors">
                  Load More Changes
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccountChangesPage;