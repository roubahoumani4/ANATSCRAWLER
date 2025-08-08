import express from "express";
const router = express.Router();
const spiderfoot = require("../spiderfoot.service");

// Test endpoint to debug SpiderFoot integration
router.get("/test", async (req, res) => {
  try {
    console.log("[SpiderFoot] Testing integration...");
    
    // Test 1: Check if Python wrapper is accessible
    const { spawn } = require('child_process');
    const path = require('path');
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
    const info = await spiderfoot.scanInfo(req.params.scanId);
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

// Scan logs
router.get("/scan/:scanId/logs", async (req, res) => {
  try {
    const logs = await spiderfoot.scanLogs(req.params.scanId);
    res.json(logs);
  } catch (e) {
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

// --- Exports ---
export default router;
