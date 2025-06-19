import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id?: string;
  matchedTerms: string[];
  score: number;
  index: string;
  context: string;
  highlights: string[];
  source: string;
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

  return (
    <motion.section 
      className="results-section flex justify-center w-full mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="w-full max-w-6xl">
        <div className="results-container max-h-[400px] overflow-auto border border-coolWhite rounded-md">
          <motion.table 
            className="results-table w-full border-collapse bg-jetBlack text-coolWhite"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <thead>
              <tr>
                <th className="p-3 border border-coolWhite bg-darkGray sticky top-0 z-10 text-left">#</th>
                <th className="p-3 border border-coolWhite bg-darkGray sticky top-0 z-10 text-left">Index</th>
                <th className="p-3 border border-coolWhite bg-darkGray sticky top-0 z-10 text-left">Score</th>
                <th className="p-3 border border-coolWhite bg-darkGray sticky top-0 z-10 text-left">Matched Terms</th>
                <th className="p-3 border border-coolWhite bg-darkGray sticky top-0 z-10 text-left">Content</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.tr 
                    key={result.id || index}
                    className="hover:bg-crimsonRed hover:text-coolWhite transition-colors duration-200"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    layoutId={`result-${result.id || index}`}
                  >
                    <td className="p-3 border border-coolWhite">{index + 1}</td>
                    <td className="p-3 border border-coolWhite">{result.index}</td>
                    <td className="p-3 border border-coolWhite">{result.score.toFixed(2)}</td>
                    <td className="p-3 border border-coolWhite">
                      <div className="flex flex-wrap gap-1">
                        {result.matchedTerms.map((term, i) => (
                          <span key={i} className="bg-crimsonRed/20 px-2 py-1 rounded text-xs">
                            {term}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border border-coolWhite">
                      <div className="space-y-2">
                        {result.highlights?.length > 0 ? (
                          result.highlights.map((highlight, i) => (
                            <div key={i} className="text-sm" dangerouslySetInnerHTML={{ 
                              __html: highlight 
                            }} />
                          ))
                        ) : (
                          <div className="text-sm">{result.context}</div>
                        )}
                      </div>
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
