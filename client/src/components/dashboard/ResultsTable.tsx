import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface SearchResult {
  id?: string;
  matchedTerms: string[];
  score: number;
  index: string;
  context: string;
  highlights: string[];
  source: string;
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

const ResultsTable = ({ results, onExport, isExported }: ResultsTableProps) => {
  const { translate } = useLanguage();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
                          <div className="text-xs text-gray-400 max-w-xs truncate" title={result.source}>
                            {result.source?.split('/').pop() || result.index}
                          </div>
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
            className="bg-coolWhite text-jetBlack border border-coolWhite py-2 px-5 rounded-md font-bold hover:bg-crimsonRed hover:text-coolWhite transition-colors"
            onClick={onExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {translate("dashboard.exportExcel")}
          </motion.button>
          {isExported && (
            <motion.a
              href="/api/download-excel"
              className="bg-crimsonRed text-coolWhite border border-crimsonRed py-2 px-5 rounded-md font-bold hover:bg-opacity-90 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {translate("dashboard.downloadExcel")}
            </motion.a>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default ResultsTable;
