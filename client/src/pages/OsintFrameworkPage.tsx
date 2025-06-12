import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Terminal, Globe, Search, Eye, Database, Wifi, Code2, Shield, Activity, Zap } from "lucide-react";
import BackButton from "@/components/ui/back-button";

const OsintFrameworkPage = () => {
  const { language, translate } = useLanguage();
  const [matrixChars, setMatrixChars] = useState<string[]>([]);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("");
    setMatrixChars(chars);
  }, []);

  const osintModules = [
    {
      title: translate("osint.domainIntelligence"),
      description: "Comprehensive domain analysis and reconnaissance",
      icon: <Globe className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      features: ["WHOIS Lookup", "DNS Analysis", "Subdomain Discovery", "SSL Certificate Analysis"]
    },
    {
      title: translate("osint.socialMediaIntelligence"),
      description: "Social platform monitoring and data collection",
      icon: <Eye className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
      features: ["Profile Analysis", "Content Monitoring", "Network Mapping", "Behavioral Analysis"]
    },
    {
      title: translate("osint.networkReconnaissance"), 
      description: "Advanced network scanning and enumeration",
      icon: <Wifi className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500",
      features: ["Port Scanning", "Service Discovery", "Banner Grabbing", "Network Topology"]
    },
    {
      title: "Database Intelligence",
      description: "Public database searches and data mining",
      icon: <Database className="w-8 h-8" />,
      color: "from-red-500 to-orange-500",
      features: ["Public Records", "Breach Databases", "Corporate Filings", "Contact Information"]
    }
  ];

  const recentInvestigations = [
    { id: 1, target: "suspicious-domain.com", type: "Domain Analysis", status: "Active", timestamp: "2 hours ago" },
    { id: 2, target: "@threat_actor", type: "Social Media", status: "Completed", timestamp: "1 day ago" },
    { id: 3, target: "192.168.1.0/24", type: "Network Scan", status: "In Progress", timestamp: "30 minutes ago" },
    { id: 4, target: "Corporation XYZ", type: "Corporate Intel", status: "Completed", timestamp: "3 days ago" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-400 font-mono text-xs select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
            }}
            animate={{
              y: ["0vh", "100vh"],
            }}
            transition={{
              duration: Math.random() * 8 + 10,
              repeat: Infinity,
              delay: Math.random() * 3,
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

      <div className="relative z-10 p-8">
        {/* Back Button */}
        <BackButton color="green" />
        
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <motion.div
              className="p-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(34, 197, 94, 0.3)",
                  "0 0 40px rgba(34, 197, 94, 0.6)",
                  "0 0 20px rgba(34, 197, 94, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Terminal className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                OSINT FRAMEWORK
              </h1>
              <p className="text-gray-400 font-mono text-lg">
                Open Source Intelligence Collection & Analysis Platform
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <motion.div
            className="flex items-center space-x-6 p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-green-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {[
              { icon: Activity, label: "COLLECTORS", status: "12 ACTIVE", color: "text-green-400" },
              { icon: Search, label: "INVESTIGATIONS", status: "8 RUNNING", color: "text-blue-400" },
              { icon: Shield, label: "SECURITY", status: "ENCRYPTED", color: "text-cyan-400" }
            ].map((stat, idx) => (
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
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm font-mono text-gray-400">{stat.label}:</span>
                <span className={`text-sm font-mono ${stat.color}`}>{stat.status}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* OSINT Modules Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {osintModules.map((module, index) => (
            <motion.div
              key={index}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(34, 197, 94, 0.5)",
                boxShadow: "0 10px 30px rgba(34, 197, 94, 0.2)"
              }}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <motion.div 
                className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${module.color} inline-block`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {module.icon}
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{module.description}</p>
              
              <div className="space-y-1">
                {module.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                className="mt-4 w-full py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg text-green-400 font-mono text-sm hover:bg-green-600/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                LAUNCH MODULE
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Investigations */}
        <motion.div
          className="bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
            <Eye className="w-6 h-6 mr-3" />
            Recent Investigations
          </h2>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Investigation Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {recentInvestigations.map((investigation, index) => (
                  <motion.tr 
                    key={investigation.id} 
                    className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <td className="py-4">
                      <div className="flex items-center">
                        <Code2 className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white font-mono">{investigation.target}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-300">{investigation.type}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                        investigation.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                        investigation.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {investigation.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-400 text-sm">{investigation.timestamp}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OsintFrameworkPage;