import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Info, Calendar, Shield, User, Globe } from "lucide-react";

interface DataTypeResult {
  id: number;
  data: string;
  module: string;
  risk: number;
  source: string;
  timestamp: number;
  eventType: string;
}

const DataTypeResultsPage = () => {
  const { scanId, dataType } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<DataTypeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<DataTypeResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!scanId || !dataType) return;

    const fetchDataTypeResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Placeholder for future OSINT engine data fetching
        // This will be implemented when you integrate your new OSINT engine
        setResults([]);
        setTotalCount(0);
        setError('OSINT engine not configured. Please integrate your preferred OSINT tool.');
      } catch (err) {
        console.error('Error fetching data type results:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch results');
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDataTypeResults();
  }, [scanId, dataType]);

  const handleEventClick = (event: DataTypeResult) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 3) return "bg-red-700/80 text-red-200";
    if (risk === 2) return "bg-yellow-700/80 text-yellow-200";
    if (risk === 1) return "bg-blue-700/80 text-blue-200";
    return "bg-green-700/80 text-green-200";
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 3) return "High";
    if (risk === 2) return "Medium";
    if (risk === 1) return "Low";
    return "Info";
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!scanId || !dataType) {
    return (
      <div className="p-8 text-red-400">Invalid scan ID or data type.</div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/osint/scans/${scanId}`)}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← Back to Scan
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {dataType} Results
              </h1>
              <p className="text-gray-400">
                Scan ID: {scanId} • {totalCount.toLocaleString()} results found
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Risk:</span>
                <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
                  <option value="">All</option>
                  <option value="3">High</option>
                  <option value="2">Medium</option>
                  <option value="1">Low</option>
                  <option value="0">Info</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Module:</span>
                <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
                  <option value="">All</option>
                  <option value="sfp_dnsresolve">DNS Resolve</option>
                  <option value="sfp_whois">WHOIS</option>
                  <option value="sfp_spider">Spider</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Search:</span>
                <input
                  type="text"
                  placeholder="Search in results..."
                  className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="mt-2 text-gray-400">Loading {dataType} results...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Error loading results</h3>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gray-900 p-4 rounded mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Risk Level:</span>
              <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
                <option value="">All</option>
                <option value="0">Low (0)</option>
                <option value="1">Medium (1)</option>
                <option value="2">High (2)</option>
                <option value="3">Critical (3)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Module:</span>
              <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
                <option value="">All</option>
                <option value="sfp_dnsresolve">DNS Resolve</option>
                <option value="sfp_whois">WHOIS</option>
                <option value="sfp_spider">Spider</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Search:</span>
              <input
                type="text"
                placeholder="Search in results..."
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm w-64"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        {!loading && !error && results.length > 0 && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      DATA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      MODULE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      RISK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      SOURCE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      TIMESTAMP
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {results.map((result, idx) => (
                    <tr 
                      key={result.id} 
                      className="hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => handleEventClick(result)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-blue-400">
                          {result.data}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {result.module}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getRiskColor(result.risk)}`}>
                          {getRiskLabel(result.risk)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {result.source}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {formatTimestamp(result.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(result);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No {dataType} results found</div>
            <p className="text-gray-500">This scan may not have discovered any {dataType.toLowerCase()} data yet.</p>
          </div>
        )}

        {/* Pagination */}
        {results.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing 1 to {results.length} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50">
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-300">Page 1</span>
              <button className="px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Event Details</h3>
                  <div className="text-blue-400 font-mono text-sm">
                    {selectedEvent.eventType} • ID: {selectedEvent.id}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Risk Level */}
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Risk Level</div>
                    <span className={`px-2 py-1 text-xs rounded ${getRiskColor(selectedEvent.risk)}`}>
                      {getRiskLabel(selectedEvent.risk)} ({selectedEvent.risk})
                    </span>
                  </div>
                </div>

                {/* Data */}
                <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Data</div>
                    <div className="text-white font-mono text-sm break-all">
                      {selectedEvent.data}
                    </div>
                  </div>
                </div>

                {/* Module */}
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Source Module</div>
                    <div className="text-white font-mono text-sm">
                      {selectedEvent.module}
                    </div>
                  </div>
                </div>

                {/* Source */}
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Source</div>
                    <div className="text-white text-sm">
                      {selectedEvent.source || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Timestamp</div>
                    <div className="text-white text-sm">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Raw Data */}
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Raw Event Data</div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-gray-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTypeResultsPage;
