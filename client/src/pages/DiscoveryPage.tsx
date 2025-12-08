import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Terminal, Eye, Loader } from "lucide-react";
import ResultsTable from "@/components/dashboard/ResultsTable";

const DiscoveryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleDarkWebSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(false);

    try {
      const response = await fetch('/api/v1/search/darkweb-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } else {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData && errorData.errors && errorData.errors[0] && errorData.errors[0].msg) {
            errorMsg = errorData.errors[0].msg;
          } else if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {}
        console.error('Search failed:', errorMsg);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDarkWebSearch();
    }
  };

  const handleExport = () => {
    // Export functionality can be implemented here
    console.log('Export functionality to be implemented');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-jetBlack text-coolWhite p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-4">
            <Shield className="w-10 h-10 mr-3 text-red-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Discovery - Dark Web Intelligence
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-13">
            Search and discover compromised credentials and data from dark web sources
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-2 border-red-400/20 rounded-2xl p-8 mb-8 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.h3 
            className="text-2xl font-bold text-red-400 mb-6 flex items-center"
            animate={{
              textShadow: [
                "0 0 20px rgba(248, 113, 113, 0.5)",
                "0 0 30px rgba(248, 113, 113, 0.7)",
                "0 0 20px rgba(248, 113, 113, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Search className="w-6 h-6 mr-2" />
            DARK WEB INTELLIGENCE SEARCH
          </motion.h3>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Enter search terms for dark web reconnaissance..."
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border-2 border-red-400/20 rounded-xl text-white placeholder-gray-400 font-mono text-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 transition-all duration-300"
                disabled={isSearching}
              />
              {isSearching && (
                <motion.div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader className="w-5 h-5 text-red-400" />
                </motion.div>
              )}
            </div>

            <motion.button
              onClick={handleDarkWebSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-700 text-white font-black rounded-xl border-2 border-red-400/50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-red-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSearching ? (
                <span className="flex items-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  SEARCHING...
                </span>
              ) : (
                "SEARCH"
              )}
            </motion.button>
          </div>

          {/* Status Indicators */}
          <motion.div
            className="flex items-center justify-start space-x-6 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              { icon: Terminal, label: "TERMINAL", status: "ACTIVE", color: "text-green-400" },
              { icon: Eye, label: "SURVEILLANCE", status: "MONITORING", color: "text-red-400" }
            ].map((status, idx) => (
              <motion.div
                key={idx}
                className="flex items-center space-x-2 text-sm font-mono"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  delay: idx * 0.3,
                  repeat: Infinity,
                }}
              >
                <status.icon className={`w-4 h-4 ${status.color}`} />
                <span className="text-gray-400">{status.label}:</span>
                <span className={status.color}>{status.status}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Search Results Section */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-2 border-red-400/20 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-2xl font-black text-red-400 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-2" />
                RECONNAISSANCE RESULTS ({searchResults.length})
              </h4>
              
              {searchResults.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No results found for your search query.</p>
                  <p className="text-gray-500 text-sm mt-2">Try different search terms or refine your query.</p>
                </motion.div>
              ) : (
                <ResultsTable 
                  results={searchResults} 
                  onExport={handleExport} 
                  isExported={false} 
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Info Section - When no search performed yet */}
        {!showResults && !isSearching && (
          <motion.div
            className="bg-gradient-to-br from-gray-800/20 to-gray-900/20 border-2 border-gray-700/30 rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-gray-300 mb-4">Search Guidelines</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Enter usernames, email addresses, phone numbers, or other identifiers</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Search results include matched terms, context, and relevance scores</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>All searches are performed against indexed dark web data sources</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Use specific terms for more accurate results</span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DiscoveryPage;
