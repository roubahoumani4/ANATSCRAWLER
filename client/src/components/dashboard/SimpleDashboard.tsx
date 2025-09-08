import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Shield, Activity, Database, Search, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const SimpleDashboard = () => {
  const { language } = useLanguage();

  // Sample analytics data
  const systemData = [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 90 },
    { name: 'Apr', value: 81 },
    { name: 'May', value: 95 }
  ];

  const threatData = [
    { name: 'High', value: 12, color: '#ef4444' },
    { name: 'Medium', value: 25, color: '#f59e0b' },
    { name: 'Low', value: 63, color: '#10b981' }
  ];

  const scanData = [
    { name: 'Week 1', scans: 45 },
    { name: 'Week 2', scans: 52 },
    { name: 'Week 3', scans: 68 },
    { name: 'Week 4', scans: 71 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Header Status Bar */}
        <motion.div 
          className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-4 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  {language === "French" ? "TERMINAL ACTIF" : "TERMINAL ACTIVE"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  {language === "French" ? "RÉSEAU EN LIGNE" : "NETWORK ONLINE"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  {language === "French" ? "SURVEILLANCE MONITORING" : "SURVEILLANCE MONITORING"}
                </span>
              </div>
            </div>
            <div className="text-cyan-400 font-mono text-sm">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>

        {/* Operator Status */}
        <motion.div 
          className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-purple-400">
                  {language === "French" ? "OPÉRATEUR: ADMIN" : "OPERATOR: ADMIN"}
                </h2>
                <p className="text-sm text-gray-400">
                  {language === "French" ? "NIVEAU D'ACCÈS: CLASSIFIÉ" : "ACCESS LEVEL: CLASSIFIED"}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <Activity size={20} className="text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-400">
                  {language === "French" ? "SURVEILLANCE ACTIVE" : "SURVEILLANCE ACTIVE"}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Database size={20} className="text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-blue-400">
                  {language === "French" ? "SÉCURITÉ ENGAGÉE" : "SECURITY ENGAGED"}
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Search size={20} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-yellow-400">
                  {language === "French" ? "ANALYSE SCANNING" : "ANALYSIS SCANNING"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mission Brief */}
        <motion.div 
          className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-4 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-2 text-cyan-400">
            <span className="font-mono text-sm">
              {language === "French" ? "MISSION:" : "MISSION:"}
            </span>
            <span className="text-gray-300 text-sm">
              {language === "French" 
                ? "Analyser et sécuriser les infrastructures réseau critiques"
                : "Analyze and secure critical network infrastructures"
              }
            </span>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* System Performance Chart */}
          <motion.div 
            className="lg:col-span-2 bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              {language === "French" ? "Performance du Système" : "System Performance"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={systemData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Threat Analysis */}
          <motion.div 
            className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              {language === "French" ? "Analyse des Menaces" : "Threat Analysis"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {threatData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Scans */}
          <motion.div 
            className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              {language === "French" ? "Analyses de Sécurité" : "Security Scans"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Bar dataKey="scans" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="bg-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              {language === "French" ? "Statistiques Rapides" : "Quick Stats"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="text-blue-400" size={20} />
                  <span className="text-gray-300">
                    {language === "French" ? "Utilisateurs Actifs" : "Active Users"}
                  </span>
                </div>
                <span className="text-blue-400 font-bold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="text-green-400" size={20} />
                  <span className="text-gray-300">
                    {language === "French" ? "Analyses Complétées" : "Scans Completed"}
                  </span>
                </div>
                <span className="text-green-400 font-bold">89,432</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="text-purple-400" size={20} />
                  <span className="text-gray-300">
                    {language === "French" ? "Menaces Bloquées" : "Threats Blocked"}
                  </span>
                </div>
                <span className="text-purple-400 font-bold">2,156</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;