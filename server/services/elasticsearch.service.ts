import axios from 'axios';
import { ELASTICSEARCH_URI } from '../config';

export interface ElasticsearchIndex {
  name: string;
  health: string;
  status: string;
  uuid: string;
  pri: string; // primary shards
  rep: string; // replica shards
  docsCount: string;
  docsDeleted: string;
  storeSize: string;
  priStoreSize: string;
}

export interface IndexStats {
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

export interface ClusterHealth {
  clusterName: string;
  status: string;
  timedOut: boolean;
  numberOfNodes: number;
  numberOfDataNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  relocatingShards: number;
  initializingShards: number;
  unassignedShards: number;
  delayedUnassignedShards: number;
  numberOfPendingTasks: number;
  numberOfInFlightFetch: number;
  taskMaxWaitingInQueueMillis: number;
  activeShardsPercentAsNumber: number;
}

class ElasticsearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ELASTICSEARCH_URI;
  }

  /**
   * Get all indices from Elasticsearch
   */
  async getAllIndices(): Promise<ElasticsearchIndex[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/_cat/indices?v&format=json&h=health,status,index,uuid,pri,rep,docs.count,docs.deleted,store.size,pri.store.size`);
      
      return response.data.map((index: any) => ({
        name: index.index,
        health: index.health,
        status: index.status,
        uuid: index.uuid,
        pri: index.pri,
        rep: index.rep,
        docsCount: index['docs.count'] || '0',
        docsDeleted: index['docs.deleted'] || '0',
        storeSize: index['store.size'] || '0b',
        priStoreSize: index['pri.store.size'] || '0b',
      }));
    } catch (error: any) {
      console.error('Error fetching indices:', error.message);
      throw new Error(`Failed to fetch indices: ${error.message}`);
    }
  }

  /**
   * Get detailed stats for a specific index
   */
  async getIndexStats(indexName: string): Promise<IndexStats> {
    try {
      const response = await axios.get(`${this.baseUrl}/${indexName}/_stats`);
      const indexData = response.data.indices[indexName];

      // Get index health
      const healthResponse = await axios.get(`${this.baseUrl}/_cat/indices/${indexName}?format=json`);
      const healthData = healthResponse.data[0];

      return {
        indexName,
        docsCount: indexData.total.docs.count,
        docsDeleted: indexData.total.docs.deleted,
        storeSize: this.formatBytes(indexData.total.store.size_in_bytes),
        primaryShards: indexData.total.segments.count,
        replicaShards: parseInt(healthData.rep),
        totalShards: parseInt(healthData.pri) + parseInt(healthData.rep),
        health: healthData.health,
        status: healthData.status,
      };
    } catch (error: any) {
      console.error(`Error fetching stats for index ${indexName}:`, error.message);
      throw new Error(`Failed to fetch index stats: ${error.message}`);
    }
  }

  /**
   * Create a new index
   */
  async createIndex(indexName: string, settings?: any): Promise<boolean> {
    try {
      const defaultSettings = {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
        mappings: {
          properties: {
            timestamp: { type: 'date' },
            message: { type: 'text' },
          },
        },
        ...settings,
      };

      await axios.put(`${this.baseUrl}/${indexName}`, defaultSettings);
      return true;
    } catch (error: any) {
      console.error(`Error creating index ${indexName}:`, error.message);
      throw new Error(`Failed to create index: ${error.message}`);
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/${indexName}`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting index ${indexName}:`, error.message);
      throw new Error(`Failed to delete index: ${error.message}`);
    }
  }

  /**
   * Get cluster health
   */
  async getClusterHealth(): Promise<ClusterHealth> {
    try {
      const response = await axios.get(`${this.baseUrl}/_cluster/health`);
      return {
        clusterName: response.data.cluster_name,
        status: response.data.status,
        timedOut: response.data.timed_out,
        numberOfNodes: response.data.number_of_nodes,
        numberOfDataNodes: response.data.number_of_data_nodes,
        activePrimaryShards: response.data.active_primary_shards,
        activeShards: response.data.active_shards,
        relocatingShards: response.data.relocating_shards,
        initializingShards: response.data.initializing_shards,
        unassignedShards: response.data.unassigned_shards,
        delayedUnassignedShards: response.data.delayed_unassigned_shards,
        numberOfPendingTasks: response.data.number_of_pending_tasks,
        numberOfInFlightFetch: response.data.number_of_in_flight_fetch,
        taskMaxWaitingInQueueMillis: response.data.task_max_waiting_in_queue_millis,
        activeShardsPercentAsNumber: response.data.active_shards_percent_as_number,
      };
    } catch (error: any) {
      console.error('Error fetching cluster health:', error.message);
      throw new Error(`Failed to fetch cluster health: ${error.message}`);
    }
  }

  /**
   * Get index mapping
   */
  async getIndexMapping(indexName: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${indexName}/_mapping`);
      return response.data[indexName].mappings;
    } catch (error: any) {
      console.error(`Error fetching mapping for index ${indexName}:`, error.message);
      throw new Error(`Failed to fetch index mapping: ${error.message}`);
    }
  }

  /**
   * Get index settings
   */
  async getIndexSettings(indexName: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${indexName}/_settings`);
      return response.data[indexName].settings;
    } catch (error: any) {
      console.error(`Error fetching settings for index ${indexName}:`, error.message);
      throw new Error(`Failed to fetch index settings: ${error.message}`);
    }
  }

  /**
   * Refresh an index
   */
  async refreshIndex(indexName: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/${indexName}/_refresh`);
      return true;
    } catch (error: any) {
      console.error(`Error refreshing index ${indexName}:`, error.message);
      throw new Error(`Failed to refresh index: ${error.message}`);
    }
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if Elasticsearch is reachable
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/_cluster/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const elasticsearchService = new ElasticsearchService();
