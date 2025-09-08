import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Database, Calendar, Shield, ExternalLink, Copy, Filter, Info, User, Globe } from "lucide-react";

interface BrowseTableProps {
  data: any[];
  scanId?: string;
}

interface DataTypeResult {
  value: string;
  type: string;
  timestamp: number;
  module: string;
  count: number;
  confidence: number;
  risk: string;
  source: string;
  eventType: string;
}

const BrowseTable: React.FC<BrowseTableProps> = ({ data, scanId }) => {
  const [selectedDataType, setSelectedDataType] = useState<any>(null);
  const [dataTypeResults, setDataTypeResults] = useState<DataTypeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<DataTypeResult | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleDataTypeClick = async (dataType: any) => {
    if (!scanId) {
      console.warn("No scan ID available for fetching data type results");
      return;
    }

    setSelectedDataType(dataType);
    setLoading(true);
    setShowModal(true);
    setSearchTerm("");
    setFilterModule("");

    try {
      // Placeholder for future OSINT engine data fetching
      console.log(`Would fetch results for data type: ${dataType.type}`);
      setDataTypeResults([]);
      console.warn("OSINT engine not configured. Please integrate your preferred OSINT tool.");
    } catch (error) {
      console.error("Failed to fetch data type results:", error);
      setDataTypeResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: DataTypeResult) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const getRiskColor = (risk: string) => {
    const riskUpper = risk?.toUpperCase() || 'INFO';
    if (riskUpper === 'HIGH') return "text-red-400";
    if (riskUpper === 'MEDIUM') return "text-yellow-400";
    if (riskUpper === 'LOW') return "text-blue-400";
    return "text-gray-400";
  };

  const getRiskLabel = (risk: string) => {
    const riskUpper = risk?.toUpperCase() || 'INFO';
    if (riskUpper === 'HIGH') return "High";
    if (riskUpper === 'MEDIUM') return "Medium";
    if (riskUpper === 'LOW') return "Low";
    return "Info";
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      // Handle both string and number timestamps
      const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (isNaN(ts)) return "Invalid timestamp";
      return new Date(ts).toLocaleString();
    } catch (error) {
      return "Invalid timestamp";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Process and normalize the data
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      // Handle both array and object formats
      if (Array.isArray(item)) {
        return {
          value: item[0] || "Unknown",
          type: item[1] || "UNKNOWN",
          timestamp: item[2] || Date.now(),
          module: item[3] || "Unknown",
          count: typeof item[4] === 'number' ? item[4] : 1,
          confidence: item[5] || 100,
          risk: item[6] || "INFO"
        };
      } else if (item && typeof item === 'object') {
        return {
          value: item.value || item.data || "Unknown",
          type: item.type || item.eventType || "UNKNOWN",
          timestamp: item.timestamp || item.last_seen || Date.now(),
          module: item.module || "Unknown",
          count: typeof item.count === 'number' ? item.count : 1,
          confidence: item.confidence || 100,
          risk: item.risk || item.risk_level || "INFO"
        };
      }
      return {
        value: "Unknown",
        type: "UNKNOWN",
        timestamp: Date.now(),
        module: "Unknown",
        count: 1,
        confidence: 100,
        risk: "INFO"
      };
    });
  }, [data]);

  // Group data by type for the table
  const dataByType = useMemo(() => {
    const grouped: Record<string, any> = {};
    
    normalizedData.forEach((item) => {
      const type = item.type || "UNKNOWN";
      if (!grouped[type]) {
        grouped[type] = {
          type: type,
          count: 0,
          risk: "INFO",
          confidence: 0,
          lastSeen: 0
        };
      }
      
      grouped[type].count += item.count || 1;
      grouped[type].confidence = Math.max(grouped[type].confidence, item.confidence || 100);
      
      // Update risk level if current item has higher risk
      const currentRisk = item.risk || "INFO";
      const riskOrder = { "HIGH": 4, "MEDIUM": 3, "LOW": 2, "INFO": 1 };
      if (riskOrder[currentRisk as keyof typeof riskOrder] > riskOrder[grouped[type].risk as keyof typeof riskOrder]) {
        grouped[type].risk = currentRisk;
      }
      
      // Update last seen timestamp
      if (item.timestamp > grouped[type].lastSeen) {
        grouped[type].lastSeen = item.timestamp;
      }
    });
    
    return Object.values(grouped);
  }, [normalizedData]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-coolWhite mb-4">Data Types Found</h3>
        
        {dataByType.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No data types found for this scan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-300">
                  <th className="text-left p-2">Data Type</th>
                  <th className="text-left p-2">Count</th>
                  <th className="text-left p-2">Risk Level</th>
                  <th className="text-left p-2">Confidence</th>
                  <th className="text-left p-2">Last Seen</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dataByType.map((dataType, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                    <td className="p-2">
                      <span className="text-blue-400 font-mono text-xs">{dataType.type}</span>
                    </td>
                    <td className="p-2 text-coolWhite">{dataType.count}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        dataType.risk === 'HIGH' ? 'bg-red-700/80 text-red-200' :
                        dataType.risk === 'MEDIUM' ? 'bg-yellow-700/80 text-yellow-200' :
                        dataType.risk === 'LOW' ? 'bg-blue-700/80 text-blue-200' :
                        'bg-green-700/80 text-green-200'
                      }`}>
                        {getRiskLabel(dataType.risk)}
                      </span>
                    </td>
                    <td className="p-2 text-coolWhite">{dataType.confidence}%</td>
                    <td className="p-2 text-coolWhite text-xs">
                      {formatTimestamp(dataType.lastSeen)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDataTypeClick(dataType)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Type Results Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-coolWhite">
                {selectedDataType?.type} Results
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-coolWhite placeholder-gray-400"
              />
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-coolWhite"
              >
                <option value="">All Modules</option>
                {Array.from(new Set(dataTypeResults.map(r => r.module))).map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading results...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-300">
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Module</th>
                      <th className="text-left p-2">Risk Level</th>
                      <th className="text-left p-2">Confidence</th>
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataTypeResults
                      .filter(result => 
                        result.value.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        (filterModule === "" || result.module === filterModule)
                      )
                      .map((result, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => handleEventClick(result)}
                        >
                          <td className="p-2">
                            <span className="text-blue-400 font-mono text-xs break-all">
                              {result.value}
                            </span>
                          </td>
                          <td className="p-2 text-coolWhite text-xs">{result.module}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              result.risk === 'HIGH' ? 'bg-red-700/80 text-red-200' :
                              result.risk === 'MEDIUM' ? 'bg-yellow-700/80 text-yellow-200' :
                              result.risk === 'LOW' ? 'bg-blue-700/80 text-blue-200' :
                              'bg-green-700/80 text-green-200'
                            }`}>
                              {getRiskLabel(result.risk)}
                            </span>
                          </td>
                          <td className="p-2 text-coolWhite text-xs">{result.confidence}%</td>
                          <td className="p-2 text-coolWhite text-xs">
                            {formatTimestamp(result.timestamp)}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(result);
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                title="View details"
                              >
                                Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(result.value);
                                }}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                                title="Copy to clipboard"
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Event Details</h3>
                <div className="text-blue-400 font-mono text-sm">
                  {selectedEvent.eventType || selectedEvent.type} • {selectedEvent.module}
                </div>
              </div>
              <button
                onClick={closeEventModal}
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
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedEvent.risk === 'HIGH' ? 'bg-red-700/80 text-red-200' :
                    selectedEvent.risk === 'MEDIUM' ? 'bg-yellow-700/80 text-yellow-200' :
                    selectedEvent.risk === 'LOW' ? 'bg-blue-700/80 text-blue-200' :
                    'bg-green-700/80 text-green-200'
                  }`}>
                    {getRiskLabel(selectedEvent.risk)}
                  </span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">Data</div>
                  <div className="text-white font-mono text-sm break-all">
                    {selectedEvent.value}
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

              {/* Confidence */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <Database className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Confidence</div>
                  <div className="text-white text-sm">
                    {selectedEvent.confidence}%
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

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => copyToClipboard(selectedEvent.value)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Value
              </button>
              <button
                onClick={closeEventModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTable;
