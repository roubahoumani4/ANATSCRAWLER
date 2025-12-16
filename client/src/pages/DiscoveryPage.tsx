import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Eye, AlertTriangle } from "lucide-react";
import ResultsTable from "@/components/dashboard/ResultsTable";

const DiscoveryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState("");

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
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No results found for your search query.</p>
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
            className="mt-6 bg-gray-850 rounded-lg p-8 border border-gray-800 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Search Guidelines</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Enter email addresses, usernames, phone numbers, or other identifiers</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>For domain-wide searches (e.g., @company.com), use the Domain Monitoring page</span>
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
