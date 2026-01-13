import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Copy, Eye, EyeOff, AlertTriangle, Calendar, Database, Users } from "lucide-react";
import { useState, useMemo } from "react";

interface SearchResult {
  id?: string;
  matchedTerms: string[];
  score: number;
  index: string;
  context: string;
  highlights: string[];
  source: string;
  database_source?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  link?: string;
  email?: string;
  password?: string;
  content?: string;
}

interface ResultsTableProps {
  results: SearchResult[];
  onExport: () => void;
  isExported: boolean;
}

// Database breach information
const BREACH_INFO: Record<string, {
  name: string;
  description: string;
  affectedAccounts: string;
  breachOccurred: string;
  compromisedData: string[];
  whatHappened: string;
  potentialThreats: string[];
}> = {
  'CompilationOfManyBreaches': {
    name: 'Compilation of Many Breaches (COMB)',
    description: 'A massive compilation of credentials from multiple historical data breaches',
    affectedAccounts: '3.2 billion',
    breachOccurred: 'February 2021',
    compromisedData: ['Email addresses', 'Passwords'],
    whatHappened: 'On February 2, 2021, a user known as Singularity0x01 posted a .ZIP file on RaidForums containing billions of usernames and passwords. The data contained more than 3.2 billion unique pairs of email addresses and passwords, including approximately 200 million Gmail addresses and 450 million Yahoo! email addresses. This is a compilation of credentials from past data breaches involving Netflix, LinkedIn, Hotmail, Yahoo, Bitcoin and other companies. The leak is more than twice as large as a similar breach compilation posted in 2017.',
    potentialThreats: [
      'Credential stuffing attacks - automated login attempts across multiple websites',
      'Account takeover on banking websites and major platforms',
      'Spear-phishing campaigns targeting affected users',
      'Password reuse exploitation (70% of global internet users potentially affected)'
    ]
  },
  'Collection1': {
    name: 'Collection #1',
    description: 'The 773 Million Record "Collection #1" data set that circulated in early 2019',
    affectedAccounts: '772.9 million',
    breachOccurred: 'January 2019',
    compromisedData: ['Email addresses', 'Passwords'],
    whatHappened: 'In January 2019, a large collection of credential stuffing lists (combinations of email addresses and passwords used to hijack accounts on other services) was discovered being distributed on a popular hacking forum. The data contained almost 2.7 billion records including 773 million unique email addresses alongside passwords those addresses had used on other breached services. Full details on the incident and how to search the breached passwords are provided in the blog post The 773 Million Record "Collection #1" Data Breach.',
    potentialThreats: [
      'Credential stuffing attacks',
      'Targeted phishing using exposed emails',
      'Account takeover via password reuse'
    ]
  },
  'naz.api': {
    name: 'Naz.API',
    description: 'Stealer logs and credential stuffing lists from various sources',
    affectedAccounts: '70.8 million',
    breachOccurred: 'September 2023',
    compromisedData: ['Email addresses', 'Passwords'],
    whatHappened: 'In September 2023, over 100GB of stealer logs and credential stuffing lists titled "Naz.API" was posted to a popular hacking forum. The data contained a combination of email address and plain text password pairs alongside the service they were entered into, and standalone credential pairs obtained from unnamed sources. In total, the corpus of data included 71M unique email addresses and 100M unique passwords.',
    potentialThreats: [
      'Account takeover on multiple platforms',
      'Credential stuffing attacks',
      'Identity theft attempts',
      'Targeted phishing campaigns'
    ]
  }
};

// Map db source variants to canonical breach info keys
const getBreachKey = (dbSource?: string) => {
  if (!dbSource) return dbSource;
  const normalized = dbSource.toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalized.match(/^collection\s*#?\s*1$/) || normalized === 'collection1' || normalized.includes('collection 1') || normalized.includes('collection #1')) {
    return 'Collection1';
  }
  if (normalized.includes('compilation') || normalized.includes('comb')) {
    return 'CompilationOfManyBreaches';
  }
  return dbSource;
};

const ResultsTable = ({ results, onExport, isExported }: ResultsTableProps) => {
  const { translate } = useLanguage();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Detect which databases are present in results
  const presentDatabases = useMemo(() => {
    const databases = new Set<string>();
    results.forEach(result => {
      if (result.database_source && result.database_source !== 'Unknown') {
        databases.add(getBreachKey(result.database_source));
      }
    });
    return Array.from(databases).filter(Boolean);
  }, [results]);

  const exportToCSV = () => {
    // Create CSV header
    const headers = ['#', 'Score', 'Email/Username', 'Password', 'Database Source', 'Full Details', 'Matched Content'];
    
    // Create CSV rows
    const rows = results.map((result, index) => {
      const email = result.email || result.name || '-';
      const password = result.password || '-';
      const score = result.score?.toFixed(2) || '-';
      const databaseSource = result.database_source || 'Unknown';
      
      // Get Full Details (context)
      let fullDetails = '-';
      try {
        const parsed = JSON.parse(result.context || '{}');
        fullDetails = Object.entries(parsed).map(([key, value]) => String(value)).join(':');
      } catch {
        fullDetails = result.context || result.content || '-';
      }
      
      // Get Matched Content (highlights)
      const matchedContent = result.highlights && result.highlights.length > 0 
        ? result.highlights.join(' | ') 
        : '-';
      
      // Escape values that contain commas or quotes
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      
      return [
        index + 1,
        score,
        escapeCSV(email),
        escapeCSV(password),
        escapeCSV(databaseSource),
        escapeCSV(fullDetails),
        escapeCSV(matchedContent)
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reconnaissance_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Parse context to extract key-value pairs
  const parseContext = (context: string) => {
    try {
      const parsed = JSON.parse(context);
      return parsed;
    } catch {
      return null;
    }
  };

  // Extract email and password from context
  const extractCredentials = (result: SearchResult) => {
    let email = '';
    let password = '';
    
    // First, try to parse from context if it's JSON
    if (result.context) {
      const parsed = parseContext(result.context);
      if (parsed) {
        // Prioritize 'email' field for Email/Username column
        email = parsed.email || parsed.username || '';
        // Prioritize 'hash' field, then 'password' for Password column
        password = parsed.hash || parsed.password || '';
      }
    }
    
    // If still empty, fall back to result fields (but avoid stringified JSON)
    if (!email) {
      // Check if result.email or result.name look like JSON strings
      const emailCandidate = result.email || result.name || '';
      if (emailCandidate && !emailCandidate.startsWith('{') && !emailCandidate.startsWith('[')) {
        email = emailCandidate;
      }
    }
    
    if (!password) {
      const passwordCandidate = result.password || '';
      if (passwordCandidate && !passwordCandidate.startsWith('{') && !passwordCandidate.startsWith('[')) {
        password = passwordCandidate;
      }
    }
    
    // Fallback to content field if available
    if (!email && result.content && !result.content.startsWith('{')) {
      email = result.content.split(':')[0] || '';
    }
    if (!password && result.content && result.content.includes(':') && !result.content.startsWith('{')) {
      password = result.content.split(':')[1] || '';
    }
    
    return { email, password };
  };

  return (
    <motion.section 
      className="results-section flex justify-center w-full mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="w-full max-w-7xl">
        <div className="results-container max-h-[600px] overflow-auto border border-coolWhite rounded-lg shadow-2xl bg-gradient-to-br from-[#181c24] to-[#23272f]">
          <motion.table 
            className="results-table w-full border-collapse text-coolWhite text-sm"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <thead>
              <tr className="bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10">
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide w-12">#</th>
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide w-20">Score</th>
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide">Email/Username</th>
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide">Password</th>
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide">Source</th>
                <th className="p-3 border-b border-coolWhite text-left font-semibold tracking-wide w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.map((result, index) => {
                  const { email, password } = extractCredentials(result);
                  const isExpanded = expandedRows.has(index);
                  const parsed = parseContext(result.context);
                  
                  return (
                    <>
                      <motion.tr 
                        key={result.id || index}
                        className="hover:bg-crimsonRed/20 transition-colors duration-200 border-b border-coolWhite/30"
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        layoutId={`result-${result.id || index}`}
                      >
                        <td className="p-3 font-mono text-xs text-gray-400">{index + 1}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 rounded-md bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs shadow-md">
                            {result.score.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-blue-900/30 px-2 py-1 rounded text-blue-300 font-mono text-xs break-all">
                              {email || '-'}
                            </code>
                            {email && (
                              <button
                                onClick={() => copyToClipboard(email, index * 2)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Copy email"
                              >
                                {copiedIndex === index * 2 ? (
                                  <span className="text-green-400 text-xs">✓</span>
                                ) : (
                                  <Copy size={14} className="text-gray-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-red-900/30 px-2 py-1 rounded text-red-300 font-mono text-xs break-all max-w-xs overflow-hidden text-ellipsis">
                              {password || '-'}
                            </code>
                            {password && (
                              <button
                                onClick={() => copyToClipboard(password, index * 2 + 1)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Copy password"
                              >
                                {copiedIndex === index * 2 + 1 ? (
                                  <span className="text-green-400 text-xs">✓</span>
                                ) : (
                                  <Copy size={14} className="text-gray-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {result.database_source && result.database_source !== 'Unknown' ? (
                            <div className="text-sm font-semibold text-blue-400">
                              {result.database_source}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              {result.index}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleRow(index)}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 rounded text-purple-300 text-xs font-semibold transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff size={14} />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                View
                              </>
                            )}
                          </button>
                        </td>
                      </motion.tr>
                      
                      {isExpanded && (
                        <motion.tr
                          key={`${result.id || index}-expanded`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-[#1a1e26]"
                        >
                          <td colSpan={6} className="p-4 border-b border-coolWhite/30">
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-cyan-400 mb-2">Full Details</h4>
                              
                              {parsed ? (
                                <div className="bg-black/40 p-3 rounded font-mono text-xs text-gray-300 overflow-x-auto">
                                  {Object.entries(parsed).map(([key, value]) => String(value)).join(':')}
                                </div>
                              ) : (
                                <div className="bg-black/40 p-3 rounded font-mono text-xs text-gray-300 overflow-x-auto">
                                  {result.context || result.content || 'No additional data'}
                                </div>
                              )}
                              
                              {result.highlights && result.highlights.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-xs font-semibold text-yellow-400 mb-2">Matched Content</h5>
                                  <div className="space-y-1">
                                    {result.highlights.map((highlight, i) => (
                                      <div 
                                        key={i} 
                                        className="bg-yellow-900/20 border border-yellow-600/30 p-2 rounded text-xs"
                                        dangerouslySetInnerHTML={{ __html: highlight }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
        <div className="export-buttons flex gap-3 justify-center mt-4">
          <motion.button 
            className="bg-crimsonRed text-coolWhite border border-crimsonRed py-2 px-5 rounded-md font-bold hover:bg-opacity-90 transition-colors"
            onClick={exportToCSV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Export to CSV
          </motion.button>
        </div>

        {/* Breach Overview Section */}
        {presentDatabases.length > 0 && (
          <div className="mt-6 space-y-4">
            {presentDatabases.map((dbSource) => {
              const key = getBreachKey(dbSource);
              const breachInfo = BREACH_INFO[key];
              if (!breachInfo) return null;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-[#1a1e26] to-[#23272f] rounded-lg border border-red-900/30 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 p-4 border-b border-red-900/50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <h3 className="text-xl font-bold text-red-400">{breachInfo.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{breachInfo.description}</p>
                  </div>

                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-6 p-6">
                    {/* Left Column - What Happened */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Database className="w-5 h-5 text-cyan-400" />
                          What Happened
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {breachInfo.whatHappened}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Compromised Data</h4>
                        <div className="space-y-2">
                          {breachInfo.compromisedData.map((data, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-red-400">●</span>
                              <span className="text-gray-300 text-sm">{data}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Breach Overview & Threats */}
                    <div className="space-y-4">
                      <div className="bg-[#0f1218] rounded-lg p-4 border border-cyan-900/30">
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Breach Overview</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">Affected Accounts:</div>
                              <div className="text-2xl font-bold text-white">{breachInfo.affectedAccounts}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500">Breach Occurred:</div>
                              <div className="text-lg font-semibold text-white">{breachInfo.breachOccurred}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          Recommended Actions
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
                            <div className="flex items-start gap-2">
                              <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-blue-300">Change Your Password</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  If you haven't already changed the password affected by this breach, do so immediately on every account where it was used.
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-purple-900/20 border-l-4 border-purple-500 p-3 rounded">
                            <div className="flex items-start gap-2">
                              <div className="bg-purple-500 rounded-full p-1 mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-purple-300">Enable Two-Factor Authentication</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Wherever 2FA is supported, add an extra layer of security to your account.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default ResultsTable;
