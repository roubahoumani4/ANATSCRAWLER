import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  Shield,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";

interface SearchHistoryItem {
  _id: string;
  searchType: 'discovery' | 'domain-monitoring';
  query: string;
  queryType?: string;
  resultsCount: number;
  hasResults: boolean;
  status: 'success' | 'failed' | 'no-results';
  createdAt: string;
  metadata?: {
    searchDuration?: number;
  };
}

interface HistoryStats {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  discoverySearches: number;
  domainSearches: number;
  successRate: string;
  recentSearches: SearchHistoryItem[];
  searchesByDay: Array<{
    _id: string;
    count: number;
    withResults: number;
  }>;
}

const SearchHistoryPage: React.FC = () => {
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'discovery' | 'domain-monitoring'>('all');
  const [filterResults, setFilterResults] = useState<'all' | 'with-results' | 'no-results'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (filterType !== 'all') {
        params.searchType = filterType;
      }

      if (filterResults === 'with-results') {
        params.hasResults = 'true';
      } else if (filterResults === 'no-results') {
        params.hasResults = 'false';
      }

      const [historyRes, statsRes] = await Promise.all([
        axios.get('/api/v1/history/searches', { params }),
        axios.get('/api/v1/history/stats')
      ]);

      setSearches(historyRes.data.data.searches);
      setTotalPages(historyRes.data.data.pagination.pages);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSearchDetails = async (searchId: string) => {
    try {
      const response = await axios.get(`/api/v1/history/searches/${searchId}`);
      setSelectedSearch(response.data.data);
    } catch (error) {
      console.error('Error fetching search details:', error);
    }
  };

  const deleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this search from history?')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/history/searches/${searchId}`);
      fetchHistory();
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire search history? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete('/api/v1/history/searches');
      fetchHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, filterType, filterResults]);

  const getSearchTypeIcon = (type: string) => {
    return type === 'discovery' ? <Shield className="w-4 h-4" /> : <Globe className="w-4 h-4" />;
  };

  const getSearchTypeColor = (type: string) => {
    return type === 'discovery' ? 'text-red-400' : 'text-cyan-400';
  };

  const getStatusBadge = (item: SearchHistoryItem) => {
    if (item.hasResults) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          {item.resultsCount} Results
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          No Results
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 rounded bg-purple-700/10 text-purple-400">
            <HistoryIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Search History</h1>
            <p className="text-sm text-gray-400">
              View and manage your Discovery and Domain Monitoring search history
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-850 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <Search className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{stats.totalSearches}</h3>
            <p className="text-xs text-gray-400">Total Searches</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-850 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{stats.successfulSearches}</h3>
            <p className="text-xs text-gray-400">With Results</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-850 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{stats.discoverySearches}</h3>
            <p className="text-xs text-gray-400">Discovery</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-850 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <Globe className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{stats.domainSearches}</h3>
            <p className="text-xs text-gray-400">Domain Monitoring</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-850 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{stats.successRate}%</h3>
            <p className="text-xs text-gray-400">Success Rate</p>
          </motion.div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" className="bg-gray-900 text-white">All Types</option>
              <option value="discovery" className="bg-gray-900 text-white">Discovery Only</option>
              <option value="domain-monitoring" className="bg-gray-900 text-white">Domain Monitoring Only</option>
            </select>
          </div>

          <select
            value={filterResults}
            onChange={(e) => setFilterResults(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all" className="bg-gray-900 text-white">All Results</option>
            <option value="with-results" className="bg-gray-900 text-white">With Results</option>
            <option value="no-results" className="bg-gray-900 text-white">No Results</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30 transition-all text-sm"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Clear History
          </button>
        </div>
      </div>

      {/* History Table */}
      <Card className="bg-gray-850 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Search History</CardTitle>
          <CardDescription>Your recent Discovery and Domain Monitoring searches</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {searches.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Search History</h3>
                <p className="text-sm text-gray-500">
                  Your search history will appear here once you start using Discovery or Domain Monitoring.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searches.map((search) => (
                  <motion.div
                    key={search._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={getSearchTypeColor(search.searchType)}>
                            {getSearchTypeIcon(search.searchType)}
                          </div>
                          <span className="text-sm text-gray-400 capitalize">
                            {search.searchType.replace('-', ' ')}
                          </span>
                          {getStatusBadge(search)}
                        </div>
                        <p className="text-white font-mono text-sm mb-2">{search.query}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(search.createdAt)}
                          </span>
                          {search.metadata?.searchDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(search.metadata.searchDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewSearchDetails(search._id)}
                          className="p-2 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSearch(search._id)}
                          className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-white px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Details Modal */}
      {selectedSearch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Search Details</h2>
              <button
                onClick={() => setSelectedSearch(null)}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Query</p>
                <p className="text-white font-mono">{selectedSearch.query}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Type</p>
                <p className="text-white capitalize">{selectedSearch.searchType.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Results</p>
                <p className="text-white">{selectedSearch.resultsCount} found</p>
              </div>
              
              {/* Display credential details for Discovery searches */}
              {selectedSearch.results && selectedSearch.results.length > 0 && selectedSearch.searchType === 'discovery' && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Credential Details (First {selectedSearch.results.length} results)</p>
                  <div className="space-y-3">
                    {selectedSearch.results.map((result: any, index: number) => (
                      <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Email Address</p>
                            <p className="text-cyan-400 font-mono text-sm break-all">{result.email || result.name || result.username || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Password</p>
                            <p className="text-red-400 font-mono text-sm">{result.password || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Database Source</p>
                            <p className="text-purple-400 text-sm">{result.database_source || result.index || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Relevance Score</p>
                            <p className="text-green-400 text-sm">{result.score?.toFixed(2) || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Display credential details for Domain Monitoring searches */}
              {selectedSearch.results && selectedSearch.results.length > 0 && selectedSearch.searchType === 'domain-monitoring' && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Domain Exposure Details (First {Math.min(10, selectedSearch.results.length)} of {selectedSearch.resultsCount} results)</p>
                  <div className="space-y-3">
                    {selectedSearch.results.slice(0, 10).map((result: any, index: number) => (
                      <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Email Address</p>
                            <p className="text-cyan-400 font-mono text-sm break-all">{result.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Password</p>
                            <p className="text-red-400 font-mono text-sm">{result.password || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Database Source</p>
                            <p className="text-purple-400 text-sm">{result.database_source || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Relevance Score</p>
                            <p className="text-green-400 text-sm">{result.score?.toFixed(2) || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedSearch.resultsCount > 10 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-400">
                          Showing 10 of {selectedSearch.resultsCount} results
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SearchHistoryPage;
