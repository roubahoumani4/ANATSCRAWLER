import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Filter, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { containerVariants, itemVariants } from "@/utils/animations";

interface SearchResult {
  id: number;
  collection: string;
  folder: string;
  fileName: string;
  content: string;
}

const SearchInterface = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [isExported, setIsExported] = useState(false);

  // Using the same IP addresses and connections as the original
  const { data: results = [], isLoading, isError, error } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const response = await apiRequest("GET", `/api/search?query=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  const collectionsSet = new Set<string>();
  results.forEach((result: SearchResult) => {
    if (result.collection) collectionsSet.add(result.collection);
  });
  const availableCollections = Array.from(collectionsSet);

  const filteredResults = results.filter((result: SearchResult) => {
    // Filter by selected collections
    if (selectedCollections.length > 0 && !selectedCollections.includes(result.collection)) {
      return false;
    }
    return true;
  });

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

  const toggleCollection = (collection: string) => {
    setSelectedCollections(prev => 
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
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
          {language === "French" ? "Recherche de données" : 
           language === "Spanish" ? "Búsqueda de datos" : 
           "Data Search"}
        </h1>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "French" ? "Rechercher des identifiants..." : 
                language === "Spanish" ? "Buscar credenciales..." : 
                "Search for credentials..."
              }
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
                {language === "French" ? "Filtres" : 
                 language === "Spanish" ? "Filtros" : 
                 "Filters"}
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
                  {language === "French" ? "Recherche..." : 
                   language === "Spanish" ? "Buscando..." : 
                   "Searching..."}
                </span>
              ) : (
                <span>
                  {language === "French" ? "Rechercher" : 
                   language === "Spanish" ? "Buscar" : 
                   "Search"}
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
              <div className="border-t border-gray-700 pt-4 pb-2">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  {language === "French" ? "Collections" : 
                   language === "Spanish" ? "Colecciones" : 
                   "Collections"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableCollections.map(collection => (
                    <div
                      key={collection}
                      onClick={() => toggleCollection(collection)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer ${
                        selectedCollections.includes(collection)
                          ? 'bg-crimsonRed text-coolWhite'
                          : 'bg-midGray text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {collection}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 pb-2 mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  {language === "French" ? "Période de temps" : 
                   language === "Spanish" ? "Rango de fechas" : 
                   "Date Range"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {language === "French" ? "De" : 
                       language === "Spanish" ? "Desde" : 
                       "From"}
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
                      {language === "French" ? "À" : 
                       language === "Spanish" ? "Hasta" : 
                       "To"}
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
                    setSelectedCollections([]);
                    setDateRange({ from: "", to: "" });
                  }}
                  className="text-sm text-gray-400 hover:text-coolWhite mr-4"
                >
                  {language === "French" ? "Réinitialiser" : 
                   language === "Spanish" ? "Restablecer" : 
                   "Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="text-sm text-crimsonRed hover:text-red-400"
                >
                  {language === "French" ? "Appliquer" : 
                   language === "Spanish" ? "Aplicar" : 
                   "Apply"}
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
            {language === "French" ? "Erreur de recherche" : 
             language === "Spanish" ? "Error de búsqueda" : 
             "Search Error"}
          </h3>
          <p className="text-gray-300">
            {(error as Error)?.message || 
              (language === "French" ? "Une erreur s'est produite lors de la recherche. Veuillez réessayer." : 
               language === "Spanish" ? "Ocurrió un error durante la búsqueda. Por favor, inténtelo de nuevo." : 
               "An error occurred while searching. Please try again.")}
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
              {language === "French" ? "Résultats" : 
               language === "Spanish" ? "Resultados" : 
               "Results"} 
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
                    ? (language === "French" ? "Exporté" : 
                       language === "Spanish" ? "Exportado" : 
                       "Exported")
                    : (language === "French" ? "Exporter" : 
                       language === "Spanish" ? "Exportar" : 
                       "Export")}
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
                {language === "French" ? "Aucun résultat trouvé" : 
                 language === "Spanish" ? "No se encontraron resultados" : 
                 "No results found"}
              </h3>
              <p className="text-gray-400">
                {language === "French" ? "Essayez d'autres termes de recherche ou de modifier vos filtres." : 
                 language === "Spanish" ? "Intente con otros términos de búsqueda o modifique sus filtros." : 
                 "Try different search terms or modify your filters."}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {result.title || result.fileName || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">
                      Score: {result.score}
                    </span>
                  </div>

                  {result.structuredInfo ? (
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {result.structuredInfo.name && (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-medium">Name:</span>
                            <span className="text-white">{result.structuredInfo.name}</span>
                          </div>
                        )}
                        {result.structuredInfo.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-medium">Phone:</span>
                            <span className="text-white">{result.structuredInfo.phone}</span>
                          </div>
                        )}
                        {result.structuredInfo.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-medium">Location:</span>
                            <span className="text-white">{result.structuredInfo.location}</span>
                          </div>
                        )}
                        {result.structuredInfo.additionalLocation && result.structuredInfo.additionalLocation !== result.structuredInfo.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-medium">Additional:</span>
                            <span className="text-white">{result.structuredInfo.additionalLocation}</span>
                          </div>
                        )}
                        {result.structuredInfo.gender && (
                          <div className="flex items-center gap-2">
                            <span className="text-orange-400 font-medium">Gender:</span>
                            <span className="text-white">{result.structuredInfo.gender}</span>
                          </div>
                        )}
                        {result.structuredInfo.locale && (
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-medium">Locale:</span>
                            <span className="text-white">{result.structuredInfo.locale}</span>
                          </div>
                        )}
                        {result.structuredInfo.id && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-medium">ID:</span>
                            <span className="text-white">{result.structuredInfo.id}</span>
                          </div>
                        )}
                      </div>

                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                          View raw data
                        </summary>
                        <p className="text-xs text-gray-500 mt-1 p-2 bg-gray-900 rounded border-l-2 border-gray-600 overflow-x-auto">
                          {result.rawContent}
                        </p>
                      </details>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 mb-2 line-clamp-3">
                      {result.content}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>Collection: {result.collection}</span>
                    <span>•</span>
                    <span>Folder: {result.folder}</span>
                    <span>•</span>
                    <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                  </div>
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