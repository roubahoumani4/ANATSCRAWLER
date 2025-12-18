import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDatabase,
  faCircle,
  faRefresh,
  faCode,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import MatrixBackground from "@/components/ui/MatrixBackground";
import axios from "axios";

interface IndexStats {
  indexName: string;
  docsCount: number;
  docsDeleted: number;
  storeSize: string;
  primaryShards: number;
  replicaShards: number;
  totalShards: number;
  health: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const IndexDetailsPage = () => {
  const { indexName } = useParams<{ indexName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"stats" | "mapping" | "settings">("stats");

  // Fetch index stats
  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: IndexStats }>({
    queryKey: [`/api/v1/admin/elasticsearch/indices/${indexName}/stats`],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/${indexName}/stats`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: !!indexName,
    refetchInterval: 5000,
  });

  // Fetch index mapping
  const { data: mappingData, isLoading: mappingLoading } = useQuery<{ success: boolean; mapping: any }>({
    queryKey: [`/api/v1/admin/elasticsearch/indices/${indexName}/mapping`],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/${indexName}/mapping`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: !!indexName && activeTab === "mapping",
  });

  // Fetch index settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ success: boolean; settings: any }>({
    queryKey: [`/api/v1/admin/elasticsearch/indices/${indexName}/settings`],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/admin/elasticsearch/indices/${indexName}/settings`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: !!indexName && activeTab === "settings",
  });

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

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite relative overflow-hidden">
      <MatrixBackground />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => navigate("/index/management")}
            className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Index Management
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-lg border border-cyan-400/30">
                <FontAwesomeIcon icon={faDatabase} className="text-cyan-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                  {indexName}
                </h1>
                <p className="text-gray-400 mt-1">Index Details & Statistics</p>
              </div>
            </div>

            {statsData?.stats && (
              <div className={`px-4 py-2 rounded-lg border ${getHealthBgColor(statsData.stats.health)}`}>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircle} className={getHealthColor(statsData.stats.health)} />
                  <span className={`font-semibold ${getHealthColor(statsData.stats.health)}`}>
                    {statsData.stats.health.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Overview */}
        {statsData?.stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Total Documents</div>
              <p className="text-2xl font-bold">{statsData.stats.docsCount.toLocaleString()}</p>
              {statsData.stats.docsDeleted > 0 && (
                <p className="text-xs text-gray-500 mt-1">{statsData.stats.docsDeleted.toLocaleString()} deleted</p>
              )}
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Store Size</div>
              <p className="text-2xl font-bold">{statsData.stats.storeSize}</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Primary Shards</div>
              <p className="text-2xl font-bold">{statsData.stats.primaryShards}</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Replica Shards</div>
              <p className="text-2xl font-bold">{statsData.stats.replicaShards}</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "stats"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FontAwesomeIcon icon={faRefresh} className="mr-2" />
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("mapping")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "mapping"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FontAwesomeIcon icon={faCode} className="mr-2" />
            Mapping
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "settings"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FontAwesomeIcon icon={faCog} className="mr-2" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 rounded-lg border border-gray-800 p-6"
        >
          {activeTab === "stats" && statsData?.stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Index Name</div>
                  <div className="font-mono text-cyan-400">{statsData.stats.indexName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <div className="text-green-400">{statsData.stats.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Shards</div>
                  <div>{statsData.stats.totalShards}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Health</div>
                  <div className={getHealthColor(statsData.stats.health)}>
                    {statsData.stats.health.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mapping" && (
            <div>
              {mappingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <pre className="bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-green-400">{JSON.stringify(mappingData?.mapping, null, 2)}</code>
                </pre>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <pre className="bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-blue-400">{JSON.stringify(settingsData?.settings, null, 2)}</code>
                </pre>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default IndexDetailsPage;
