import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faClock,
  faTrash,
  faCalendar,
  faLayerGroup,
  faRotate,
  faCompressAlt,
  faArchive,
  faCloudUploadAlt,
  faCloudDownloadAlt,
  faHistory,
  faCog,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faPlay,
  faEye,
  faServer,
  faHdd,
  faFire,
  faSnowflake,
  faWind,
  faThermometerHalf,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/hooks/use-toast";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface ILMPolicy {
  name: string;
  phases: {
    hot?: ILMPhase;
    warm?: ILMPhase;
    cold?: ILMPhase;
    frozen?: ILMPhase;
    delete?: ILMPhase;
  };
  modified_date?: string;
}

interface ILMPhase {
  min_age?: string;
  actions: {
    rollover?: {
      max_age?: string;
      max_size?: string;
      max_docs?: number;
      max_primary_shard_size?: string;
    };
    shrink?: {
      number_of_shards: number;
    };
    forcemerge?: {
      max_num_segments: number;
    };
    allocate?: {
      number_of_replicas?: number;
      require?: Record<string, string>;
    };
    delete?: {};
    readonly?: {};
    set_priority?: {
      priority: number;
    };
  };
}

interface SnapshotRepository {
  name: string;
  type: string;
  settings: Record<string, any>;
}

interface Snapshot {
  snapshot: string;
  uuid: string;
  version_id: number;
  version: string;
  indices: string[];
  state: string;
  start_time: string;
  end_time: string;
  duration_in_millis: number;
  failures: any[];
  shards: {
    total: number;
    failed: number;
    successful: number;
  };
}

interface PurgeJob {
  id: string;
  indexPattern: string;
  dateField: string;
  retentionDays: number;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

const DataManagementPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ilm" | "snapshot" | "purge">("ilm");

  // ILM State
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState<Partial<ILMPolicy>>({
    name: "",
    phases: {},
  });

  // Snapshot State
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotIndices, setSnapshotIndices] = useState<string[]>([]);

  // Purge State
  const [showCreatePurge, setShowCreatePurge] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [purgePreview, setPurgePreview] = useState<any>(null);

  // Fetch ILM Policies
  const { data: ilmPolicies, isLoading: ilmLoading } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/data/ilm/policies"],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/ilm/policies`,
        { withCredentials: true }
      );
      return response.data.policies as ILMPolicy[];
    },
  });

  // Fetch Snapshot Repositories
  const { data: repositories, isLoading: repoLoading } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/data/snapshot/repositories"],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/snapshot/repositories`,
        { withCredentials: true }
      );
      return response.data.repositories as SnapshotRepository[];
    },
  });

  // Fetch Snapshots
  const { data: snapshots, isLoading: snapshotLoading } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/data/snapshot/list", selectedRepository],
    queryFn: async () => {
      if (!selectedRepository) return [];
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/snapshot/list/${selectedRepository}`,
        { withCredentials: true }
      );
      return response.data.snapshots as Snapshot[];
    },
    enabled: !!selectedRepository,
  });

  // Fetch Purge Jobs
  const { data: purgeJobs, isLoading: purgeLoading } = useQuery({
    queryKey: ["/api/v1/admin/elasticsearch/data/purge/jobs"],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/purge/jobs`,
        { withCredentials: true }
      );
      return response.data.jobs as PurgeJob[];
    },
  });

  // Create ILM Policy Mutation
  const createILMPolicy = useMutation({
    mutationFn: async (policy: Partial<ILMPolicy>) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/ilm/policies`,
        policy,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/data/ilm/policies"] });
      toast({
        title: "Success",
        description: "ILM policy created successfully",
      });
      setShowCreatePolicy(false);
      setNewPolicy({ name: "", phases: {} });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create ILM policy",
        variant: "destructive",
      });
    },
  });

  // Delete ILM Policy Mutation
  const deleteILMPolicy = useMutation({
    mutationFn: async (policyName: string) => {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/ilm/policies/${policyName}`,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/data/ilm/policies"] });
      toast({
        title: "Success",
        description: "ILM policy deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete ILM policy",
        variant: "destructive",
      });
    },
  });

  // Create Snapshot Mutation
  const createSnapshot = useMutation({
    mutationFn: async (data: { repository: string; snapshot: string; indices: string[] }) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/snapshot/create`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/elasticsearch/data/snapshot/list"] });
      toast({
        title: "Success",
        description: "Snapshot creation initiated",
      });
      setShowCreateSnapshot(false);
      setSnapshotName("");
      setSnapshotIndices([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create snapshot",
        variant: "destructive",
      });
    },
  });

  // Restore Snapshot Mutation
  const restoreSnapshot = useMutation({
    mutationFn: async (data: { repository: string; snapshot: string }) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/snapshot/restore`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Snapshot restoration initiated successfully. Check cluster status for progress.",
      });
    },
    onError: (error: any) => {
      const errorDetails = error.response?.data?.details;
      let errorMessage = error.response?.data?.error || "Failed to restore snapshot";
      
      // Add more specific error information if available
      if (errorDetails?.error?.reason) {
        errorMessage += `: ${errorDetails.error.reason}`;
      } else if (typeof errorDetails === 'string') {
        errorMessage += `: ${errorDetails}`;
      }
      
      toast({
        title: "Restore Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log full error for debugging
      console.error("Snapshot restore error:", error.response?.data);
    },
  });

  // Preview Purge Mutation
  const previewPurge = useMutation({
    mutationFn: async (data: { indexPattern: string; dateField: string; retentionDays: number }) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/purge/preview`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setPurgePreview(data);
      setShowPreview(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to preview purge",
        variant: "destructive",
      });
    },
  });

  // Execute Purge Mutation
  const executePurge = useMutation({
    mutationFn: async (data: { indexPattern: string; dateField: string; retentionDays: number }) => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/data/purge/execute`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data purge completed successfully",
      });
      setShowPreview(false);
      setPurgePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to execute purge",
        variant: "destructive",
      });
    },
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "hot":
        return faFire;
      case "warm":
        return faThermometerHalf;
      case "cold":
        return faSnowflake;
      case "frozen":
        return faWind;
      default:
        return faHdd;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "hot":
        return "text-red-400";
      case "warm":
        return "text-orange-400";
      case "cold":
        return "text-blue-400";
      case "frozen":
        return "text-cyan-400";
      default:
        return "text-gray-400";
    }
  };

  const getPolicyDescription = (policy: ILMPolicy): string => {
    const phases = Object.keys(policy.phases);
    const phaseCount = phases.length;
    
    // Check for specific policy patterns
    if (policy.name.includes('history')) {
      return 'Manages ILM history indices - tracks lifecycle policy execution';
    }
    if (policy.name.includes('fleet')) {
      return 'Manages Elastic Fleet/Agent metadata and logs';
    }
    
    // Generate description based on phases
    const descriptions: string[] = [];
    
    if (policy.phases.hot?.actions?.rollover) {
      descriptions.push('Auto-rollover enabled');
    }
    if (policy.phases.warm) {
      descriptions.push('Moves to warm tier');
    }
    if (policy.phases.cold) {
      descriptions.push('Archives to cold storage');
    }
    if (policy.phases.frozen) {
      descriptions.push('Freezes for long-term storage');
    }
    if (policy.phases.delete) {
      const deleteAge = policy.phases.delete.min_age || '90d';
      descriptions.push(`Deletes after ${deleteAge}`);
    }
    
    return descriptions.length > 0 
      ? descriptions.join(' → ') 
      : `${phaseCount} phase${phaseCount !== 1 ? 's' : ''} configured`;
  };

  return (
    <div className="relative min-h-screen bg-jetBlack text-coolWhite overflow-hidden">
      <MatrixBackground />

      <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded bg-blue-700/10 text-white">
              <FontAwesomeIcon icon={faDatabase} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Data Management</h1>
              <p className="text-sm text-gray-400">
                Manage index lifecycle, snapshots, and data retention policies
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("ilm")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "ilm"
                ? "bg-gray-700 text-white"
                : "bg-deepNavy/50 text-coolWhite/70 hover:bg-deepNavy"
            }`}
          >
            <FontAwesomeIcon icon={faClock} className="mr-2" />
            Index Lifecycle
          </button>
          <button
            onClick={() => setActiveTab("snapshot")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "snapshot"
                ? "bg-gray-700 text-white"
                : "bg-deepNavy/50 text-coolWhite/70 hover:bg-deepNavy"
            }`}
          >
            <FontAwesomeIcon icon={faArchive} className="mr-2" />
            Snapshot & Restore
          </button>
          <button
            onClick={() => setActiveTab("purge")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "purge"
                ? "bg-gray-700 text-white"
                : "bg-deepNavy/50 text-coolWhite/70 hover:bg-deepNavy"
            }`}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Data Purging
          </button>
        </div>

        {/* Index Lifecycle Management Tab */}
        {activeTab === "ilm" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Index Lifecycle Management (ILM)
              </h2>
              <button
                onClick={() => setShowCreatePolicy(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Create Policy
              </button>
            </div>

            {/* ILM Policies List */}
            <div className="grid gap-4">
              {ilmLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : ilmPolicies && ilmPolicies.length > 0 ? (
                ilmPolicies.map((policy) => (
                  <div
                    key={policy.name}
                    className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {policy.name}
                        </h3>
                        <p className="text-sm text-emerald-400/80 mb-2">
                          {getPolicyDescription(policy)}
                        </p>
                        {policy.modified_date && (
                          <p className="text-xs text-coolWhite/60">
                            Modified: {formatDate(policy.modified_date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteILMPolicy.mutate(policy.name)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Delete
                      </button>
                    </div>

                    {/* Policy Phases */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(policy.phases).map(([phaseName, phase]) => (
                        <div
                          key={phaseName}
                          className="bg-jetBlack/50 rounded-lg p-4 border border-emerald-500/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <FontAwesomeIcon
                              icon={getTierIcon(phaseName)}
                              className={getTierColor(phaseName)}
                            />
                            <h4 className="font-semibold text-white capitalize">
                              {phaseName}
                            </h4>
                          </div>
                          {phase.min_age && (
                            <p className="text-sm text-coolWhite/70 mb-2">
                              Min Age: {phase.min_age}
                            </p>
                          )}
                          <div className="space-y-1">
                            {Object.keys(phase.actions).map((action) => (
                              <div
                                key={action}
                                className="text-xs text-emerald-400 flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                                {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-deepNavy/30 rounded-lg">
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-4xl text-coolWhite/30 mb-4"
                  />
                  <p className="text-coolWhite/70">No ILM policies found</p>
                  <p className="text-sm text-coolWhite/50 mt-2">
                    Create a policy to automate index lifecycle management
                  </p>
                </div>
              )}
            </div>

            {/* Create Policy Modal */}
            {showCreatePolicy && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-deepNavy rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Create ILM Policy
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Policy Name
                      </label>
                      <input
                        type="text"
                        value={newPolicy.name || ""}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, name: e.target.value })
                        }
                        className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-coolWhite/40"
                        placeholder="my-ilm-policy"
                      />
                    </div>

                    <div className="bg-jetBlack/30 rounded-lg p-4">
                      <p className="text-sm text-coolWhite/70 mb-2">
                        Configure phases in the policy (JSON format):
                      </p>
                      <textarea
                        value={JSON.stringify(newPolicy.phases, null, 2)}
                        onChange={(e) => {
                          try {
                            const phases = JSON.parse(e.target.value);
                            setNewPolicy({ ...newPolicy, phases });
                          } catch (err) {
                            // Invalid JSON, ignore
                          }
                        }}
                        className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 placeholder:text-coolWhite/40"
                        rows={12}
                        placeholder={`{
  "hot": {
    "actions": {
      "rollover": {
        "max_age": "7d",
        "max_size": "50gb"
      }
    }
  },
  "warm": {
    "min_age": "7d",
    "actions": {
      "shrink": {
        "number_of_shards": 1
      }
    }
  },
  "delete": {
    "min_age": "30d",
    "actions": {
      "delete": {}
    }
  }
}`}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => createILMPolicy.mutate(newPolicy)}
                        disabled={!newPolicy.name || createILMPolicy.isPending}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {createILMPolicy.isPending ? "Creating..." : "Create Policy"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreatePolicy(false);
                          setNewPolicy({ name: "", phases: {} });
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Snapshot & Restore Tab */}
        {activeTab === "snapshot" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Snapshot & Restore
              </h2>
              <button
                onClick={() => setShowCreateSnapshot(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2" />
                Create Snapshot
              </button>
            </div>

            {/* Repositories */}
            <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Snapshot Repositories
              </h3>
              {repoLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : repositories && repositories.length > 0 ? (
                <div className="grid gap-3">
                  {repositories.map((repo) => (
                    <div
                      key={repo.name}
                      onClick={() => setSelectedRepository(repo.name)}
                      className={`cursor-pointer p-4 rounded-lg border transition-all ${
                        selectedRepository === repo.name
                          ? "bg-emerald-500/10 border-emerald-500"
                          : "bg-jetBlack/30 border-emerald-500/10 hover:border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{repo.name}</h4>
                          <p className="text-sm text-coolWhite/60">Type: {repo.type}</p>
                        </div>
                        <FontAwesomeIcon
                          icon={faServer}
                          className={selectedRepository === repo.name ? "text-emerald-400" : "text-coolWhite/40"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-coolWhite/60 text-center py-4">
                  No repositories configured
                </p>
              )}
            </div>

            {/* Snapshots List */}
            {selectedRepository && (
              <div className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Snapshots in {selectedRepository}
                </h3>
                {snapshotLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                ) : snapshots && snapshots.length > 0 ? (
                  <div className="space-y-3">
                    {snapshots.map((snapshot) => (
                      <div
                        key={snapshot.snapshot}
                        className="bg-jetBlack/30 border border-emerald-500/10 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white">
                              {snapshot.snapshot}
                            </h4>
                            <p className="text-sm text-coolWhite/60">
                              State: <span className={snapshot.state === "SUCCESS" ? "text-emerald-400" : "text-yellow-400"}>{snapshot.state}</span>
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              restoreSnapshot.mutate({
                                repository: selectedRepository,
                                snapshot: snapshot.snapshot,
                              })
                            }
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                          >
                            <FontAwesomeIcon icon={faCloudDownloadAlt} className="mr-2" />
                            Restore
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-coolWhite/60">Indices</p>
                            <p className="text-white font-medium">{snapshot.indices.length}</p>
                          </div>
                          <div>
                            <p className="text-coolWhite/60">Shards</p>
                            <p className="text-white font-medium">
                              {snapshot.shards.successful}/{snapshot.shards.total}
                            </p>
                          </div>
                          <div>
                            <p className="text-coolWhite/60">Duration</p>
                            <p className="text-white font-medium">
                              {(snapshot.duration_in_millis / 1000).toFixed(2)}s
                            </p>
                          </div>
                          <div>
                            <p className="text-coolWhite/60">Date</p>
                            <p className="text-white font-medium">
                              {formatDate(snapshot.start_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-coolWhite/60 text-center py-4">
                    No snapshots found in this repository
                  </p>
                )}
              </div>
            )}

            {/* Create Snapshot Modal */}
            {showCreateSnapshot && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-deepNavy rounded-lg p-6 max-w-md w-full"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Create Snapshot
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Repository
                      </label>
                      <select
                        value={selectedRepository}
                        onChange={(e) => setSelectedRepository(e.target.value)}
                        className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-jetBlack [&>option]:text-white"
                      >
                        <option value="" className="bg-jetBlack text-coolWhite/70">Select a repository</option>
                        {repositories?.map((repo) => (
                          <option key={repo.name} value={repo.name} className="bg-jetBlack text-white">
                            {repo.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Snapshot Name
                      </label>
                      <input
                        type="text"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                        className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-coolWhite/40"
                        placeholder="snapshot-2025-01-01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Indices (comma-separated, or leave empty for all)
                      </label>
                      <input
                        type="text"
                        value={snapshotIndices.join(", ")}
                        onChange={(e) =>
                          setSnapshotIndices(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        className="w-full bg-jetBlack border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder:text-coolWhite/40"
                        placeholder="index1, index2"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          createSnapshot.mutate({
                            repository: selectedRepository,
                            snapshot: snapshotName,
                            indices: snapshotIndices,
                          })
                        }
                        disabled={!selectedRepository || !snapshotName || createSnapshot.isPending}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {createSnapshot.isPending ? "Creating..." : "Create"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateSnapshot(false);
                          setSnapshotName("");
                          setSnapshotIndices([]);
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Data Purging Tab */}
        {activeTab === "purge" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Data Purging</h2>
              <button
                onClick={() => setShowCreatePurge(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                New Purge Job
              </button>
            </div>

            {/* Purge Jobs List */}
            <div className="grid gap-4">
              {purgeLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : purgeJobs && purgeJobs.length > 0 ? (
                purgeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-deepNavy/50 border border-emerald-500/20 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {job.indexPattern}
                        </h3>
                        <p className="text-sm text-coolWhite/60">
                          Date Field: {job.dateField} | Retention: {job.retentionDays} days
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          job.enabled
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {job.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-coolWhite/60">Schedule</p>
                        <p className="text-white font-medium">{job.schedule}</p>
                      </div>
                      {job.lastRun && (
                        <div>
                          <p className="text-coolWhite/60">Last Run</p>
                          <p className="text-white font-medium">
                            {formatDate(job.lastRun)}
                          </p>
                        </div>
                      )}
                      {job.nextRun && (
                        <div>
                          <p className="text-coolWhite/60">Next Run</p>
                          <p className="text-white font-medium">
                            {formatDate(job.nextRun)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-deepNavy/30 rounded-lg">
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-4xl text-coolWhite/30 mb-4"
                  />
                  <p className="text-coolWhite/70">No purge jobs configured</p>
                  <p className="text-sm text-coolWhite/50 mt-2">
                    Create a job to automate data retention
                  </p>
                </div>
              )}
            </div>

            {/* Create Purge Job Modal */}
            {showCreatePurge && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-deepNavy rounded-lg p-6 max-w-md w-full"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Preview Data Purge
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Index Pattern
                      </label>
                      <input
                        type="text"
                        id="indexPattern"
                        className="w-full bg-jetBlack/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="logs-*"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Date Field
                      </label>
                      <input
                        type="text"
                        id="dateField"
                        className="w-full bg-jetBlack/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="@timestamp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-coolWhite/70 mb-2">
                        Retention Days
                      </label>
                      <input
                        type="number"
                        id="retentionDays"
                        className="w-full bg-jetBlack/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="30"
                        min="1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const indexPattern = (document.getElementById("indexPattern") as HTMLInputElement).value;
                          const dateField = (document.getElementById("dateField") as HTMLInputElement).value;
                          const retentionDays = parseInt((document.getElementById("retentionDays") as HTMLInputElement).value);
                          previewPurge.mutate({ indexPattern, dateField, retentionDays });
                        }}
                        className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        Preview
                      </button>
                      <button
                        onClick={() => setShowCreatePurge(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Preview Modal */}
            {showPreview && purgePreview && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-deepNavy rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
                    Purge Preview
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-jetBlack/50 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">
                        Documents to be deleted:
                      </h4>
                      <div className="text-3xl font-bold text-red-400 mb-2">
                        {purgePreview.documentsToDelete?.toLocaleString() || 0}
                      </div>
                      <p className="text-sm text-coolWhite/70">
                        From {purgePreview.affectedIndices?.length || 0} indices
                      </p>
                    </div>

                    {purgePreview.affectedIndices && purgePreview.affectedIndices.length > 0 && (
                      <div className="bg-jetBlack/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-3">
                          Affected Indices:
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {purgePreview.affectedIndices.map((index: string) => (
                            <div
                              key={index}
                              className="text-sm text-coolWhite/70 bg-deepNavy/50 px-3 py-2 rounded"
                            >
                              {index}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 font-medium">
                        ⚠️ This action cannot be undone!
                      </p>
                      <p className="text-sm text-coolWhite/70 mt-1">
                        Please verify the preview before proceeding.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const indexPattern = (document.getElementById("indexPattern") as HTMLInputElement).value;
                          const dateField = (document.getElementById("dateField") as HTMLInputElement).value;
                          const retentionDays = parseInt((document.getElementById("retentionDays") as HTMLInputElement).value);
                          executePurge.mutate({ indexPattern, dateField, retentionDays });
                        }}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlay} className="mr-2" />
                        Execute Purge
                      </button>
                      <button
                        onClick={() => {
                          setShowPreview(false);
                          setPurgePreview(null);
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DataManagementPage;
