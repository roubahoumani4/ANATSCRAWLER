// Define missing module declarations
declare module 'xss-clean';
declare module 'express-mongo-sanitize';

// Generic OSINT scan response types (placeholder for future engine integration)
export interface OsintScanInfo {
  id?: string;
  name?: string;
  status?: 'RUNNING' | 'FINISHED' | 'ABORTED' | 'ERRORED' | 'PENDING' | 'STARTING';
  startDate?: string;
  endDate?: string;
  target?: string;
  type?: string;
  template?: string;
  description?: string;
  seed?: string;
  [key: string]: any; // Allow additional properties
}

export interface OsintScanResult {
  [key: string]: any;
}

export interface OsintCorrelationData {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  INFO: number;
}

export interface OsintLogEntry {
  generated?: string;
  component?: string;
  type?: string;
  message?: string;
  [key: string]: any;
}

export interface OsintLogsResponse {
  logs: OsintLogEntry[];
  count: number;
  scan_id: string;
  error?: string;
}

export interface OsintBrowseEntry {
  value: string;
  type: string;
  last_seen: string;
  module: string;
  count: number;
}

export interface OsintBrowseResponse {
  browse: OsintBrowseEntry[];
  count: number;
  scan_id: string;
  error?: string;
}