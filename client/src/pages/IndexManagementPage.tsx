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
  faCheckSquare,
  faSquare,
  faCopy,
  faExchangeAlt,
  faLink,
  faTasks,
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
  
  // Bulk operations state
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  
  // Advanced features modals
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showReindexModal, setShowReindexModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [showAliasListModal, setShowAliasListModal] = useState(false);
  const [showAliasSwapModal, setShowAliasSwapModal] = useState(false);
  
  // Clone modal state
  const [cloneSourceIndex, setCloneSourceIndex] = useState("");
  const [cloneTargetIndex, setCloneTargetIndex] = useState("");
  const [cloneIncludeData, setCloneIncludeData] = useState(false);
  
  // Reindex modal state
  const [reindexSource, setReindexSource] = useState("");
  const [reindexDest, setReindexDest] = useState("");
  const [reindexTaskId, setReindexTaskId] = useState("");
  const [reindexProgress, setReindexProgress] = useState(0);
  
  // Alias modal state
  const [aliasIndexName, setAliasIndexName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [aliasAction, setAliasAction] = useState<"create" | "delete">("create");
  
  // Alias swap modal state
  const [swapOldIndex, setSwapOldIndex] = useState("");
  const [swapNewIndex, setSwapNewIndex] = useState("");
  const [swapAliasName, setSwapAliasName] = useState("");

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

  // Fetch all aliases
  const { data: aliasesData, refetch: refetchAliases } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/aliases"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/elasticsearch/aliases`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: showAliasListModal,
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (indexNames: string[]) => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/bulk-delete`,
        { indexNames },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setSelectedIndices(new Set());
      setBulkMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to bulk delete indices",
        variant: "destructive",
      });
    },
  });

  // Bulk refresh mutation
  const bulkRefreshMutation = useMutation({
    mutationFn: async (indexNames: string[]) => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/bulk-refresh`,
        { indexNames },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to bulk refresh indices",
        variant: "destructive",
      });
    },
  });

  // Clone index mutation
  const cloneIndexMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/clone`,
        {
          sourceIndex: cloneSourceIndex,
          targetIndex: cloneTargetIndex,
          includeData: cloneIncludeData,
        },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.taskId && cloneIncludeData) {
        // Async clone with data - monitor task
        setReindexTaskId(data.taskId);
        toast({
          title: "Success",
          description: "Index cloning started. Monitoring progress...",
        });
        // Start polling for progress and finalize when complete
        checkCloneProgress(data.taskId, cloneTargetIndex);
      } else {
        // Structure-only clone completed immediately
        queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
        toast({
          title: "Success",
          description: data.message,
        });
        setShowCloneModal(false);
        setCloneSourceIndex("");
        setCloneTargetIndex("");
        setCloneIncludeData(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to clone index",
        variant: "destructive",
      });
    },
  });

  // Reindex mutation
  const reindexMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/reindex`,
        {
          sourceIndex: reindexSource,
          destIndex: reindexDest,
          waitForCompletion: false,
        },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.result.task) {
        setReindexTaskId(data.result.task);
        toast({
          title: "Success",
          description: "Reindexing started. Tracking progress...",
        });
        // Start polling for progress
        checkReindexProgress(data.result.task);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to start reindexing",
        variant: "destructive",
      });
    },
  });

  // Alias mutation
  const aliasMutation = useMutation({
    mutationFn: async () => {
      if (aliasAction === "create") {
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/admin/elasticsearch/aliases`,
          { indexName: aliasIndexName, aliasName },
          { withCredentials: true }
        );
        return res.data;
      } else {
        const res = await axios.delete(
          `${API_BASE_URL}/api/v1/admin/elasticsearch/aliases`,
          { 
            data: { indexName: aliasIndexName, aliasName },
            withCredentials: true 
          }
        );
        return res.data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      setShowAliasModal(false);
      setAliasIndexName("");
      setAliasName("");
      refetchAliases();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to manage alias",
        variant: "destructive",
      });
    },
  });

  // Alias swap mutation
  const aliasSwapMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/aliases/swap`,
        { oldIndex: swapOldIndex, newIndex: swapNewIndex, aliasName: swapAliasName },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
      setShowAliasSwapModal(false);
      setSwapOldIndex("");
      setSwapNewIndex("");
      setSwapAliasName("");
      refetchAliases();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to swap alias",
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

  // Check reindex progress
  const checkReindexProgress = async (taskId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/tasks/${taskId}`,
        { withCredentials: true }
      );
      
      if (res.data.success) {
        const statusData = res.data.status;
        setReindexProgress(statusData.percentage);
        
        if (!statusData.completed) {
          // Continue polling
          setTimeout(() => checkReindexProgress(taskId), 1000);
        } else {
          const documentsCreated = statusData.progress || 0;
          const totalDocs = statusData.total || 0;
          const failures = statusData.failures?.length || 0;
          const versionConflicts = statusData.version_conflicts || 0;

          // Build completion message
          let message = `Reindexing completed! ${documentsCreated} of ${totalDocs} documents processed.`;
          
          if (failures > 0) {
            message = `⚠️ Reindexing completed with issues! ${documentsCreated} documents succeeded, ${failures} failed due to mapping conflicts.`;
          } else if (documentsCreated === 0 && totalDocs > 0) {
            message = `❌ Reindexing failed! 0 documents transferred due to mapping conflicts. Check destination index mappings.`;
          }

          if (versionConflicts > 0) {
            message += ` (${versionConflicts} version conflicts)`;
          }

          toast({
            title: failures > 0 || (documentsCreated === 0 && totalDocs > 0) ? "Warning" : "Success",
            description: message,
            variant: failures > 0 || (documentsCreated === 0 && totalDocs > 0) ? "destructive" : "default",
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
          setShowReindexModal(false);
          setReindexSource("");
          setReindexDest("");
          setReindexTaskId("");
          setReindexProgress(0);
        }
      }
    } catch (error: any) {
      console.error("Error checking reindex progress:", error);
      // If task not found (404), it means it completed very quickly
      if (error.response?.status === 404) {
        toast({
          title: "Warning",
          description: "Reindex task completed but status unavailable. Check destination index manually.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
        setShowReindexModal(false);
        setReindexSource("");
        setReindexDest("");
        setReindexTaskId("");
        setReindexProgress(0);
      }
    }
  };

  // Check clone progress (similar to reindex but finalizes the index when done)
  const checkCloneProgress = async (taskId: string, targetIndex: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/tasks/${taskId}`,
        { withCredentials: true }
      );
      
      if (res.data.success) {
        const statusData = res.data.status;
        setReindexProgress(statusData.percentage);
        
        if (!statusData.completed) {
          // Continue polling
          setTimeout(() => checkCloneProgress(taskId, targetIndex), 1000);
        } else {
          const documentsCreated = statusData.progress || 0;
          const totalDocs = statusData.total || 0;
          const failures = statusData.failures?.length || 0;

          // Finalize the cloned index (restore settings and replicas)
          try {
            await axios.post(
              `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/finalize-clone`,
              { indexName: targetIndex },
              { withCredentials: true }
            );
          } catch (finalizeError) {
            console.error("Error finalizing clone:", finalizeError);
            toast({
              title: "Warning",
              description: "Clone completed but finalization had issues. Index may need manual optimization.",
              variant: "destructive",
            });
          }

          // Build completion message
          let message = `Cloning completed! ${documentsCreated} of ${totalDocs} documents copied.`;
          
          if (failures > 0) {
            message = `⚠️ Cloning completed with issues! ${documentsCreated} documents succeeded, ${failures} failed.`;
          } else if (documentsCreated === 0 && totalDocs > 0) {
            message = `❌ Cloning failed! 0 documents transferred. Check mapping compatibility.`;
          }

          toast({
            title: failures > 0 || (documentsCreated === 0 && totalDocs > 0) ? "Warning" : "Success",
            description: message,
            variant: failures > 0 || (documentsCreated === 0 && totalDocs > 0) ? "destructive" : "default",
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
          setShowCloneModal(false);
          setCloneSourceIndex("");
          setCloneTargetIndex("");
          setCloneIncludeData(false);
          setReindexTaskId("");
          setReindexProgress(0);
        }
      }
    } catch (error: any) {
      console.error("Error checking clone progress:", error);
      
      // If task not found (404), it might have completed already
      if (error.response?.status === 404) {
        toast({
          title: "Info",
          description: "Clone task completed. Finalizing index...",
        });
        
        // Try to finalize anyway
        try {
          await axios.post(
            `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/finalize-clone`,
            { indexName: targetIndex },
            { withCredentials: true }
          );
          
          toast({
            title: "Success",
            description: "Clone completed successfully!",
          });
        } catch (finalizeError) {
          console.error("Error finalizing clone:", finalizeError);
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/indices"] });
        setShowCloneModal(false);
        setCloneSourceIndex("");
        setCloneTargetIndex("");
        setCloneIncludeData(false);
        setReindexTaskId("");
        setReindexProgress(0);
      } else {
        // Other errors
        toast({
          title: "Error",
          description: "Failed to monitor clone progress. The operation may still complete in the background.",
          variant: "destructive",
        });
        setShowCloneModal(false);
        setCloneSourceIndex("");
        setCloneTargetIndex("");
        setCloneIncludeData(false);
        setReindexTaskId("");
        setReindexProgress(0);
      }
    }
  };

  // Toggle index selection for bulk operations
  const toggleIndexSelection = (indexName: string) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(indexName)) {
      newSelection.delete(indexName);
    } else {
      newSelection.add(indexName);
    }
    setSelectedIndices(newSelection);
  };

  // Select all indices
  const selectAllIndices = () => {
    if (filteredIndices) {
      const allNames = filteredIndices.filter(idx => !idx.name.startsWith('.')).map(idx => idx.name);
      setSelectedIndices(new Set(allNames));
    }
  };

  // Deselect all indices
  const deselectAllIndices = () => {
    setSelectedIndices(new Set());
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIndices.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one index",
        variant: "destructive",
      });
      return;
    }
    bulkDeleteMutation.mutate(Array.from(selectedIndices));
  };

  // Handle bulk refresh
  const handleBulkRefresh = () => {
    if (selectedIndices.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one index",
        variant: "destructive",
      });
      return;
    }
    bulkRefreshMutation.mutate(Array.from(selectedIndices));
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
              <div className="p-3 rounded bg-blue-700/10 text-white">
                <FontAwesomeIcon icon={faDatabase} className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">
                  Index Management
                </h1>
                <p className="text-sm text-gray-400">Manage Elasticsearch indices and monitor cluster health</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  bulkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-gray-800/50 border-gray-700 text-gray-400"
                }`}
              >
                <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                {bulkMode ? "Exit Bulk Mode" : "Bulk Operations"}
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  autoRefresh
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-gray-800/50 border-gray-700 text-gray-400"
                }`}
              >
                <FontAwesomeIcon icon={faRefresh} className={autoRefresh ? "animate-spin" : ""} />
                <span className="ml-2">{autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create Index
              </button>
            </div>
          </div>

          {/* Advanced Operations Bar */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setShowCloneModal(true)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faCopy} />
              Clone Index
            </button>

            <button
              onClick={() => setShowReindexModal(true)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faExchangeAlt} />
              Reindex
            </button>

            <button
              onClick={() => setShowAliasModal(true)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faLink} />
              Manage Aliases
            </button>

            <button
              onClick={() => setShowAliasSwapModal(true)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faExchangeAlt} />
              Swap Alias
            </button>

            <button
              onClick={() => setShowAliasListModal(true)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faTasks} />
              View All Aliases
            </button>
          </div>
        </motion.div>

        {/* Bulk Operations Toolbar */}
        {bulkMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-200 font-semibold">
                  {selectedIndices.size} indices selected
                </span>
                <button
                  onClick={selectAllIndices}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllIndices}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-all"
                >
                  Deselect All
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkRefresh}
                  disabled={selectedIndices.size === 0 || bulkRefreshMutation.isPending}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Refresh Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIndices.size === 0 || bulkDeleteMutation.isPending}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
                    {bulkMode && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <FontAwesomeIcon icon={faCheckSquare} />
                      </th>
                    )}
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
                      {bulkMode && (
                        <td className="px-4 py-4">
                          {!index.name.startsWith('.') && (
                            <button
                              onClick={() => toggleIndexSelection(index.name)}
                              className="text-xl"
                            >
                              <FontAwesomeIcon
                                icon={selectedIndices.has(index.name) ? faCheckSquare : faSquare}
                                className={selectedIndices.has(index.name) ? "text-purple-400" : "text-gray-600"}
                              />
                            </button>
                          )}
                        </td>
                      )}
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
            <h2 className="text-2xl font-semibold mb-4 text-white">
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
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50"
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

      {/* Clone Index Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-blue-500/50 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Clone Index
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Source Index</label>
                <select
                  value={cloneSourceIndex}
                  onChange={(e) => setCloneSourceIndex(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Select source index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Index Name</label>
                <input
                  type="text"
                  value={cloneTargetIndex}
                  onChange={(e) => setCloneTargetIndex(e.target.value.toLowerCase())}
                  placeholder="new-index-name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeData"
                  checked={cloneIncludeData}
                  onChange={(e) => setCloneIncludeData(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeData" className="text-sm text-gray-300">
                  Include data (clone with documents)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCloneModal(false);
                  setCloneSourceIndex("");
                  setCloneTargetIndex("");
                  setCloneIncludeData(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => cloneIndexMutation.mutate()}
                disabled={!cloneSourceIndex || !cloneTargetIndex || cloneIndexMutation.isPending}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50"
              >
                {cloneIndexMutation.isPending ? "Cloning..." : "Clone Index"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reindex Modal */}
      {showReindexModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-green-500/50 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Reindex Data
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Source Index</label>
                <select
                  value={reindexSource}
                  onChange={(e) => setReindexSource(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-green-500/50"
                >
                  <option value="">-- Select source index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Destination Index</label>
                <select
                  value={reindexDest}
                  onChange={(e) => setReindexDest(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-green-500/50"
                >
                  <option value="">-- Select destination index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>

              {reindexTaskId && (
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Reindexing Progress</span>
                    <span className="text-sm font-semibold text-green-400">{reindexProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${reindexProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReindexModal(false);
                  setReindexSource("");
                  setReindexDest("");
                  setReindexTaskId("");
                  setReindexProgress(0);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reindexMutation.mutate()}
                disabled={!reindexSource || !reindexDest || reindexMutation.isPending || reindexTaskId !== ""}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50"
              >
                {reindexMutation.isPending ? "Starting..." : "Start Reindex"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alias Management Modal */}
      {showAliasModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-yellow-500/50 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Manage Alias
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Action</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAliasAction("create")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                      aliasAction === "create"
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-gray-800 border-gray-700 text-gray-400"
                    }`}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setAliasAction("delete")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                      aliasAction === "delete"
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-gray-800 border-gray-700 text-gray-400"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Index Name</label>
                <select
                  value={aliasIndexName}
                  onChange={(e) => setAliasIndexName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="">-- Select index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Alias Name</label>
                <input
                  type="text"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value.toLowerCase())}
                  placeholder="alias-name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAliasModal(false);
                  setAliasIndexName("");
                  setAliasName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => aliasMutation.mutate()}
                disabled={!aliasIndexName || !aliasName || aliasMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg transition-all disabled:opacity-50"
              >
                {aliasMutation.isPending ? "Processing..." : aliasAction === "create" ? "Create Alias" : "Delete Alias"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View All Aliases Modal */}
      {showAliasListModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-purple-500/50 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">
                All Index Aliases
              </h2>
              <button
                onClick={() => setShowAliasListModal(false)}
                className="text-gray-400 hover:text-coolWhite"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {aliasesData?.aliases && aliasesData.aliases.length > 0 ? (
                aliasesData.aliases.map((alias: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-950 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-mono text-purple-400">{alias.alias}</div>
                        <div className="text-xs text-gray-500 mt-1">Index: {alias.index}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {alias.index === alias.alias ? "Default" : "Alias"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">No aliases found</div>
              )}
            </div>

            <button
              onClick={() => setShowAliasListModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Swap Alias Modal */}
      {showAliasSwapModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-orange-500/50 max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Swap Alias (Zero-Downtime)
            </h2>
            
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-xs text-orange-400">
                ⚡ This performs an atomic swap - instantly moves the alias from old index to new index with zero downtime!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Alias Name</label>
                <input
                  type="text"
                  value={swapAliasName}
                  onChange={(e) => setSwapAliasName(e.target.value.toLowerCase())}
                  placeholder="my-alias"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Current Index (Remove alias from)</label>
                <select
                  value={swapOldIndex}
                  onChange={(e) => setSwapOldIndex(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">-- Select old index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">New Index (Add alias to)</label>
                <select
                  value={swapNewIndex}
                  onChange={(e) => setSwapNewIndex(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">-- Select new index --</option>
                  {indicesData?.indices?.map((index) => (
                    <option key={index.uuid} value={index.name}>{index.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAliasSwapModal(false);
                  setSwapOldIndex("");
                  setSwapNewIndex("");
                  setSwapAliasName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => aliasSwapMutation.mutate()}
                disabled={!swapOldIndex || !swapNewIndex || !swapAliasName || aliasSwapMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg transition-all disabled:opacity-50 font-semibold"
              >
                {aliasSwapMutation.isPending ? "Swapping..." : "⚡ Atomic Swap"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IndexManagementPage;
