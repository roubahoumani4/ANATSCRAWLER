import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
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
}

interface ResultsTableProps {
  results: SearchResult[];
  onExport: () => void;
  isExported: boolean;
}

const ResultsTable = ({ results, onExport, isExported }: ResultsTableProps) => {
  const { translate } = useLanguage();

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

  // Helper function to clean and format highlights
  const formatHighlight = (highlight: string) => {
    return highlight.replace(/<\/?mark>/g, '');
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // optionally show a toast
    } catch (e) {
      console.error('copy failed', e);
    }
  };

  const renderContextContent = (result: SearchResult) => {
    const ctx = result.context;
    const highlights = result.highlights || [];

    // If highlights exist, prefer showing them
    if (highlights.length > 0) {
      return (
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="text-xs md:text-sm bg-coolWhite/6 rounded p-2 break-words" dangerouslySetInnerHTML={{ __html: h }} />
          ))}
        </div>
      );
    }

    // Try parse JSON-like content
    try {
      const parsed = typeof ctx === 'string' ? JSON.parse(ctx) : ctx;

      // If parsed is an array of objects (common for files_index content)
      if (Array.isArray(parsed)) {
        return (
          <div className="space-y-2">
            {parsed.slice(0, 6).map((entry: any, idx: number) => (
              <div key={idx} className="p-2 bg-coolWhite/6 rounded break-words">
                {typeof entry === 'object' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                    {Object.entries(entry).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="font-mono text-xxs text-cyan-200">{k}:</span>
                        <span className="break-all">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">{String(entry)}</div>
                )}
              </div>
            ))}
            {parsed.length > 6 && (
              <div className="text-xs text-gray-400">+{parsed.length - 6} more entries</div>
            )}
          </div>
        );
      }

      // If parsed is an object, render key/value pairs nicely
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <div className="p-2 bg-coolWhite/6 rounded break-words text-xs md:text-sm">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(parsed).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <span className="font-mono text-xxs text-cyan-200 w-28">{k}:</span>
                  <span className="break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } catch (e) {
      // Not JSON
    }

    // Fallback: show text with truncation and toggle
    const short = String(ctx || result.highlights?.[0] || '-');
    const id = result.id || String(Math.random());
    const isExp = !!expanded[id];
    const truncated = short.length > 240 ? `${short.slice(0, 240)}...` : short;

    return (
      <div className="space-y-2">
        <div className="text-xs md:text-sm bg-coolWhite/6 rounded p-2 break-words">{isExp ? short : truncated}</div>
        {short.length > 240 && (
          <div className="flex gap-2">
            <button onClick={() => toggleExpand(id)} className="text-xs text-blue-300 underline">{isExp ? 'Show less' : 'Show more'}</button>
            <button onClick={() => copyToClipboard(short)} className="text-xs text-green-300 underline">Copy</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.section 
      className="results-section flex justify-center w-full mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="w-full max-w-6xl">
        <div className="results-container max-h-[500px] overflow-auto border border-coolWhite rounded-lg shadow-lg bg-gradient-to-br from-[#181c24] to-[#23272f]">
          <motion.table 
            className="results-table w-full border-collapse text-coolWhite text-sm md:text-base"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <thead>
              <tr>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">#</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Score</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Name</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Phone</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Location</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Link</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Matched Terms</th>
                <th className="p-3 border-b border-coolWhite bg-gradient-to-r from-[#23272f] to-[#181c24] sticky top-0 z-10 text-left font-semibold tracking-wide">Context</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.tr 
                    key={result.id || index}
                    className="hover:bg-crimsonRed/80 hover:text-coolWhite transition-colors duration-200 group"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    layoutId={`result-${result.id || index}`}
                  >
                    <td className="p-3 border-b border-coolWhite font-mono text-xs md:text-base">{index + 1}</td>
                    <td className="p-3 border-b border-coolWhite">
                      <span className="inline-block px-2 py-1 rounded bg-gradient-to-r from-green-500 to-green-700 text-black font-bold text-xs md:text-sm">
                        {result.score.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 border-b border-coolWhite font-semibold text-cyan-300 group-hover:text-white transition-colors">{result.name || [result.first_name, result.last_name].filter(Boolean).join(' ') || '-'}</td>
                    <td className="p-3 border-b border-coolWhite font-mono text-yellow-200 group-hover:text-white transition-colors">{result.phone || '-'}</td>
                    <td className="p-3 border-b border-coolWhite text-purple-200 group-hover:text-white transition-colors">{result.location || '-'}</td>
                    <td className="p-3 border-b border-coolWhite">
                      {result.link ? (
                        <a href={result.link.startsWith('http') ? result.link : `https://${result.link}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-200 break-all">
                          {result.link}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-3 border-b border-coolWhite">
                      <div className="flex flex-wrap gap-1">
                        {result.matchedTerms.map((term, i) => (
                          <span key={i} className="bg-crimsonRed/40 px-2 py-1 rounded text-xs font-mono text-white">
                            {term}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border-b border-coolWhite align-top">
                      {renderContextContent(result)}
                    </td>
                  </motion.tr>
                ))}
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
