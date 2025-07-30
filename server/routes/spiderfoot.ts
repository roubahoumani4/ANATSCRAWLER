import express from "express";
const router = express.Router();
const spiderfoot = require("../spiderfoot.service");

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
    const scans = await spiderfoot.listScans();
    res.json(scans);
  } catch (e) {
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

// Start new scan
router.post("/scan/start", async (req, res) => {
  const { target, name } = req.body;
  if (!target || !name) {
    return res.status(400).json({ error: "Missing target or name" });
  }
  try {
    const result = await spiderfoot.startScan(target, name);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e instanceof Error ? e.message : String(e)) });
  }
});

export default router;
