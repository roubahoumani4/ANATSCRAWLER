import { useState, useMemo } from "react";
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
  EyeOff
} from "lucide-react";
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  const [searchDomain, setSearchDomain] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());

  // Mock data for demonstration - replace with actual API call
  const performDomainSearch = async (domain: string) => {
    setIsSearching(true);
    setShowResults(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock results - in production, call your actual search API
    const mockResults: DomainResult[] = [
      { email: `user1@${domain}`, password: "password123", database_source: "naz.api", score: 95.5 },
      { email: `admin@${domain}`, password: "Admin@2023", database_source: "CompilationOfManyBreaches", score: 88.2 },
      { email: `support@${domain}`, password: "Welcome1", database_source: "naz.api", score: 92.1 },
      { email: `sales@${domain}`, password: "Sales$ecure2024", database_source: "CompilationOfManyBreaches", score: 85.7 },
      { email: `info@${domain}`, password: "12345678", database_source: "naz.api", score: 98.3 },
    ];

    const databases: { [key: string]: number } = {};
    let weak = 0, medium = 0, strong = 0;

    mockResults.forEach(result => {
      databases[result.database_source] = (databases[result.database_source] || 0) + 1;
      
      // Simple password strength analysis
      const pwd = result.password;
      if (pwd.length < 8 || pwd.match(/^[0-9]+$/) || pwd.toLowerCase() === pwd) {
        weak++;
      } else if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
        strong++;
      } else {
        medium++;
      }
    });

    const riskScore = Math.min(100, (mockResults.length * 15) + (weak * 5));

    setDomainStats({
      domain,
      totalExposed: mockResults.length,
      databases,
      results: mockResults,
      riskScore,
      passwordStrength: { weak, medium, strong }
    });

    setIsSearching(false);
    setShowResults(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDomain.trim()) {
      performDomainSearch(searchDomain.trim());
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-4"
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Domain Monitoring</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Monitor and analyze domain exposure across dark web breach databases
          </motion.p>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gray-850 rounded-lg p-6 border border-gray-700 shadow-2xl mb-8"
        >
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                placeholder="Enter domain (e.g., company.com)"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
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

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 border-b border-gray-700">
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

              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg p-6"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-yellow-400 mb-2">Security Recommendations</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>Immediately reset passwords for all exposed accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>Enable multi-factor authentication (MFA) across all company email accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>Implement password complexity requirements and regular rotation policies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>Monitor for suspicious login attempts and implement account lockout policies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>Conduct security awareness training for all employees</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section - When no search performed yet */}
        {!showResults && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-850 rounded-lg p-8 border border-gray-700 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-300 mb-4">About Domain Monitoring</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  What We Monitor
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>All email addresses associated with your domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Key className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Exposed passwords and credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Multiple dark web breach databases (COMB, Naz.API, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Real-time risk assessment and scoring</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analysis Features
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <PieChart className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Password strength distribution analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Risk score calculation based on exposure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Database source tracking and visualization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Exportable reports in CSV format</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DomainMonitoringPage;
