import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faPlus,
  faTrash,
  faRefresh,
  faSearch,
  faEye,
  faCircle,
  faServer,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/hooks/use-toast";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";

interface ElasticsearchIndex {
  name: string;
  health: string;
  status: string;
  uuid: string;
  pri: string;
  rep: string;
  docsCount: string;
  docsDeleted: string;
  storeSize: string;
  priStoreSize: string;
}

interface ClusterHealth {
  clusterName: string;
  status: string;
  numberOfNodes: number;
  numberOfDataNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  relocatingShards: number;
  initializingShards: number;
  unassignedShards: number;
  activeShardsPercentAsNumber: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const IndexManagementPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [newIndexName, setNewIndexName] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all indices
  const {
    data: indicesData,
    isLoading: indicesLoading,
    error: indicesError,
  } = useQuery<{ success: boolean; indices: ElasticsearchIndex[] }>({
    queryKey: ["/api/v1/admin/elasticsearch/indices"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/indices`, {
        withCredentials: true,
      });
      return res.data;
    },
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  // Fetch cluster health
  const { data: clusterHealthData } = useQuery<{ success: boolean; health: ClusterHealth }>({
    queryKey: ["/api/v1/admin/elasticsearch/cluster/health"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/cluster/health`, {
        withCredentials: true,
      });
      return res.data;
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Create index mutation
  const createIndexMutation = useMutation({
    mutationFn: async (indexName: string) => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices`,
        { indexName },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/cluster/health"] });
      toast({
        title: "Success",
        description: "Index created successfully",
      });
      setShowCreateModal(false);
      setNewIndexName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create index",
        variant: "destructive",
      });
    },
  });

  // Delete index mutation
  const deleteIndexMutation = useMutation({
    mutationFn: async (indexName: string) => {
      const res = await axios.delete(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/${indexName}`,
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/cluster/health"] });
      toast({
        title: "Success",
        description: "Index deleted successfully",
      });
      setShowDeleteModal(false);
      setSelectedIndex(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete index",
        variant: "destructive",
      });
    },
  });

  // Refresh index mutation
  const refreshIndexMutation = useMutation({
    mutationFn: async (indexName: string) => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/${indexName}/refresh`,
        {},
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      toast({
        title: "Success",
        description: "Index refreshed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to refresh index",
        variant: "destructive",
      });
    },
  });

  const handleCreateIndex = () => {
    if (!newIndexName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an index name",
        variant: "destructive",
      });
      return;
    }

    // Validate index name
    const indexNameRegex = /^[a-z0-9_-]+$/;
    if (!indexNameRegex.test(newIndexName)) {
      toast({
        title: "Error",
        description: "Invalid index name. Use only lowercase letters, numbers, hyphens, and underscores.",
        variant: "destructive",
      });
      return;
    }

    createIndexMutation.mutate(newIndexName);
  };

  const handleDeleteIndex = () => {
    if (!selectedIndex) return;
    deleteIndexMutation.mutate(selectedIndex);
  };

  const handleRefreshIndex = (indexName: string) => {
    refreshIndexMutation.mutate(indexName);
  };

  // Filter indices based on search query
  const filteredIndices = indicesData?.indices?.filter((index) =>
    index.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHealthColor = (health: string) => {
    switch (health) {
      case "green":
        return "text-green-500";
      case "yellow":
        return "text-yellow-500";
      case "red":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getHealthBgColor = (health: string) => {
    switch (health) {
      case "green":
        return "bg-green-500/20 border-green-500/50";
      case "yellow":
        return "bg-yellow-500/20 border-yellow-500/50";
      case "red":
        return "bg-red-500/20 border-red-500/50";
      default:
        return "bg-gray-500/20 border-gray-500/50";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "open" ? "text-green-500" : "text-gray-500";
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite relative overflow-hidden">
      <MatrixBackground />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-lg border border-cyan-400/30">
                <FontAwesomeIcon icon={faDatabase} className="text-cyan-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                  Index Management
                </h1>
                <p className="text-gray-400 mt-1">Manage Elasticsearch indices and monitor cluster health</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  autoRefresh
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-gray-800/50 border-gray-700 text-gray-400"
                }`}
              >
                <FontAwesomeIcon icon={faRefresh} className={autoRefresh ? "animate-spin" : ""} />
                <span className="ml-2">{autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create Index
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cluster Health */}
        {clusterHealthData?.health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className={`p-4 rounded-lg border ${getHealthBgColor(clusterHealthData.health.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Cluster Status</span>
                <FontAwesomeIcon icon={faCircle} className={getHealthColor(clusterHealthData.health.status)} />
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(clusterHealthData.health.status)}`}>
                {clusterHealthData.health.status.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{clusterHealthData.health.clusterName}</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Nodes</span>
                <FontAwesomeIcon icon={faServer} className="text-blue-400" />
              </div>
              <p className="text-2xl font-bold">{clusterHealthData.health.numberOfNodes}</p>
              <p className="text-xs text-gray-500 mt-1">{clusterHealthData.health.numberOfDataNodes} data nodes</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Active Shards</span>
                <FontAwesomeIcon icon={faChartLine} className="text-green-400" />
              </div>
              <p className="text-2xl font-bold">{clusterHealthData.health.activeShards}</p>
              <p className="text-xs text-gray-500 mt-1">{clusterHealthData.health.activePrimaryShards} primary</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Shard Health</span>
                <FontAwesomeIcon icon={faCircle} className="text-cyan-400" />
              </div>
              <p className="text-2xl font-bold">{clusterHealthData.health.activeShardsPercentAsNumber.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {clusterHealthData.health.unassignedShards} unassigned
              </p>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search indices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </motion.div>

        {/* Indices Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden"
        >
          {indicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : indicesError ? (
            <div className="flex items-center justify-center py-12 text-red-400">
              Error loading indices
            </div>
          ) : !filteredIndices || filteredIndices.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              No indices found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Index Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Health
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Shards (P/R)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredIndices.map((index) => (
                    <tr key={index.uuid} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faDatabase} className="text-cyan-400" />
                          <span className="font-mono text-sm">{index.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCircle} className={getHealthColor(index.health)} />
                          <span className={`text-sm font-semibold ${getHealthColor(index.health)}`}>
                            {index.health.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${getStatusColor(index.status)}`}>
                          {index.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>{parseInt(index.docsCount).toLocaleString()}</div>
                          {parseInt(index.docsDeleted) > 0 && (
                            <div className="text-xs text-gray-500">
                              {parseInt(index.docsDeleted).toLocaleString()} deleted
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{index.storeSize}</td>
                      <td className="px-6 py-4 text-sm">
                        {index.pri} / {index.rep}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRefreshIndex(index.name)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Refresh Index"
                          >
                            <FontAwesomeIcon icon={faRefresh} />
                          </button>
                          <button
                            onClick={() => window.location.href = `/index/details/${index.name}`}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {!index.name.startsWith('.') && (
                            <button
                              onClick={() => {
                                setSelectedIndex(index.name);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                              title="Delete Index"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Index Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              Create New Index
            </h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Index Name</label>
              <input
                type="text"
                value={newIndexName}
                onChange={(e) => setNewIndexName(e.target.value.toLowerCase())}
                placeholder="my-index-name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use only lowercase letters, numbers, hyphens, and underscores
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewIndexName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIndex}
                disabled={createIndexMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg transition-all disabled:opacity-50"
              >
                {createIndexMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-red-500/50 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-red-400">Delete Index</h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete the index <span className="font-mono text-cyan-400">{selectedIndex}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedIndex(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIndex}
                disabled={deleteIndexMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-all disabled:opacity-50"
              >
                {deleteIndexMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IndexManagementPage;
