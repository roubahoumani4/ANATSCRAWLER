import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  Database,
  TrendingUp,
  Mail,
  Key,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from "axios";
import MatrixBackground from "@/components/ui/MatrixBackground";

// Confetti component
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
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 20,
            opacity: [1, 1, 0],
            rotate: 360,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

interface DomainResult {
  email: string;
  password: string;
  database_source: string;
  score: number;
}

interface DomainStats {
  domain: string;
  totalExposed: number;
  databases: {
    [key: string]: number;
  };
  results: DomainResult[];
  riskScore: number;
  passwordStrength: {
    weak: number;
    medium: number;
    strong: number;
  };
}

const DomainMonitoringPage = () => {
  // Load persisted search from localStorage
  const [searchDomain, setSearchDomain] = useState(() => {
    return localStorage.getItem('domainMonitoringSearchQuery') || "";
  });
  const [isSearching, setIsSearching] = useState(false);
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());
  const [selectedResult, setSelectedResult] = useState<DomainResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Persist search query to localStorage whenever it changes
  useEffect(() => {
    if (searchDomain) {
      localStorage.setItem('domainMonitoringSearchQuery', searchDomain);
    }
  }, [searchDomain]);

  // Clear search function
  const clearSearch = () => {
    setSearchDomain("");
    localStorage.removeItem('domainMonitoringSearchQuery');
    setDomainStats(null);
    setShowResults(false);
    setValidationError("");
  };

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

  // Validate domain format
  const isValidDomain = (domain: string): boolean => {
    // Basic domain validation regex
    // Matches: example.com, sub.example.com, example.co.uk, etc.
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
    return domainRegex.test(domain.trim());
  };

  // Perform actual domain search using your API
  const performDomainSearch = async (domain: string) => {
    setIsSearching(true);
    setShowResults(false);
    const searchStartTime = Date.now();
    
    try {
      // Search for all emails matching the domain pattern
      const searchQuery = `@${domain}`;
      
      const response = await fetch('/api/v1/search/darkweb-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 1000 // Get more results for domain analysis
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.results) {
        throw new Error('No results found');
      }

      // Process the results
      const results: DomainResult[] = data.results
        .filter((r: any) => r.email && r.email.toLowerCase().includes(`@${domain.toLowerCase()}`))
        .map((r: any) => ({
          email: r.email || r.name || '',
          password: r.password || '',
          database_source: r.database_source || r.index || 'Unknown',
          score: r.score || 0
        }));

      // Calculate statistics
      const databases: { [key: string]: number } = {};
      let weak = 0, medium = 0, strong = 0;

      results.forEach(result => {
        // Count by database
        if (result.database_source && result.database_source !== 'Unknown') {
          databases[result.database_source] = (databases[result.database_source] || 0) + 1;
        }
        
        // Analyze password strength
        const pwd = result.password;
        if (!pwd) {
          weak++;
        } else if (pwd.length < 8 || pwd.match(/^[0-9]+$/) || pwd.toLowerCase() === pwd) {
          weak++;
        } else if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
          strong++;
        } else {
          medium++;
        }
      });

      // Calculate risk score (0-100)
      // Factors: total exposed accounts (60%), weak passwords (30%), number of databases (10%)
      const accountScore = Math.min(60, results.length * 2);
      const weakPasswordScore = Math.min(30, weak * 3);
      const databaseScore = Math.min(10, Object.keys(databases).length * 5);
      const riskScore = Math.min(100, accountScore + weakPasswordScore + databaseScore);

      const stats = {
        domain,
        totalExposed: results.length,
        databases,
        results: results.slice(0, 100), // Limit display to 100 for performance
        riskScore: Math.round(riskScore),
        passwordStrength: { weak, medium, strong }
      };

      setDomainStats(stats);
      setIsSearching(false);
      setShowResults(true);

      // Track search in history
      const searchDuration = Date.now() - searchStartTime;
      try {
        console.log('Attempting to save domain search history...', {
          searchType: 'domain-monitoring',
          query: domain.trim(),
          resultsCount: results.length
        });
        
        const historyResponse = await axios.post('/api/v1/history/searches', {
          searchType: 'domain-monitoring',
          query: domain.trim(),
          queryType: 'domain-search',
          resultsCount: results.length,
          hasResults: results.length > 0,
          results: results.slice(0, 10), // Store only first 10 results
          metadata: {
            searchDuration,
            riskScore: stats.riskScore,
            totalDatabases: Object.keys(databases).length,
            passwordStrength: stats.passwordStrength
          },
          status: results.length > 0 ? 'success' : 'no-results'
        }, {
          withCredentials: true
        });
        
        console.log('Domain search history saved successfully:', historyResponse.data);
      } catch (historyError: any) {
        console.error('Failed to track search history:', historyError);
        console.error('Error details:', historyError.response?.data || historyError.message);
        // Don't fail the search if history tracking fails
      }
    } catch (error) {
      console.error('Domain search error:', error);
      setIsSearching(false);
      
      // Show error state
      setDomainStats({
        domain,
        totalExposed: 0,
        databases: {},
        results: [],
        riskScore: 0,
        passwordStrength: { weak: 0, medium: 0, strong: 0 }
      });
      setShowResults(true);

      // Track failed search
      try {
        console.log('Tracking failed domain search...');
        await axios.post('/api/v1/history/searches', {
          searchType: 'domain-monitoring',
          query: domain.trim(),
          queryType: 'domain-search',
          resultsCount: 0,
          hasResults: false,
          metadata: {
            searchDuration: Date.now() - searchStartTime,
            error: String(error)
          },
          status: 'failed'
        }, {
          withCredentials: true
        });
        console.log('Failed domain search tracked successfully');
      } catch (historyError: any) {
        console.error('Failed to track search history:', historyError);
        console.error('Error details:', historyError.response?.data || historyError.message);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    
    if (!searchDomain.trim()) {
      setValidationError("Please enter a domain");
      return;
    }
    
    if (!isValidDomain(searchDomain.trim())) {
      setValidationError("Please enter a valid domain (e.g., company.com)");
      return;
    }
    
    performDomainSearch(searchDomain.trim());
  };

  const toggleEmailExpand = (index: number) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEmails(newExpanded);
  };

  const exportToCSV = () => {
    if (!domainStats) return;

    const headers = ['Email', 'Password', 'Database Source', 'Relevance Score'];
    const rows = domainStats.results.map(r => [
      r.email,
      r.password,
      r.database_source,
      r.score.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${domainStats.domain}_breach_report.csv`;
    link.click();
  };

  // Chart data
  const databaseChartData = useMemo(() => {
    if (!domainStats) return [];
    return Object.entries(domainStats.databases).map(([name, value]) => ({
      name: name === 'CompilationOfManyBreaches' ? 'COMB' : name,
      value
    }));
  }, [domainStats]);

  const passwordStrengthData = useMemo(() => {
    if (!domainStats) return [];
    return [
      { name: 'Weak', value: domainStats.passwordStrength.weak, color: '#ef4444' },
      { name: 'Medium', value: domainStats.passwordStrength.medium, color: '#f59e0b' },
      { name: 'Strong', value: domainStats.passwordStrength.strong, color: '#10b981' }
    ];
  }, [domainStats]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 min-h-screen bg-jetBlack text-coolWhite relative"
    >
      <MatrixBackground />
      <div className="w-full relative z-10">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded bg-cyan-700/10 text-white">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Domain Monitoring</h1>
              <p className="text-sm text-gray-400">
                Monitor and analyze domain exposure across dark web breach databases
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 bg-gray-850 rounded-lg p-8 border border-gray-800 w-full"
        >
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchDomain}
                onChange={(e) => {
                  setSearchDomain(e.target.value);
                  setValidationError("");
                }}
                placeholder="Enter domain (e.g., company.com)"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchDomain && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={isSearching || !searchDomain.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                "Analyze Domain"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-850 rounded-lg p-12 border border-gray-700 shadow-2xl mb-8"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
                />
                <p className="text-gray-400 text-lg">Scanning dark web databases...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && domainStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {domainStats.totalExposed === 0 ? (
                /* No Results Found */
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
                          Good news — no breaches found! This domain wasn't found in any of the monitored breach databases.
                        </p>
                        <p className="text-lg text-gray-400 mb-6">
                          Domain <span className="text-cyan-400 font-semibold">@{domainStats.domain}</span> appears to be safe. That's great news!
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
                /* Results Display */
                <>
              {/* Stats Overview */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-lg p-6 border border-red-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <span className="text-3xl font-bold text-white">{domainStats.totalExposed}</span>
                  </div>
                  <p className="text-gray-300 font-semibold">Exposed Accounts</p>
                  <p className="text-xs text-gray-500 mt-1">Found in breach databases</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 rounded-lg p-6 border border-orange-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                    <span className="text-3xl font-bold text-white">{domainStats.riskScore}</span>
                  </div>
                  <p className="text-gray-300 font-semibold">Risk Score</p>
                  <p className="text-xs text-gray-500 mt-1">Out of 100</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-6 border border-blue-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Database className="w-8 h-8 text-blue-400" />
                    <span className="text-3xl font-bold text-white">{Object.keys(domainStats.databases).length}</span>
                  </div>
                  <p className="text-gray-300 font-semibold">Breach Sources</p>
                  <p className="text-xs text-gray-500 mt-1">Different databases</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-6 border border-purple-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Key className="w-8 h-8 text-purple-400" />
                    <span className="text-3xl font-bold text-white">{domainStats.passwordStrength.weak}</span>
                  </div>
                  <p className="text-gray-300 font-semibold">Weak Passwords</p>
                  <p className="text-xs text-gray-500 mt-1">Require immediate change</p>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Database Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gray-850 rounded-lg p-6 border border-gray-700 shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Database Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={databaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Password Strength Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-gray-850 rounded-lg p-6 border border-gray-700 shadow-xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Password Strength Analysis</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={passwordStrengthData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {passwordStrengthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Exposed Credentials Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-gray-850 rounded-lg border border-gray-700 shadow-xl overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-red-400" />
                      <h3 className="text-xl font-bold text-white">Exposed Credentials ({domainStats.totalExposed})</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportToCSV}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </motion.button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">#</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">Password</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">Database Source</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">Score</th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domainStats.results.map((result, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-4 text-gray-400 font-mono text-sm">{index + 1}</td>
                          <td className="p-4">
                            <code className="bg-blue-900/30 px-3 py-1.5 rounded text-blue-300 font-mono text-sm">
                              {result.email}
                            </code>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <code className="bg-red-900/30 px-3 py-1.5 rounded text-red-300 font-mono text-sm">
                                {expandedEmails.has(index) ? result.password : '••••••••'}
                              </code>
                              <button
                                onClick={() => toggleEmailExpand(index)}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                              >
                                {expandedEmails.has(index) ? (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-semibold text-cyan-400">
                              {result.database_source}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs">
                              {result.score.toFixed(1)}
                            </span>
                          </td>
                          <td className="p-4">
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

              {/* Breach Information Panels */}
              {domainStats.results.length > 0 && (
                <div className="mt-8 space-y-6">
                  {[...new Set(domainStats.results.map(r => r.database_source).filter(Boolean))].map((dbSource) => {
                    const breachInfo = BREACH_INFO[dbSource];
                    if (!breachInfo) return null;

                    return (
                      <motion.div
                        key={dbSource}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-700/50 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 p-4 border-b border-cyan-900/50">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-cyan-400" />
                            <h3 className="text-xl font-bold text-cyan-400">{breachInfo.name}</h3>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{breachInfo.description}</p>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Eye className="w-5 h-5 text-cyan-400" />
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section - When no search performed yet */}
        {!showResults && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-gray-850 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-xl"
          >
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  What We Monitor
                </h4>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-4 rounded-lg border border-cyan-700/30 hover:border-cyan-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Email Addresses</h5>
                        <p className="text-gray-300 text-xs">All email addresses associated with your domain</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-4 rounded-lg border border-cyan-700/30 hover:border-cyan-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg">
                        <Key className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Credentials</h5>
                        <p className="text-gray-300 text-xs">Exposed passwords and credentials</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-4 rounded-lg border border-cyan-700/30 hover:border-cyan-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg">
                        <Database className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Breach Databases</h5>
                        <p className="text-gray-300 text-xs">
                          <span className="font-semibold text-white">COMB</span>, <span className="font-semibold text-white">Naz.API</span>, and more
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-4 rounded-lg border border-cyan-700/30 hover:border-cyan-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg">
                        <Activity className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Risk Scoring</h5>
                        <p className="text-gray-300 text-xs">Real-time risk assessment and scoring</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analysis Features
                </h4>
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg border border-blue-700/30 hover:border-blue-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <PieChart className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Password Analysis</h5>
                        <p className="text-gray-300 text-xs">Password strength distribution analysis</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg border border-blue-700/30 hover:border-blue-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Risk Calculation</h5>
                        <p className="text-gray-300 text-xs">Risk score calculation based on exposure</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg border border-blue-700/30 hover:border-blue-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Database className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Source Tracking</h5>
                        <p className="text-gray-300 text-xs">Database source tracking and visualization</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg border border-blue-700/30 hover:border-blue-500/50 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Download className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm mb-1">Export Reports</h5>
                        <p className="text-gray-300 text-xs">Exportable reports in CSV format</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
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
                  <Shield className="w-6 h-6 text-cyan-400" />
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
                  <code className="text-lg text-blue-300 font-mono">{selectedResult.email}</code>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-500 mb-1">Password</div>
                  <code className="text-lg text-red-300 font-mono">{selectedResult.password || 'N/A'}</code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-500 mb-1">Database Source</div>
                    <div className="text-lg text-cyan-400 font-semibold">{selectedResult.database_source}</div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-sm text-gray-500 mb-1">Relevance Score</div>
                    <div className="text-lg text-green-400 font-bold">{selectedResult.score.toFixed(2)}</div>
                  </div>
                </div>

                {/* Breach Explanation */}
                {BREACH_INFO[selectedResult.database_source] && (
                  <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg p-4 border border-cyan-700/50 mt-4">
                    <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      About {BREACH_INFO[selectedResult.database_source].name}
                    </h4>
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                      {BREACH_INFO[selectedResult.database_source].whatHappened}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-xs text-gray-400">Breach Date</div>
                        <div className="text-sm font-semibold text-white">{BREACH_INFO[selectedResult.database_source].date}</div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-xs text-gray-400">Affected Accounts</div>
                        <div className="text-sm font-semibold text-white">{BREACH_INFO[selectedResult.database_source].affectedAccounts}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="font-semibold">Data Compromised:</span> {BREACH_INFO[selectedResult.database_source].dataCompromised.join(', ')}
                    </div>
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
                    navigator.clipboard.writeText(`${selectedResult.email}:${selectedResult.password}`);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
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

export default DomainMonitoringPage;
