import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Eye, AlertTriangle, Mail, Database, TrendingUp } from "lucide-react";
import ResultsTable from "@/components/dashboard/ResultsTable";

const DiscoveryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Breach Information Database
  const BREACH_INFO: { [key: string]: any } = {
    'CompilationOfManyBreaches': {
      name: 'Compilation of Many Breaches (COMB)',
      description: 'A massive compilation of credentials from multiple historical data breaches',
      date: 'February 2021',
      affectedAccounts: '3.2 billion',
      whatHappened: 'On February 2, 2021, a user known as Singularity0x01 posted a .ZIP file on RaidForums containing billions of usernames and passwords. The data contained more than 3.2 billion unique pairs of email addresses and passwords, including 450 million Gmail addresses and 450 million Yahoo! email addresses. This is a compilation of credentials from past data breaches involving Netflix, LinkedIn, Hotmail, Yahoo, Bitcoin and other platforms.',
      dataCompromised: ['Email addresses', 'Passwords', 'Usernames'],
      recommendations: [
        'Immediately reset passwords for all exposed accounts',
        'Enable two-factor authentication (2FA) on all accounts',
        'Use unique passwords for each online service',
        'Consider using a password manager',
        'Monitor accounts for suspicious activity'
      ]
    },
    'naz.api': {
      name: 'Naz.API',
      description: 'A large-scale credential database breach',
      date: 'September 2023',
      affectedAccounts: '70.8 million',
      whatHappened: 'In September 2023, the Naz.API database was exposed containing over 70 million user credentials. This database appears to be a collection from various sources and contains email addresses, usernames, and passwords in plaintext format. The breach was discovered when the database was being sold on dark web marketplaces.',
      dataCompromised: ['Email addresses', 'Passwords', 'Usernames', 'Account metadata'],
      recommendations: [
        'Change passwords immediately on all affected accounts',
        'Enable multi-factor authentication (MFA) wherever possible',
        'Review recent account activity for signs of unauthorized access',
        'Be vigilant for phishing attempts using your exposed information',
        'Consider credit monitoring services if financial data was exposed'
      ]
    }
  };

  // Confetti Component
  const Confetti = () => {
    const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      color: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
    }));

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              left: `${piece.left}%`,
              top: '-10px',
              backgroundColor: piece.color,
            }}
            animate={{
              y: ['0vh', '120vh'],
              rotate: [0, 360],
              opacity: [1, 0.8, 0],
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  };

  // Check if input is a bare domain (for blocking)
  const isDomain = (input: string): boolean => {
    const trimmed = input.trim();
    // Match bare domains like "yahoo.com", "example.org", etc.
    // But NOT emails like "user@yahoo.com"
    const bareDomainRegex = /^(?!.*@)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return bareDomainRegex.test(trimmed);
  };

  // Validate search input
  const isValidSearchInput = (input: string): boolean => {
    const trimmed = input.trim();
    
    // Check if it's a bare domain
    if (isDomain(trimmed)) {
      return false;
    }
    
    // Allow emails, usernames, phone numbers, etc.
    // Basically anything that's not a bare domain
    return trimmed.length > 0;
  };

  const handleDarkWebSearch = async () => {
    setValidationError("");
    
    if (!searchQuery.trim()) {
      setValidationError("Please enter a search term");
      return;
    }

    if (!isValidSearchInput(searchQuery)) {
      setValidationError("Please search for emails or usernames. For domain searches, use the Domain Monitoring page.");
      return;
    }

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

  const handleExport = () => {
    // Export functionality can be implemented here
    console.log('Export functionality to be implemented');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 min-h-screen bg-jetBlack text-coolWhite"
    >
      <div className="w-full">
        {/* Header Section */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded bg-red-700/10 text-red-400">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Discovery - Dark Web Intelligence</h1>
              <p className="text-sm text-gray-400">
                Search and discover compromised credentials and data from dark web sources
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          className="mt-6 bg-gray-850 rounded-lg p-8 border border-gray-800 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleDarkWebSearch(); }} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setValidationError("");
                }}
                placeholder="Enter email, username, or phone number..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                disabled={isSearching}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                "Search"
              )}
            </motion.button>
          </form>

          {/* Validation Error Message */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-semibold">Invalid Input</div>
                  <div className="text-sm text-gray-300 mt-1">{validationError}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading Animation */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-gray-850 rounded-lg p-16 border border-gray-800 w-full"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                <motion.div
                  className="relative w-20 h-20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full"></div>
                </motion.div>
                <div className="text-center">
                  <p className="text-xl text-gray-300 font-semibold mb-2">Scanning dark web databases...</p>
                  <p className="text-sm text-gray-500">Searching for compromised credentials</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Section */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6"
          >
            <div className="bg-gray-850 rounded-lg p-8 border border-gray-800 w-full">
              <h4 className="text-lg font-semibold text-red-400 mb-6 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Search Results ({searchResults.length})
              </h4>
              
              {searchResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg p-16 border-2 border-green-700/50 shadow-2xl text-center overflow-hidden"
                >
                  {/* Confetti Animation */}
                  <Confetti />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-block mb-6"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{
                            boxShadow: [
                              "0 0 20px rgba(34, 197, 94, 0.3)",
                              "0 0 40px rgba(34, 197, 94, 0.5)",
                              "0 0 20px rgba(34, 197, 94, 0.3)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center"
                        >
                          <Shield className="w-16 h-16 text-green-400" strokeWidth={2.5} />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h2 className="text-5xl font-bold text-green-400 mb-4">
                        0
                      </h2>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        Data Breaches
                      </h3>
                      <div className="max-w-2xl mx-auto">
                        <p className="text-xl text-gray-300 mb-2">
                          Good news — no breaches found! This search term wasn't found in any of the monitored breach databases.
                        </p>
                        <p className="text-lg text-gray-400 mb-6">
                          Your search for <span className="text-cyan-400 font-semibold">{searchQuery}</span> appears to be safe. That's great news!
                        </p>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 p-4 bg-green-900/30 border border-green-700/50 rounded-lg inline-block"
                      >
                        <p className="text-sm text-green-300">
                          ✓ Scanned across all monitored breach databases
                        </p>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Results Table */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mb-6"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left p-3 text-gray-400 font-semibold">#</th>
                            <th className="text-left p-3 text-gray-400 font-semibold">Score</th>
                            <th className="text-left p-3 text-gray-400 font-semibold">Email/Username</th>
                            <th className="text-left p-3 text-gray-400 font-semibold">Password</th>
                            <th className="text-left p-3 text-gray-400 font-semibold">Source</th>
                            <th className="text-left p-3 text-gray-400 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((result, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="p-3 text-gray-400">{index + 1}</td>
                              <td className="p-3">
                                <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm font-semibold">
                                  {result.score?.toFixed(2) || '0.00'}
                                </span>
                              </td>
                              <td className="p-3">
                                <code className="text-blue-300 font-mono text-sm">
                                  {result.email || result.name || result.username || '-'}
                                </code>
                              </td>
                              <td className="p-3">
                                <code className="text-red-300 font-mono text-sm">
                                  {result.password ? '••••••••' : '-'}
                                </code>
                              </td>
                              <td className="p-3">
                                <span className="text-cyan-400 font-semibold text-sm">
                                  {result.database_source || result.index || 'Unknown'}
                                </span>
                              </td>
                              <td className="p-3">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedResult(result);
                                    setShowDetailsModal(true);
                                  }}
                                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                                >
                                  Details
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Export Button */}
                  <div className="flex justify-center mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleExport}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export to CSV
                    </motion.button>
                  </div>

                  {/* Breach Information Panels */}
                  {searchResults.length > 0 && (
                    <div className="mt-8 space-y-6">
                      {[...new Set(searchResults.map(r => r.database_source).filter(Boolean))].map((dbSource) => {
                        const breachInfo = BREACH_INFO[dbSource];
                        if (!breachInfo) return null;

                        return (
                          <motion.div
                            key={dbSource}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-gradient-to-br from-red-900/20 to-pink-900/20 rounded-lg border border-red-700/50 overflow-hidden"
                          >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 p-4 border-b border-red-900/50">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                <h3 className="text-xl font-bold text-red-400">{breachInfo.name}</h3>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{breachInfo.description}</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                  <Eye className="w-5 h-5 text-red-400" />
                                  What Happened
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {breachInfo.whatHappened}
                                </p>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                  <div className="text-gray-400 text-xs mb-1">Affected Accounts</div>
                                  <div className="text-2xl font-bold text-white">{breachInfo.affectedAccounts}</div>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                  <div className="text-gray-400 text-xs mb-1">Breach Occurred</div>
                                  <div className="text-2xl font-bold text-white">{breachInfo.date}</div>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                  <div className="text-gray-400 text-xs mb-1">Data Compromised</div>
                                  <div className="text-sm font-semibold text-white">{breachInfo.dataCompromised.join(', ')}</div>
                                </div>
                              </div>

                              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                                <h5 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                                  <Shield className="w-5 h-5" />
                                  Recommendations
                                </h5>
                                <ul className="space-y-1 text-gray-300 text-sm">
                                  {breachInfo.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-yellow-400 mt-1">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Info Section - When no search performed yet */}
        {!showResults && !isSearching && (
          <motion.div
            className="mt-6 bg-gradient-to-br from-gray-850 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Search className="w-6 h-6 text-red-400" />
              Search Guidelines
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Email & Username Search</h5>
                    <p className="text-gray-300 text-xs">Search for individual email addresses or usernames to check if they've been compromised</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Search className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Exact Format</h5>
                    <p className="text-gray-300 text-xs">Use exact email format (e.g., <code className="text-cyan-400 bg-gray-800 px-1 py-0.5 rounded text-xs">user@example.com</code>) for best results</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Domain Monitoring</h5>
                    <p className="text-gray-300 text-xs">For domain-wide searches (e.g., <code className="text-cyan-400 bg-gray-800 px-1 py-0.5 rounded text-xs">@company.com</code>), use Domain Monitoring page</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Database className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Breach Databases</h5>
                    <p className="text-gray-300 text-xs">Results from monitored breach databases</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Result Details</h5>
                    <p className="text-gray-300 text-xs">Each result includes password, database source, and relevance score</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-4 rounded-lg border border-red-700/30 hover:border-red-500/50 transition-all shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <Eye className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm mb-1">Full Information</h5>
                    <p className="text-gray-300 text-xs">Click <span className="font-semibold text-red-400">Details</span> to view credential info and breach context</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-850 rounded-lg border border-gray-700 max-w-2xl w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-400" />
                  Credential Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-500 mb-1">Email Address</div>
                  <code className="text-lg text-blue-300 font-mono">
                    {selectedResult.email || selectedResult.name || selectedResult.username || 'N/A'}
                  </code>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-500 mb-1">Password</div>
                  <code className="text-lg text-red-300 font-mono">{selectedResult.password || 'N/A'}</code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-500 mb-1">Database Source</div>
                    <div className="text-lg text-cyan-400 font-semibold">
                      {selectedResult.database_source || selectedResult.index || 'Unknown'}
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-500 mb-1">Relevance Score</div>
                    <div className="text-lg text-green-400 font-bold">
                      {selectedResult.score?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                {selectedResult.context && (
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-500 mb-1">Full Details</div>
                    <code className="text-sm text-gray-300 font-mono break-all">
                      {selectedResult.context}
                    </code>
                  </div>
                )}

                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-yellow-400 font-semibold mb-1">Security Alert</div>
                      <div className="text-sm text-gray-300">
                        This credential has been exposed in a data breach. Immediately change the password on all accounts where it was used.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const credential = `${selectedResult.email || selectedResult.name || selectedResult.username}:${selectedResult.password || ''}`;
                    navigator.clipboard.writeText(credential);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Credentials
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiscoveryPage;
