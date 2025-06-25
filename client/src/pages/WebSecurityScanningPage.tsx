import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Shield, Globe, Search, AlertTriangle, Database, Terminal, Activity, Zap, Play, Pause, Settings } from "lucide-react";
import BackButton from "@/components/ui/back-button";

const WebSecurityScanningPage = () => {
  const { language } = useLanguage();
  const [matrixChars, setMatrixChars] = useState<string[]>([]);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("");
    setMatrixChars(chars);
  }, []);

  const scanningModules = [
    {
      title: "Vulnerability Scanner",
      description: "Comprehensive web application vulnerability assessment",
      icon: <Shield className="w-8 h-8" />,
      color: "from-cyan-500 to-blue-600",
      vulnerabilities: ["SQL Injection", "XSS", "CSRF", "Authentication Bypass"]
    },
    {
      title: "Port Scanner",
      description: "Network port discovery and service enumeration",
      icon: <Search className="w-8 h-8" />,
      color: "from-blue-500 to-indigo-600",
      vulnerabilities: ["Open Ports", "Service Detection", "Banner Grabbing", "OS Fingerprinting"]
    },
    {
      title: "SSL/TLS Analysis",
      description: "Certificate and encryption protocol assessment",
      icon: <Database className="w-8 h-8" />,
      color: "from-indigo-500 to-purple-600",
      vulnerabilities: ["Weak Ciphers", "Certificate Issues", "Protocol Flaws", "Configuration Errors"]
    },
    {
      title: "Web Crawler",
      description: "Site mapping and content discovery",
      icon: <Globe className="w-8 h-8" />,
      color: "from-purple-500 to-pink-600",
      vulnerabilities: ["Hidden Directories", "Backup Files", "Admin Panels", "Sensitive Data"]
    }
  ];

  const activeScan = [
    { id: 1, target: "https://target-website.com", type: "Full Scan", progress: 78, status: "Running", vulnerabilities: 5 },
    { id: 2, target: "https://api.example.com", type: "API Test", progress: 45, status: "Running", vulnerabilities: 2 },
    { id: 3, target: "192.168.1.100", type: "Port Scan", progress: 92, status: "Running", vulnerabilities: 8 },
    { id: 4, target: "https://secure-site.org", type: "SSL Analysis", progress: 100, status: "Completed", vulnerabilities: 1 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getVulnerabilityColor = (count: number) => {
    if (count >= 5) return 'text-red-400';
    if (count >= 3) return 'text-orange-400';
    if (count >= 1) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-cyan-400 font-mono text-xs select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
            }}
            animate={{
              y: ["0vh", "100vh"],
            }}
            transition={{
              duration: Math.random() * 6 + 8,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "linear"
            }}
          >
            {matrixChars.slice(0, 10).map((_, idx) => (
              <div key={idx} className="mb-1">
                {matrixChars[Math.floor(Math.random() * matrixChars.length)]}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 p-8">
        {/* Back Button */}
        <BackButton color="cyan" />
        
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <motion.div
              className="p-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(6, 182, 212, 0.3)",
                  "0 0 40px rgba(6, 182, 212, 0.6)",
                  "0 0 20px rgba(6, 182, 212, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                WEB SECURITY SCANNING
              </h1>
              <p className="text-gray-400 font-mono text-lg">
                Automated Web Application Security Assessment Platform
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <motion.div
            className="flex items-center space-x-6 p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-cyan-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {[
              { icon: Activity, label: "SCANNERS", status: "4 ACTIVE", color: "text-cyan-400" },
              { icon: Terminal, label: "TARGETS", status: "12 QUEUED", color: "text-blue-400" },
              { icon: AlertTriangle, label: "VULNERABILITIES", status: "16 FOUND", color: "text-orange-400" }
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

        {/* Quick Scan Section */}
        <motion.div
          className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/80 border border-cyan-500/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Security Scan
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Enter target URL or IP address..."
              className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white font-mono focus:border-cyan-400/60 focus:outline-none transition-all duration-300"
            />
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" />
              <span>START SCAN</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Scanning Modules Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {scanningModules.map((module, index) => (
            <motion.div
              key={index}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(6, 182, 212, 0.5)",
                boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)"
              }}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
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
                {module.vulnerabilities.map((vuln, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">{vuln}</span>
                  </div>
                ))}
              </div>

              <motion.button
                className="mt-4 w-full py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/50 rounded-lg text-cyan-400 font-mono text-sm hover:bg-cyan-600/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CONFIGURE SCANNER
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Active Scans */}
        <motion.div
          className="bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3" />
            Active Security Scans
          </h2>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Scan Type</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Vulnerabilities</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeScan.map((scan, index) => (
                  <motion.tr 
                    key={scan.id} 
                    className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <td className="py-4">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="text-white font-mono text-sm">{scan.target}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-300">{scan.type}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${scan.progress}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <span className="text-gray-300 text-sm font-mono">{scan.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono border ${getStatusColor(scan.status)}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`font-mono text-lg font-bold ${getVulnerabilityColor(scan.vulnerabilities)}`}>
                        {scan.vulnerabilities}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded text-xs font-mono hover:bg-orange-600/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Pause className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-mono hover:bg-blue-600/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Settings className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mt-6">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-mono rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              VIEW ALL SCANS
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-mono rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              EXPORT RESULTS
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WebSecurityScanningPage;