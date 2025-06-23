import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Filter, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { containerVariants, itemVariants } from "@/utils/animations";

interface SearchResult {
  id: string;
  content?: string;
  score?: number;
  file_name?: string;
  file_path?: string;
  file_type?: string;
  files_id?: string;
  n?: number;
  context?: string;
  highlights?: string[];
  matchedTerms?: string[];
  index?: string;
}

// Translation object for all UI strings
const translations = {
  searchData: {
    English: "Data Search",
    French: "Recherche de données",
    Spanish: "Búsqueda de datos"
  },
  searchPlaceholder: {
    English: "Search for credentials...",
    French: "Rechercher des identifiants...",
    Spanish: "Buscar credenciales..."
  },
  filters: {
    English: "Filters",
    French: "Filtres",
    Spanish: "Filtros"
  },
  searching: {
    English: "Searching...",
    French: "Recherche...",
    Spanish: "Buscando..."
  },
  search: {
    English: "Search",
    French: "Rechercher",
    Spanish: "Buscar"
  },
  collections: {
    English: "Collections",
    French: "Collections",
    Spanish: "Colecciones"
  },
  timePeriod: {
    English: "Time Period",
    French: "Période de temps",
    Spanish: "Rango de fechas"
  },
  from: {
    English: "From",
    French: "De",
    Spanish: "Desde"
  },
  to: {
    English: "To",
    French: "À",
    Spanish: "Hasta"
  },
  reset: {
    English: "Reset",
    French: "Réinitialiser",
    Spanish: "Restablecer"
  },
  apply: {
    English: "Apply",
    French: "Appliquer",
    Spanish: "Aplicar"
  },
  searchError: {
    English: "Search Error",
    French: "Erreur de recherche",
    Spanish: "Error de búsqueda"
  },
  searchErrorMsg: {
    English: "An error occurred while searching. Please try again.",
    French: "Une erreur s'est produite lors de la recherche. Veuillez réessayer.",
    Spanish: "Ocurrió un error durante la búsqueda. Por favor, inténtelo de nuevo."
  },
  results: {
    English: "Results",
    French: "Résultats",
    Spanish: "Resultados"
  },
  exported: {
    English: "Exported",
    French: "Exporté",
    Spanish: "Exportado"
  },
  export: {
    English: "Export",
    French: "Exporter",
    Spanish: "Exportar"
  },
  noResults: {
    English: "No results found",
    French: "Aucun résultat trouvé",
    Spanish: "No se encontraron resultados"
  },
  noResultsMsg: {
    English: "Try different search terms or modify your filters.",
    French: "Essayez d'autres termes de recherche ou de modifier vos filtres.",
    Spanish: "Intente con otros términos de búsqueda o modifique sus filtros."
  }
};

const SearchInterface = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [isExported, setIsExported] = useState(false);

  const { data: results = [], isLoading, isError, error } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const response = await apiRequest("GET", `/api/search?query=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  const filteredResults = results; // No collection filtering

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query is already triggered by the useQuery hook
  };

  const handleExport = async () => {
    try {
      await apiRequest("POST", "/api/export", { results: filteredResults });
      setIsExported(true);

      // Download the Excel file
      window.location.href = "/api/download-excel";
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  return (
    <div className="w-full mb-12">
      <motion.div 
        className="bg-darkGray rounded-lg p-6 shadow-lg mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold mb-6 text-coolWhite">
          {translations.searchData[language as keyof typeof translations.searchData]}
        </h1>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translations.searchPlaceholder[language as keyof typeof translations.searchPlaceholder]}
              className="w-full py-3 pl-12 pr-4 text-coolWhite bg-midGray border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-crimsonRed"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center text-gray-400 hover:text-coolWhite transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {translations.filters[language as keyof typeof translations.filters]}
              </span>
              {isFiltersOpen ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>

            <button
              type="submit"
              disabled={!searchQuery.trim() || isLoading}
              className="bg-crimsonRed text-coolWhite py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {translations.searching[language as keyof typeof translations.searching]}
                </span>
              ) : (
                <span>
                  {translations.search[language as keyof typeof translations.search]}
                </span>
              )}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-700 pt-4 pb-2 mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  {translations.timePeriod[language as keyof typeof translations.timePeriod]}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {translations.from[language as keyof typeof translations.from]}
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="w-full py-2 px-3 text-sm text-coolWhite bg-midGray border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-crimsonRed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {translations.to[language as keyof typeof translations.to]}
                    </label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="w-full py-2 px-3 text-sm text-coolWhite bg-midGray border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-crimsonRed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({ from: "", to: "" });
                  }}
                  className="text-sm text-gray-400 hover:text-coolWhite mr-4"
                >
                  {translations.reset[language as keyof typeof translations.reset]}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="text-sm text-crimsonRed hover:text-red-400"
                >
                  {translations.apply[language as keyof typeof translations.apply]}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isError && (
        <motion.div 
          className="bg-red-900/30 border border-red-700 text-coolWhite p-4 rounded-lg mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-medium mb-1">
            {translations.searchError[language as keyof typeof translations.searchError]}
          </h3>
          <p className="text-gray-300">
            {(error as Error)?.message || 
              translations.searchErrorMsg[language as keyof typeof translations.searchErrorMsg]}
          </p>
        </motion.div>
      )}

      {searchQuery && !isLoading && !isError && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-coolWhite">
              {translations.results[language as keyof typeof translations.results]} 
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({filteredResults.length})
              </span>
            </h2>

            {filteredResults.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center bg-darkGray hover:bg-midGray text-coolWhite py-2 px-4 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>
                  {isExported 
                    ? translations.exported[language as keyof typeof translations.exported]
                    : translations.export[language as keyof typeof translations.export]}
                </span>
              </button>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <motion.div 
              className="bg-darkGray rounded-lg p-8 text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midGray mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-coolWhite mb-2">
                {translations.noResults[language as keyof typeof translations.noResults]}
              </h3>
              <p className="text-gray-400">
                {translations.noResultsMsg[language as keyof typeof translations.noResultsMsg]}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((result: SearchResult, index: number) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {result.file_name || result.id || 'Unknown'}
                    </h3>
                    {result.score !== undefined && (
                      <span className="text-xs text-gray-400 ml-2">
                        Score: {result.score}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm mb-2">
                    {result.content || result.context || 'No content'}
                  </div>
                  {result.highlights && result.highlights.length > 0 && (
                    <div className="text-blue-300 text-xs mb-2">
                      Highlights: {result.highlights.join(' ... ')}
                    </div>
                  )}
                  {result.file_path && (
                    <div className="text-xs text-gray-500">Path: {result.file_path}</div>
                  )}
                  {result.file_type && (
                    <div className="text-xs text-gray-500">Type: {result.file_type}</div>
                  )}
                  {result.matchedTerms && result.matchedTerms.length > 0 && (
                    <div className="text-xs text-cyan-400">Matched: {result.matchedTerms.join(', ')}</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SearchInterface;