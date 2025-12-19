import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faCode,
  faHistory,
  faSave,
  faFileExport,
  faPlay,
  faDatabase,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faTrash,
  faClock,
  faChartLine,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/hooks/use-toast";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";

interface SearchResult {
  _id: string;
  _index: string;
  _source: any;
  _score?: number;
}

interface QueryHistoryItem {
  _id: string;
  indexName: string;
  query: any;
  executionTime: number;
  resultCount: number;
  timestamp: string;
}

interface SavedQueryItem {
  _id: string;
  name: string;
  description?: string;
  indexName: string;
  query: any;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const IndexQueryPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState<"browser" | "console">("browser");
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dslQuery, setDslQuery] = useState(JSON.stringify({ query: { match_all: {} } }, null, 2));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [queryName, setQueryName] = useState("");
  const [queryDescription, setQueryDescription] = useState("");
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Fetch all indices
  const { data: indicesData } = useQuery<{ success: boolean; indices: any[] }>({
    queryKey: ["/api/v1/admin/elasticsearch/indices"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/indices`, {
        withCredentials: true,
      });
      return res.data;
    },
  });

  // Fetch index fields when index is selected
  const { data: fieldsData } = useQuery<{ success: boolean; fields: string[] }>({
    queryKey: [`/api/v1/admin/elasticsearch/query/fields/${selectedIndex}`],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/query/fields/${selectedIndex}`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: !!selectedIndex,
  });

  // Search documents mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      let query: any = { match_all: {} };

      if (searchQuery.trim()) {
        query = {
          multi_match: {
            query: searchQuery,
            fields: ["*"],
            type: "best_fields",
          },
        };
      }

      if (filterField && filterValue) {
        query = {
          bool: {
            must: [query],
            filter: [
              {
                term: {
                  [filterField]: filterValue,
                },
              },
            ],
          },
        };
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/query/search`,
        {
          indexName: selectedIndex,
          query,
          from: (currentPage - 1) * pageSize,
          size: pageSize,
          sort: [{ _score: "desc" }],
        },
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Execute DSL query mutation
  const executeDslMutation = useMutation({
    mutationFn: async () => {
      const parsedQuery = JSON.parse(dslQuery);
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/query/execute`,
        {
          indexName: selectedIndex,
          query: parsedQuery,
        },
        { withCredentials: true }
      );
      return res.data;
    },
  });

  // Fetch query history
  const { data: historyData, refetch: refetchHistory } = useQuery<{
    success: boolean;
    history: QueryHistoryItem[];
  }>({
    queryKey: ["/api/v1/admin/elasticsearch/query/history"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/query/history`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: showHistoryPanel,
  });

  // Fetch saved queries
  const { data: savedQueriesData, refetch: refetchSaved } = useQuery<{
    success: boolean;
    savedQueries: SavedQueryItem[];
  }>({
    queryKey: ["/api/v1/admin/elasticsearch/query/saved"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/query/saved`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: showSavedPanel,
  });

  // Save query mutation
  const saveQueryMutation = useMutation({
    mutationFn: async () => {
      const parsedQuery = JSON.parse(dslQuery);
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/query/save`,
        {
          name: queryName,
          description: queryDescription,
          indexName: selectedIndex,
          query: parsedQuery,
        },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Query saved successfully",
      });
      setShowSaveModal(false);
      setQueryName("");
      setQueryDescription("");
      refetchSaved();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save query",
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (format: "json" | "csv") => {
      let query: any = { match_all: {} };

      if (searchQuery.trim()) {
        query = {
          multi_match: {
            query: searchQuery,
            fields: ["*"],
          },
        };
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/query/export`,
        {
          indexName: selectedIndex,
          query,
          format,
        },
        {
          withCredentials: true,
          responseType: format === "csv" ? "blob" : "json",
        }
      );

      // Download file
      const blob = new Blob([format === "csv" ? res.data : JSON.stringify(res.data, null, 2)], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedIndex}_export.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!selectedIndex) {
      toast({
        title: "Error",
        description: "Please select an index",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate();
  };

  const handleExecuteDsl = () => {
    if (!selectedIndex) {
      toast({
        title: "Error",
        description: "Please select an index",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(dslQuery);
      executeDslMutation.mutate();
    } catch (e) {
      toast({
        title: "Error",
        description: "Invalid JSON query",
        variant: "destructive",
      });
    }
  };

  const loadSavedQuery = (query: SavedQueryItem) => {
    setSelectedIndex(query.indexName);
    setDslQuery(JSON.stringify(query.query, null, 2));
    setActiveTab("console");
    setShowSavedPanel(false);
  };

  const loadHistoryQuery = (history: QueryHistoryItem) => {
    setSelectedIndex(history.indexName);
    setDslQuery(JSON.stringify(history.query, null, 2));
    setActiveTab("console");
    setShowHistoryPanel(false);
  };

  useEffect(() => {
    if (selectedIndex && activeTab === "browser") {
      setCurrentPage(1);
      handleSearch();
    }
  }, [selectedIndex]);

  const results = activeTab === "browser" ? searchMutation.data?.results : executeDslMutation.data?.results;
  const totalResults = results?.total || 0;
  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite relative overflow-hidden">
      <MatrixBackground />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-lg border border-cyan-400/30">
                <FontAwesomeIcon icon={faSearch} className="text-cyan-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                  Query & Search
                </h1>
                <p className="text-gray-400 mt-1">
                  Browse documents and execute custom Elasticsearch queries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  showHistoryPanel
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-cyan-500/30"
                }`}
              >
                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                History
              </button>
              <button
                onClick={() => setShowSavedPanel(!showSavedPanel)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  showSavedPanel
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-purple-500/30"
                }`}
              >
                <FontAwesomeIcon icon={faBookmark} className="mr-2" />
                Saved
              </button>
            </div>
          </div>
        </motion.div>

        {/* Index Selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
            <label className="block text-sm text-gray-400 mb-2">Select Index</label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">-- Select an index --</option>
              {indicesData?.indices?.map((index) => (
                <option key={index.uuid} value={index.name}>
                  {index.name} ({parseInt(index.docsCount).toLocaleString()} docs)
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("browser")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "browser"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FontAwesomeIcon icon={faDatabase} className="mr-2" />
            Data Browser
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "console"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FontAwesomeIcon icon={faCode} className="mr-2" />
            DSL Console
          </button>
        </div>

        {/* Data Browser Tab */}
        {activeTab === "browser" && (
          <motion.div
            key="browser"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search Controls */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Search Query</label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search across all fields..."
                      className="w-full pl-12 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Page Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Filter Field</label>
                  <select
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-cyan-500/50"
                    disabled={!selectedIndex}
                  >
                    <option value="">-- No filter --</option>
                    {fieldsData?.fields?.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Filter Value</label>
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Enter value to filter by..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                    disabled={!filterField}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSearch}
                  disabled={!selectedIndex || searchMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSearch} />
                  {searchMutation.isPending ? "Searching..." : "Search"}
                </button>

                <button
                  onClick={() => exportMutation.mutate("json")}
                  disabled={!selectedIndex || !results}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faFileExport} />
                  JSON
                </button>

                <button
                  onClick={() => exportMutation.mutate("csv")}
                  disabled={!selectedIndex || !results}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faFileExport} />
                  CSV
                </button>
              </div>
            </div>

            {/* Results */}
            {searchMutation.data && (
              <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    Found <span className="text-cyan-400 font-semibold">{totalResults.toLocaleString()}</span>{" "}
                    documents in <span className="text-purple-400">{results.took}ms</span>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          handleSearch();
                        }}
                        disabled={currentPage === 1}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>

                      <span className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          handleSearch();
                        }}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {results.hits.map((hit: SearchResult, idx: number) => (
                    <div
                      key={hit._id}
                      className="bg-gray-950 rounded-lg p-4 border border-gray-800 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{(currentPage - 1) * pageSize + idx + 1}</span>
                          <span className="text-xs font-mono text-cyan-400">{hit._id}</span>
                        </div>
                        {hit._score && (
                          <span className="text-xs text-purple-400">Score: {hit._score.toFixed(2)}</span>
                        )}
                      </div>
                      <pre className="text-xs text-green-400 overflow-x-auto">
                        {JSON.stringify(hit._source, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* DSL Console Tab */}
        {activeTab === "console" && (
          <motion.div
            key="console"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-gray-400">Elasticsearch DSL Query</label>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!selectedIndex}
                  className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 rounded transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Query
                </button>
              </div>

              <textarea
                value={dslQuery}
                onChange={(e) => setDslQuery(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                placeholder='{ "query": { "match_all": {} } }'
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleExecuteDsl}
                  disabled={!selectedIndex || executeDslMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  {executeDslMutation.isPending ? "Executing..." : "Execute Query"}
                </button>
              </div>
            </div>

            {/* DSL Results */}
            {executeDslMutation.data && (
              <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-400">Results: </span>
                      <span className="text-cyan-400 font-semibold">
                        {executeDslMutation.data.results.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Time: </span>
                      <span className="text-purple-400">{executeDslMutation.data.results.took}ms</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Execution: </span>
                      <span className="text-green-400">{executeDslMutation.data.results.executionTime}ms</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-950 rounded-lg p-4 max-h-[600px] overflow-auto">
                  <pre className="text-xs text-green-400">
                    {JSON.stringify(executeDslMutation.data.results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* History Panel */}
      {showHistoryPanel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                Query History
              </h2>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-gray-400 hover:text-coolWhite"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {historyData?.history?.map((item) => (
                <div
                  key={item._id}
                  className="bg-gray-950 rounded-lg p-4 border border-gray-800 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => loadHistoryQuery(item)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-mono text-cyan-400">{item.indexName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-purple-400">{item.executionTime}ms</div>
                      <div className="text-gray-500">{item.resultCount} results</div>
                    </div>
                  </div>
                  <pre className="text-xs text-green-400 overflow-x-auto mt-2">
                    {JSON.stringify(item.query, null, 2)}
                  </pre>
                </div>
              ))}

              {(!historyData?.history || historyData.history.length === 0) && (
                <div className="text-center text-gray-500 py-8">No query history found</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Saved Queries Panel */}
      {showSavedPanel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                Saved Queries
              </h2>
              <button onClick={() => setShowSavedPanel(false)} className="text-gray-400 hover:text-coolWhite">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {savedQueriesData?.savedQueries?.map((item) => (
                <div
                  key={item._id}
                  className="bg-gray-950 rounded-lg p-4 border border-gray-800 hover:border-purple-500/30 transition-colors cursor-pointer"
                  onClick={() => loadSavedQuery(item)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-lg font-semibold text-purple-400">{item.name}</div>
                      {item.description && <div className="text-sm text-gray-400 mt-1">{item.description}</div>}
                      <div className="text-xs font-mono text-cyan-400 mt-1">{item.indexName}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <pre className="text-xs text-green-400 overflow-x-auto mt-2">
                    {JSON.stringify(item.query, null, 2)}
                  </pre>
                </div>
              ))}

              {(!savedQueriesData?.savedQueries || savedQueriesData.savedQueries.length === 0) && (
                <div className="text-center text-gray-500 py-8">No saved queries found</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Save Query Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              Save Query
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Query Name</label>
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="My Custom Query"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  placeholder="Describe what this query does..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setQueryName("");
                  setQueryDescription("");
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveQueryMutation.mutate()}
                disabled={!queryName.trim() || saveQueryMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg transition-all disabled:opacity-50"
              >
                {saveQueryMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IndexQueryPage;
