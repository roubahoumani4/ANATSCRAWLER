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

  /**
   * Search documents in an index with pagination and filters
   */
  async searchDocuments(
    indexName: string,
    query: any = { match_all: {} },
    from: number = 0,
    size: number = 10,
    sort?: any
  ): Promise<any> {
    try {
      const searchBody: any = {
        query,
        from,
        size,
      };

      if (sort) {
        searchBody.sort = sort;
      }

      const response = await axios.post(`${this.baseUrl}/${indexName}/_search`, searchBody);
      
      return {
        hits: response.data.hits.hits,
        total: response.data.hits.total.value,
        took: response.data.took,
        maxScore: response.data.hits.max_score,
      };
    } catch (error: any) {
      console.error(`Error searching documents in index ${indexName}:`, error.message);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
  }

  /**
   * Execute custom DSL query
   */
  async executeQuery(indexName: string, dslQuery: any): Promise<any> {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${this.baseUrl}/${indexName}/_search`, dslQuery);
      const executionTime = Date.now() - startTime;

      return {
        hits: response.data.hits.hits,
        total: response.data.hits.total.value,
        took: response.data.took,
        maxScore: response.data.hits.max_score,
        aggregations: response.data.aggregations,
        executionTime,
      };
    } catch (error: any) {
      console.error(`Error executing DSL query on index ${indexName}:`, error.message);
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  /**
   * Get all field names from an index mapping
   */
  async getIndexFields(indexName: string): Promise<string[]> {
    try {
      const mapping = await this.getIndexMapping(indexName);
      const fields: string[] = [];

      const extractFields = (obj: any, prefix = '') => {
        if (obj.properties) {
          Object.keys(obj.properties).forEach((key) => {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            fields.push(fullPath);
            extractFields(obj.properties[key], fullPath);
          });
        }
      };

      extractFields(mapping);
      return fields;
    } catch (error: any) {
      console.error(`Error fetching fields for index ${indexName}:`, error.message);
      throw new Error(`Failed to fetch index fields: ${error.message}`);
    }
  }

  /**
   * Count documents matching a query
   */
  async countDocuments(indexName: string, query: any = { match_all: {} }): Promise<number> {
    try {
      const response = await axios.post(`${this.baseUrl}/${indexName}/_count`, { query });
      return response.data.count;
    } catch (error: any) {
      console.error(`Error counting documents in index ${indexName}:`, error.message);
      throw new Error(`Failed to count documents: ${error.message}`);
    }
  }

  /**
   * Bulk delete multiple indices
   */
  async bulkDeleteIndices(indexNames: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const indexName of indexNames) {
      try {
        if (indexName.startsWith('.')) {
          failed.push(indexName);
          continue;
        }
        await this.deleteIndex(indexName);
        success.push(indexName);
      } catch (error) {
        failed.push(indexName);
      }
    }

    return { success, failed };
  }

  /**
   * Bulk refresh multiple indices
   */
  async bulkRefreshIndices(indexNames: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const indexName of indexNames) {
      try {
        await this.refreshIndex(indexName);
        success.push(indexName);
      } catch (error) {
        failed.push(indexName);
      }
    }

    return { success, failed };
  }

  /**
   * Create index alias
   */
  async createAlias(indexName: string, aliasName: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/_aliases`, {
        actions: [
          {
            add: {
              index: indexName,
              alias: aliasName,
            },
          },
        ],
      });
      return true;
    } catch (error: any) {
      console.error(`Error creating alias ${aliasName}:`, error.response?.data || error.message);
      // Extract the actual error message from Elasticsearch
      const errorMsg = error.response?.data?.error?.reason || error.message;
      throw new Error(errorMsg);
    }
  }

  /**
   * Delete index alias
   */
  async deleteAlias(indexName: string, aliasName: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/_aliases`, {
        actions: [
          {
            remove: {
              index: indexName,
              alias: aliasName,
            },
          },
        ],
      });
      return true;
    } catch (error: any) {
      console.error(`Error deleting alias ${aliasName}:`, error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.reason || error.message;
      throw new Error(errorMsg);
    }
  }

  /**
   * Get all aliases
   */
  async getAllAliases(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/_cat/aliases?format=json`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching aliases:', error.message);
      throw new Error(`Failed to fetch aliases: ${error.message}`);
    }
  }

  /**
   * Get aliases for a specific index
   */
  async getIndexAliases(indexName: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${indexName}/_alias`);
      const aliases = response.data[indexName]?.aliases || {};
      return Object.keys(aliases);
    } catch (error: any) {
      console.error(`Error fetching aliases for ${indexName}:`, error.message);
      throw new Error(`Failed to fetch index aliases: ${error.message}`);
    }
  }

  /**
   * Atomic alias swap (zero-downtime reindexing)
   */
  async swapAlias(oldIndex: string, newIndex: string, aliasName: string): Promise<boolean> {
    try {
      await axios.post(`${this.baseUrl}/_aliases`, {
        actions: [
          {
            remove: {
              index: oldIndex,
              alias: aliasName,
            },
          },
          {
            add: {
              index: newIndex,
              alias: aliasName,
            },
          },
        ],
      });
      return true;
    } catch (error: any) {
      console.error(`Error swapping alias ${aliasName}:`, error.message);
      throw new Error(`Failed to swap alias: ${error.message}`);
    }
  }

  /**
   * Reindex from one index to another
   */
  async reindex(sourceIndex: string, destIndex: string, waitForCompletion: boolean = false, conflicts: string = 'abort'): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/_reindex?wait_for_completion=${waitForCompletion}`, {
        conflicts: conflicts, // 'abort' or 'proceed'
        source: {
          index: sourceIndex,
        },
        dest: {
          index: destIndex,
        },
      });

      console.log('Reindex response:', JSON.stringify(response.data, null, 2));

      // If wait_for_completion is false, we get a task ID
      if (!waitForCompletion && response.data.task) {
        return {
          task: response.data.task,
          started: true,
        };
      }

      // If wait_for_completion is true, we get the full result
      const result = {
        total: response.data.total || 0,
        created: response.data.created || 0,
        updated: response.data.updated || 0,
        deleted: response.data.deleted || 0,
        batches: response.data.batches || 0,
        version_conflicts: response.data.version_conflicts || 0,
        noops: response.data.noops || 0,
        took: response.data.took || 0,
        failures: response.data.failures || [],
        timed_out: response.data.timed_out || false,
      };

      // Log failures if any
      if (result.failures.length > 0) {
        console.error(`Reindex had ${result.failures.length} failures:`, result.failures.slice(0, 3));
      }

      return result;
    } catch (error: any) {
      console.error(`Error reindexing from ${sourceIndex} to ${destIndex}:`, error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.reason || error.message;
      throw new Error(errorMsg);
    }
  }

  /**
   * Get reindex task status
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/_tasks/${taskId}`);
      const task = response.data;
      
      console.log('Task status response:', JSON.stringify(task, null, 2));

      // Check if task exists
      if (!task || !task.task) {
        return {
          completed: true,
          status: { created: 0, total: 0 },
          progress: 0,
          total: 0,
          percentage: 100,
          failures: [],
          error: 'Task not found or already completed',
        };
      }

      const status = task.task.status || {};
      const created = status.created || 0;
      const total = status.total || 0;
      const percentage = total > 0 ? Math.round((created / total) * 100) : 100;

      return {
        completed: task.completed || false,
        status: status,
        progress: created,
        total: total,
        percentage: percentage,
        failures: status.failures || [],
        version_conflicts: status.version_conflicts || 0,
      };
    } catch (error: any) {
      console.error(`Error fetching task status ${taskId}:`, error.response?.data || error.message);
      
      // If task is not found, it might have completed
      if (error.response?.status === 404) {
        return {
          completed: true,
          status: { created: 0, total: 0 },
          progress: 0,
          total: 0,
          percentage: 100,
          failures: [],
          error: 'Task completed or not found',
        };
      }
      
      const errorMsg = error.response?.data?.error?.reason || error.message;
      throw new Error(errorMsg);
    }
  }

  /**
   * Clone an index (structure only or with data)
   * Returns task ID if cloning with data, otherwise returns true
   */
  async cloneIndex(sourceIndex: string, targetIndex: string, includeData: boolean = false): Promise<any> {
    try {
      // First, always create the target index with the same structure
      const mapping = await this.getIndexMapping(sourceIndex);
      const settings = await this.getIndexSettings(sourceIndex);

      // Create target index with highly optimized settings for bulk operations
      // These settings minimize resource usage during cloning
      await this.createIndex(targetIndex, {
        mappings: mapping,
        settings: {
          index: {
            number_of_shards: settings.index.number_of_shards,
            number_of_replicas: 0, // No replicas during cloning
            refresh_interval: '-1', // Disable refresh completely during bulk operations
            // Translog settings to reduce disk I/O and memory usage
            'translog.durability': 'async',
            'translog.sync_interval': '30s',
            'translog.flush_threshold_size': '1gb',
            // Reduce memory pressure
            'merge.scheduler.max_thread_count': 1,
          },
        },
      });

      if (includeData) {
        // Clone with data using async reindex (don't wait for completion)
        const reindexResult = await this.reindexAsync(sourceIndex, targetIndex);
        
        return {
          success: true,
          taskId: reindexResult.task,
          message: 'Cloning started in background',
        };
      } else {
        // Structure only clone is complete
        return {
          success: true,
          message: 'Structure cloned successfully',
        };
      }
    } catch (error: any) {
      console.error(`Error cloning index ${sourceIndex}:`, error.message);
      throw new Error(`Failed to clone index: ${error.message}`);
    }
  }

  /**
   * Async reindex with proper configuration to prevent Elasticsearch crashes
   * Uses very conservative settings to avoid overwhelming ES
   */
  async reindexAsync(sourceIndex: string, destIndex: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/_reindex?wait_for_completion=false&requests_per_second=500&slices=auto`,
        {
          conflicts: 'proceed', // Continue on conflicts instead of aborting
          source: {
            index: sourceIndex,
            size: 500, // Reduced to 500 documents per batch for stability
          },
          dest: {
            index: destIndex,
            op_type: 'create', // Only create new documents, skip if exists
          },
        },
        {
          timeout: 60000, // 60 second HTTP timeout for the request itself
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Async reindex started:', JSON.stringify(response.data, null, 2));

      return {
        task: response.data.task,
        started: true,
      };
    } catch (error: any) {
      console.error(`Error starting async reindex from ${sourceIndex} to ${destIndex}:`, error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.reason || error.message;
      throw new Error(errorMsg);
    }
  }

  /**
   * Finalize cloned index after reindex completes
   * Restores normal settings and optimizes the index
   */
  async finalizeClonedIndex(indexName: string): Promise<boolean> {
    try {
      // Restore optimal settings after cloning
      await axios.put(`${this.baseUrl}/${indexName}/_settings`, {
        index: {
          refresh_interval: '1s', // Restore normal refresh interval
          number_of_replicas: 1, // Restore replicas
          'translog.durability': 'request', // Restore default durability
          'translog.sync_interval': '5s', // Restore default sync interval
        },
      });

      // Force a refresh to make all documents searchable
      await axios.post(`${this.baseUrl}/${indexName}/_refresh`);
      
      // Force merge to optimize the index (combines segments)
      try {
        await axios.post(`${this.baseUrl}/${indexName}/_forcemerge?max_num_segments=1`, {}, {
          timeout: 300000, // 5 minute timeout for force merge
        });
      } catch (mergeError) {
        console.warn(`Force merge failed for ${indexName}, but index is functional:`, mergeError);
      }

      console.log(`Finalized cloned index: ${indexName}`);
      return true;
    } catch (error: any) {
      console.error(`Error finalizing cloned index ${indexName}:`, error.message);
      throw new Error(`Failed to finalize cloned index: ${error.message}`);
    }
  }

  /**
   * Create index from template
   */
  async createIndexFromTemplate(indexName: string, templateSettings: any): Promise<boolean> {
    try {
      await axios.put(`${this.baseUrl}/${indexName}`, templateSettings);
      return true;
    } catch (error: any) {
      console.error(`Error creating index from template:`, error.message);
      throw new Error(`Failed to create index from template: ${error.message}`);
    }
  }
}

export const elasticsearchService = new ElasticsearchService();
