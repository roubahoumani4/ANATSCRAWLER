import { useState, useEffect } from "react";
import { motion } from "framer-motion";
// import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Search, Shield, Database, FileText, Terminal, Skull, Wifi, Eye, Zap, Activity, AlertTriangle, Code2 } from "lucide-react";
import { fadeIn, slideUp } from "@/utils/animations";
import SearchInterface from "../search/SearchInterface";
import { OsintEngine } from "./OsintEngine";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"analytics" | "darkweb">("analytics");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [matrixChars, setMatrixChars] = useState<string[]>([]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Generate matrix characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("");
    setMatrixChars(chars);
    return () => clearInterval(timer);
  }, []);

  // Replace mock data with empty arrays or zeroes, or leave as placeholders for real API integration.
  const searchActivityData: any[] = [];
  const recentSearches: any[] = [];
  const stats = [
    {
      icon: <Search className="h-6 w-6 text-blue-400" />,
      label: "Total Searches",
      value: "0",
    },
    {
      icon: <FileText className="h-6 w-6 text-green-400" />,
      label: "Results Found",
      value: "0",
    },
    {
      icon: <Database className="h-6 w-6 text-purple-400" />,
      label: "Collections Analyzed",
      value: "0",
    },
    {
      icon: <Shield className="h-6 w-6 text-crimsonRed" />,
      label: "Threats Detected",
      value: "0",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    }).format(date);
  };

  return (
    <motion.div 
      className="w-full"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {/* Cybersecurity Command Center Header */}
      <div className="mb-8 relative overflow-hidden">
        {/* Matrix Background Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-400 font-mono text-xs select-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
              }}
              animate={{
                y: ["0vh", "30vh"],
              }}
              transition={{
                duration: Math.random() * 3 + 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear"
              }}
            >
              {matrixChars.slice(0, 8).map((_, idx) => (
                <div key={idx} className="mb-1">
                  {matrixChars[Math.floor(Math.random() * matrixChars.length)]}
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Command Center Interface */}
        <motion.div
          className="relative bg-gradient-to-r from-gray-100/60 via-gray-200/70 to-gray-100/60 dark:from-gray-900/60 dark:via-gray-800/70 dark:to-gray-900/60 border border-cyan-400/20 rounded-2xl p-6 backdrop-blur-sm"
          variants={slideUp}
          initial="hidden"
          animate="visible"
        >
          {/* Status Indicators */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              {[
                { icon: Terminal, label: "TERMINAL", status: "ACTIVE", color: "text-green-400" },
                { icon: Wifi, label: "NETWORK", status: "ONLINE", color: "text-blue-400" },
                { icon: Eye, label: "SURVEILLANCE", status: "MONITORING", color: "text-red-400" }
              ].map((indicator, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center space-x-2"
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    delay: idx * 0.5,
                    repeat: Infinity,
                  }}
                >
                  <indicator.icon className={`w-4 h-4 ${indicator.color}`} />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{indicator.label}</span>
                  <span className={`text-xs font-mono ${indicator.color}`}>{indicator.status}</span>
                </motion.div>
              ))}
            </div>

            {/* Live Clock */}
            <motion.div 
              className="flex items-center space-x-2 text-cyan-400 font-mono text-sm"
              animate={{
                textShadow: [
                  "0 0 5px rgba(6, 182, 212, 0.3)",
                  "0 0 10px rgba(6, 182, 212, 0.6)",
                  "0 0 5px rgba(6, 182, 212, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </motion.div>
          </div>

          {/* Main User Interface */}
          <div className="flex items-center space-x-6">
            {/* User Avatar & Info */}
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 via-purple-700 to-blue-600 p-1"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                    <Skull className="w-8 h-8 text-cyan-400" />
                  </div>
                </motion.div>
                
                {/* Status Dot */}
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>

              <div>
                <motion.h1 
                  className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-red-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  OPERATOR: {(user?.username || "UNKNOWN").toUpperCase()}
                </motion.h1>
                <motion.div
                  className="flex items-center space-x-4 mt-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    ACCESS LEVEL:
                  </span>
                  <motion.span 
                    className="text-sm font-mono text-red-400 font-bold"
                    animate={{
                      textShadow: [
                        "0 0 5px rgba(239, 68, 68, 0.5)",
                        "0 0 10px rgba(239, 68, 68, 0.8)",
                        "0 0 5px rgba(239, 68, 68, 0.5)"
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    CLASSIFIED
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>

            {/* System Stats */}
            <motion.div
              className="flex-1 grid grid-cols-3 gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                { icon: Activity, label: "MONITORING", value: "ACTIVE", color: "text-green-400" },
                { icon: Shield, label: "SECURITY", value: "ENGAGED", color: "text-blue-400" },
                { icon: AlertTriangle, label: "THREATS", value: "SCANNING", color: "text-yellow-400" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="text-center p-3 rounded-lg bg-gray-100/50 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-700/50"
                  whileHover={{ 
                    scale: 1.05,
                    borderColor: "rgba(6, 182, 212, 0.5)" 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">{stat.label}</div>
                  <motion.div 
                    className={`text-sm font-bold ${stat.color} font-mono`}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      delay: idx * 0.3,
                      repeat: Infinity,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mission Objective */}
          <motion.div
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-100/30 to-blue-100/30 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="flex items-center space-x-3">
              <Code2 className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-mono text-purple-300">
                MISSION:
              </span>
              <motion.span 
                className="text-sm font-mono text-gray-700 dark:text-gray-300"
                animate={{
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Analyze and secure critical network infrastructures
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-300 dark:border-gray-800 mb-8">
        <button
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "analytics" 
              ? "text-black dark:text-coolWhite" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Dashboard
          {activeTab === "analytics" && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimsonRed"
              layoutId="activeTab"
            />
          )}
        </button>
        <button
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "darkweb" 
              ? "text-black dark:text-coolWhite" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("darkweb")}
        >
          Darkweb Monitoring
          {activeTab === "darkweb" && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimsonRed"
              layoutId="activeTab"
            />
          )}
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "analytics" ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-darkGray p-5 rounded-lg shadow-md"
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-midGray mr-3">
                      {stat.icon}
                    </div>
                    <span className="text-sm text-gray-400">{stat.label}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-coolWhite mt-1">{stat.value}</h3>
                </motion.div>
              ))}
            </div>
            
            {/* Search Activity Graph */}
            <motion.div
              className="bg-darkGray p-6 rounded-lg shadow-md mb-8"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-coolWhite mb-4">
                Search Activity
              </h2>
              <div className="h-72 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="mb-2">
                    Search data visualization
                  </p>
                  <p className="text-sm text-gray-500">
                    Connected to Elasticsearch
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Recent Searches */}
            <motion.div
              className="bg-darkGray p-6 rounded-lg shadow-md"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-lg font-semibold text-coolWhite mb-4">
                Recent Searches
              </h2>
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Query</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* No recent searches available. Replace with real data when API is integrated. */}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <OsintEngine />
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;