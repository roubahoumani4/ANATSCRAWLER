import express from "express";
const router = express.Router();
const spiderfoot = require("../spiderfoot.service");
const path = require('path');
import mispService from '../misp.service';

// Health check endpoint for SpiderFoot
router.get("/health", async (req, res) => {
  try {
    let wrapperOk = false;
    let modulesCount = 0;
    let modulesError: string | undefined;
    try {
      const mods = await spiderfoot.listModules();
      if (mods && Array.isArray(mods.modules)) {
        wrapperOk = true;
        modulesCount = mods.modules.length;
      }
    } catch (e: any) {
      modulesError = e?.message || String(e);
    }

    res.json({
      status: "SpiderFoot API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      wrapperPath: path.resolve(__dirname, '../spiderfoot/spiderfoot_wrapper.py'),
      wrapperReachable: wrapperOk,
      modulesCount,
      modulesError
    });
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Event count (debug/heartbeat)
router.get("/scan/:scanId/eventcount", async (req, res) => {
  try {
    const result = await spiderfoot.scanEventCount(req.params.scanId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Last log timestamp (debug/heartbeat)
router.get("/scan/:scanId/lastlog", async (req, res) => {
  try {
    res.json(await spiderfoot.scanLastLogTime(req.params.scanId));
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Test endpoint to debug SpiderFoot integration
router.get("/test", async (req, res) => {
  try {
    console.log("[SpiderFoot] Testing integration...");
    
    // Test 1: Check if Python wrapper is accessible
    const { spawn } = require('child_process');
    const wrapperPath = path.resolve(__dirname, '../spiderfoot/spiderfoot_wrapper.py');
    
    console.log("[SpiderFoot] Wrapper path:", wrapperPath);
    console.log("[SpiderFoot] Current directory:", process.cwd());
    
    // Test 2: Try to list modules
    let modulesResult;
    try {
      modulesResult = await spiderfoot.listModules();
      console.log("[SpiderFoot] Modules result:", modulesResult);
    } catch (e) {
      console.error("[SpiderFoot] Modules error:", e);
      modulesResult = { error: e instanceof Error ? e.message : String(e) };
    }
    
    // Test 3: Try to list scans
    let scansResult;
    try {
      scansResult = await spiderfoot.listScans();
      console.log("[SpiderFoot] Scans result:", scansResult);
    } catch (e) {
      console.error("[SpiderFoot] Scans error:", e);
      scansResult = { error: e instanceof Error ? e.message : String(e) };
    }
    
    // Test 4: Test Python environment
    let envResult;
    try {
      envResult = await spiderfoot.testEnvironment();
      console.log("[SpiderFoot] Environment test result:", envResult);
    } catch (e) {
      console.error("[SpiderFoot] Environment test error:", e);
      envResult = { error: e instanceof Error ? e.message : String(e) };
    }
    
    res.json({
      status: "SpiderFoot test completed",
      wrapperPath,
      currentDirectory: process.cwd(),
      modules: modulesResult,
      scans: scansResult,
      environment: envResult,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  } catch (e) {
    console.error("[SpiderFoot] Test error:", e);
    res.status(500).json({ 
      error: (e instanceof Error ? e.message : String(e)),
      stack: e instanceof Error ? e.stack : undefined
    });
  }
});

// Abort scan
router.post("/scan/:scanId/abort", async (req, res) => {
  try {
    const result = await spiderfoot.abortScan(req.params.scanId);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// List available modules
router.get("/modules", async (req, res) => {
  try {
    const modules = await spiderfoot.listModules();
    res.json(modules);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// List all scans (scanlist)
router.get("/scanlist", async (req, res) => {
  try {
    console.log("[SpiderFoot] Fetching scan list...");
    const scans = await spiderfoot.listScans();
    console.log("[SpiderFoot] Scan list result:", scans);
    res.json(scans);
  } catch (e) {
    console.error("[SpiderFoot] Scan list error:", e);
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Proxy route for /osint-engine/scans to support legacy frontend
router.get("/osint-engine/scans", async (req, res) => {
  try {
    console.log("[SpiderFoot] Legacy scans endpoint called...");
    const scans = await spiderfoot.listScans();
    console.log("[SpiderFoot] Legacy scans result:", scans);
    res.json(scans);
  } catch (e) {
    console.error("[SpiderFoot] Legacy scans error:", e);
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Get scan info (details)
router.get("/scan/:scanId/status", async (req, res) => {
  try {
    const raw = await spiderfoot.scanInfo(req.params.scanId);
    // Normalize scan info into an object for the UI
    // Expected raw array: [name, target, created, started, ended, status]
    let info: any = raw;
    if (Array.isArray(raw)) {
      info = {
        name: raw[0] ?? req.params.scanId,
        target: raw[1] ?? '',
        created: raw[2] ?? 0,
        started: raw[3] ?? 0,
        ended: raw[4] ?? 0,
        status: raw[5] ?? 'UNKNOWN'
      };
    }
    // Ensure compatibility with UI which expects `finished`
    if (info && typeof info === 'object') {
      const endedVal = (info.ended ?? info.finished ?? 0);
      info.finished = endedVal;
    }
    res.json(info);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});


// Scan graph (event relationships)
router.get("/scan/:scanId/graph", async (req, res) => {
  try {
    const graph = await spiderfoot.scanGraph(req.params.scanId);
    res.json(graph);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan browse (unique entities)
router.get("/scan/:scanId/browse", async (req, res) => {
  try {
    const browse = await spiderfoot.scanBrowse(req.params.scanId);
    res.json(browse);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan result summary
router.get("/scan/:scanId/summary", async (req, res) => {
  try {
    const summary = await spiderfoot.scanResultSummary(req.params.scanId);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan correlation summary
router.get("/scan/:scanId/correlationsummary", async (req, res) => {
  try {
    const summary = await spiderfoot.scanCorrelationSummary(req.params.scanId);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan correlation list
router.get("/scan/:scanId/correlationlist", async (req, res) => {
  try {
    const list = await spiderfoot.scanCorrelationList(req.params.scanId);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan result event
router.get("/scan/:scanId/events", async (req, res) => {
  try {
    const events = await spiderfoot.scanResultEvent(req.params.scanId);
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// MISP enrichment for a scan (read-only)
router.get("/scan/:scanId/enrich/misp", async (req, res) => {
  try {
    const scanId = req.params.scanId;
    // Use browse for unique entities
    const browse = await spiderfoot.scanBrowse(scanId).catch(() => []);
    const events = await spiderfoot.scanResultEvent(scanId).catch(() => []);
    // Derive IOC candidates: domain, hostname, ip, email, hash, url
    const iocs = new Set<string>();
    const pushIf = (v: any) => { if (typeof v === 'string' && v.length > 2) iocs.add(v); };
    (Array.isArray(browse) ? browse : []).forEach((row: any[]) => {
      const value = row?.[0];
      const type = String(row?.[1] || '').toLowerCase();
      if (['domain', 'internet_name', 'hostname', 'ip_address', 'emailaddr', 'hash', 'url', 'website'].includes(type)) pushIf(value);
    });
    (Array.isArray(events) ? events : []).forEach((row: any[]) => {
      const value = row?.[1];
      const type = String(row?.[4] || '').toLowerCase();
      if (['domain', 'internet_name', 'hostname', 'ip_address', 'emailaddr', 'hash', 'url', 'website'].includes(type)) pushIf(value);
    });

    const results: Record<string, any> = {};
    await Promise.all(Array.from(iocs).slice(0, 200).map(async (ioc) => {
      try {
        // naive type inference
        let t: string | undefined = undefined;
        if (/^\d+\.\d+\.\d+\.\d+$/.test(ioc)) t = 'ip-src';
        else if (/^[0-9a-f]{32}|[0-9a-f]{40}|[0-9a-f]{64}$/i.test(ioc)) t = undefined; // let MISP infer
        else if (/^https?:\/\//i.test(ioc)) t = 'url';
        else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ioc)) t = 'email-src';
        else if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(ioc)) t = 'domain';
        const r = await mispService.searchAttributes(ioc, t);
        results[ioc] = r;
      } catch (e: any) {
        results[ioc] = { success: false, error: e?.message || String(e) };
      }
    }));

    res.json({ success: true, scanId, matches: results });
  } catch (e) {
    res.status(500).json({ success: false, error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan logs
router.get("/scan/:scanId/logs", async (req, res) => {
  try {
    const logs = await spiderfoot.scanLogs(req.params.scanId);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Scan results (comprehensive endpoint for frontend real-time updates)
router.get("/scan/:scanId/results", async (req, res) => {
  try {
    const scanId = req.params.scanId;
    console.log(`[SpiderFoot] Fetching comprehensive results for scan ${scanId}`);
    
    // Fetch all scan data in parallel
    const [status, summary, correlations, browse, events, logs] = await Promise.all([
      spiderfoot.scanInfo(scanId).catch(() => null),
      spiderfoot.scanResultSummary(scanId).catch(() => []),
      spiderfoot.scanCorrelationSummary(scanId).catch(() => []),
      spiderfoot.scanBrowse(scanId).catch(() => []),
      spiderfoot.scanResultEvent(scanId).catch(() => []),
      spiderfoot.scanLogs(scanId).catch(() => [])
    ]);

    // Format the response for frontend consumption
    const results: {
      scan_id: string;
      status: string;
      name?: string;
      target?: string;
      created?: number;
      started?: number;
      ended?: number;
      summary: any;
      correlations: any;
      browse: any;
      events: any;
      logs: any;
      elements: any;
      correlation_counts: {
        HIGH: number;
        MEDIUM: number;
        LOW: number;
        INFO: number;
      };
    } = {
      scan_id: scanId,
      status: 'UNKNOWN',
      summary: summary || [],
      correlations: correlations || [],
      browse: browse || [],
      events: events || [],
      logs: logs || [],
      elements: events?.length || 0,
      // Add correlation counts for easy access
      correlation_counts: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        INFO: 0
      }
    };

    // Parse scan status from the scan info
    if (status && Array.isArray(status) && status.length >= 6) {
      results.status = status[5] || 'UNKNOWN'; // status is at index 5
      results.name = status[0] || scanId; // name is at index 0
      results.target = status[1] || ''; // target is at index 1
      results.created = status[2] || 0; // created timestamp is at index 2
      results.started = status[3] || 0; // started timestamp is at index 3
      results.ended = status[4] || 0; // ended timestamp is at index 4
    } else if (status && typeof status === 'object') {
      // Handle case where status might be an object
      results.status = status.status || status[5] || 'UNKNOWN';
      results.name = status.name || status[0] || scanId;
      results.target = status.target || status[1] || '';
      results.created = status.created || status[2] || 0;
      results.started = status.started || status[3] || 0;
      results.ended = status.ended || status[4] || 0;
    }

    // Ensure compatibility with UI: expose `finished` mirror of `ended`
    (results as any).finished = results.ended || 0;

    // Calculate correlation counts
    if (Array.isArray(correlations)) {
      correlations.forEach(corr => {
        if (Array.isArray(corr) && corr.length >= 2) {
          const risk = corr[0]?.toUpperCase();
          const count = parseInt(corr[1]) || 0;
          if (risk && risk in results.correlation_counts) {
            results.correlation_counts[risk as keyof typeof results.correlation_counts] = count;
          }
        }
      });
    }

    console.log(`[SpiderFoot] Returning comprehensive results for scan ${scanId}:`, {
      status: results.status,
      elements: results.elements,
      correlations: results.correlation_counts
    });

    res.json(results);
  } catch (e) {
    console.error(`[SpiderFoot] Error fetching results for scan ${req.params.scanId}:`, e);
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Delete scan
router.post("/scan/:scanId/delete", async (req, res) => {
  try {
    const result = await spiderfoot.deleteScan(req.params.scanId);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Start new scan
router.post("/scan/start", async (req, res) => {
  const { target, name } = req.body;
  if (!target || !name) {
    return res.status(400).json({ error: "Missing target or name" });
  }
  try {
    // Start scan and get scanId only, do not wait for scan to finish
    const result = await spiderfoot.startScan(target, name);
    if (result && result.scanId) {
      // Return scanId immediately, frontend should poll for status/results
      res.json({ scanId: result.scanId, success: true });
    } else {
      res.status(500).json({ error: "Failed to start scan", details: result });
    }
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// Start minimal (fast baseline) scan
router.post("/scan/start-minimal", async (req, res) => {
  const { target, name } = req.body;
  if (!target || !name) {
    return res.status(400).json({ error: "Missing target or name" });
  }
  try {
    const result = await spiderfoot.startScanMinimal(target, name);
    if (result && result.scanId) {
      res.json({ scanId: result.scanId, success: true });
    } else {
      res.status(500).json({ error: "Failed to start minimal scan", details: result });
    }
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

// --- Exports ---
export default router;
