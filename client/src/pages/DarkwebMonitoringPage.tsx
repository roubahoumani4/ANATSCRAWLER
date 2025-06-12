import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Skull, Globe, Shield, AlertTriangle, Eye, Database, Terminal, Activity, Zap, Clock, Search } from "lucide-react";
import BackButton from "@/components/ui/back-button";

const DarkwebMonitoringPage = () => {
  const { language } = useLanguage();
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("");
    setMatrixChars(chars);
    
    // Get search count from localStorage
    const storedCount = localStorage.getItem('darkwebSearchCount');
    if (storedCount) {
      setSearchCount(parseInt(storedCount, 10));
    }
  }, []);

  const monitoringModules = [
    {
      title: "Market Intelligence",
      description: "Monitor darkweb marketplaces and forums",
      icon: <Globe className="w-8 h-8" />,
      color: "from-purple-500 to-violet-600",
      threats: ["Stolen Credentials", "Corporate Data", "Financial Information", "Personal Records"]
    },
    {
      title: "Threat Actor Tracking",
      description: "Monitor known threat actors and groups",
      icon: <Eye className="w-8 h-8" />,
      color: "from-red-500 to-pink-600",
      threats: ["APT Groups", "Ransomware Operators", "Data Brokers", "Cyber Criminals"]
    },
    {
      title: "Data Breach Monitoring",
      description: "Track leaked corporate and personal data",
      icon: <Shield className="w-8 h-8" />,
      color: "from-orange-500 to-red-500",
      threats: ["Database Dumps", "Credential Lists", "Source Code", "Internal Documents"]
    },
    {
      title: "Exploit Intelligence",
      description: "Monitor zero-day exploits and vulnerabilities",
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-500",
      threats: ["Zero-Days", "Exploit Kits", "Malware-as-a-Service", "Attack Tools"]
    }
  ];

  const recentAlerts = [
    { id: 1, type: "Data Breach", target: "company-database.sql", severity: "Critical", source: "DarkMarket", timestamp: "15 minutes ago" },
    { id: 2, type: "Credential Dump", target: "corporate-emails.txt", severity: "High", source: "UndergroundForum", timestamp: "1 hour ago" },
    { id: 3, type: "Exploit Sale", target: "CVE-2024-XXXX", severity: "High", source: "ExploitMarket", timestamp: "3 hours ago" },
    { id: 4, type: "Threat Actor", target: "APT-Unknown", severity: "Medium", source: "TorForum", timestamp: "6 hours ago" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/darkweb-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        
        // Increment search count for unsubscribed users
        const newCount = searchCount + 1;
        setSearchCount(newCount);
        localStorage.setItem('darkwebSearchCount', newCount.toString());
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewInfo = (result: any) => {
    // Check if user exceeded search limit (assuming user is not subscribed for now)
    if (searchCount > 5) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedResult(result);
  };

  const handleSubscribe = () => {
    // Add subscription logic here
    alert("Subscription feature coming soon!");
    setShowSubscriptionModal(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-400 font-mono text-xs select-none"
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
        <BackButton color="purple" />
        


        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <motion.div
              className="p-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(147, 51, 234, 0.3)",
                  "0 0 40px rgba(147, 51, 234, 0.6)",
                  "0 0 20px rgba(147, 51, 234, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Skull className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-500">
                DARKWEB MONITORING
              </h1>
              <p className="text-gray-400 font-mono text-lg">
                Deep Web Intelligence & Threat Detection System
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <motion.div
            className="flex items-center space-x-6 p-4 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-purple-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {[
              { icon: Activity, label: "CRAWLERS", status: "24 ACTIVE", color: "text-purple-400" },
              { icon: Database, label: "SOURCES", status: "156 MONITORED", color: "text-red-400" },
              { icon: AlertTriangle, label: "ALERTS", status: "12 PENDING", color: "text-orange-400" }
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

        {/* Search Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-gray-900/60 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <Search className="text-purple-400" size={24} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "French" ? "Rechercher des menaces, credentials, ou activités..." : "Search for threats, credentials, or activities..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-lg"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : (language === "French" ? "Rechercher" : "Search")}
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              {language === "French" 
                ? "🔗 Connecté à Elasticsearch (192.168.1.110:9200)"
                : "🔗 Connected to Elasticsearch (192.168.1.110:9200)"
              }
            </div>
          </div>
        </motion.div>

        {/* Monitoring Modules Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {monitoringModules.map((module, index) => (
            <motion.div
              key={index}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(147, 51, 234, 0.5)",
                boxShadow: "0 10px 30px rgba(147, 51, 234, 0.2)"
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
                {module.threats.map((threat, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">{threat}</span>
                  </div>
                ))}
              </div>

              <motion.button
                className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600/20 to-violet-600/20 border border-purple-500/50 rounded-lg text-purple-400 font-mono text-sm hover:bg-purple-600/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                START MONITORING
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            className="bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
              <Search className="w-6 h-6 mr-3" />
              Search Results Found ({searchResults.length})
            </h2>
            
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-purple-400 font-mono text-sm">Source: {result.source}</div>
                      <div className="text-gray-300 text-sm mt-1">Score: {result.score}</div>
                      <div className="text-gray-400 text-xs mt-1">{result.timestamp}</div>
                    </div>
                    <button
                      onClick={() => handleViewInfo(result)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      View Info
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              Search limit: {searchCount}/5 (Unsubscribed users)
            </div>
          </motion.div>
        )}

        {/* Subscription Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/50 rounded-2xl p-8 max-w-md mx-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-4">Subscription Required</h3>
              <p className="text-gray-300 mb-6">
                You have exceeded your free search limit. Subscribe to continue accessing detailed information.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleSubscribe}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
                >
                  Subscribe Now
                </button>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Result Details Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/50 rounded-2xl p-8 max-w-2xl mx-4 max-h-96 overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-4">Search Result Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Source:</label>
                  <div className="text-white font-mono">{selectedResult.source}</div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Content:</label>
                  <div className="text-gray-300 bg-gray-800/50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedResult.content}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">URL:</label>
                  <div className="text-blue-400 text-sm">{selectedResult.url || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Timestamp:</label>
                  <div className="text-gray-300 text-sm">{selectedResult.timestamp}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="mt-6 w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {/* Real-time Alerts */}
        <motion.div
          className="bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3" />
            Real-time Threat Alerts
          </h2>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700/50">
                  <th className="pb-3 font-medium">Alert Type</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Detected</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert, index) => (
                  <motion.tr 
                    key={alert.id} 
                    className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <td className="py-4">
                      <div className="flex items-center">
                        <Terminal className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-white font-mono">{alert.type}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-300 font-mono text-sm">{alert.target}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-300">{alert.source}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400 text-sm">{alert.timestamp}</span>
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
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-700 text-white font-mono rounded-lg hover:from-purple-500 hover:to-violet-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              VIEW ALL ALERTS
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-mono rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CONFIGURE MONITORING
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DarkwebMonitoringPage;