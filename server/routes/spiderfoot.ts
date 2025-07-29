
import express from "express";
import fetch from "node-fetch";

const router = express.Router();
// Real SpiderFoot API base URL
const SPIDERFOOT_API_URL = "http://192.168.1.105:5001";


// --- SpiderFoot Native API Proxy Routes ---

// List all scans (scanlist)
router.get("/scanlist", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanlist`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan list" });
  }
});

// Get scan info (details)
router.get("/scaninfo", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing scan id" });
    const response = await fetch(`${SPIDERFOOT_API_URL}/scaninfo?id=${encodeURIComponent(id as string)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan info" });
  }
});

// Get scan results
router.get("/scanresults", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing scan id" });
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanresults?id=${encodeURIComponent(id as string)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan results" });
  }
});

// Get scan log
router.get("/scanlog", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing scan id" });
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanlog?id=${encodeURIComponent(id as string)}`);
    const data = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan log" });
  }
});

// Delete a scan
router.post("/scan/:scanId/delete", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scandelete?id=${encodeURIComponent(scanId)}`, { method: "POST" });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete scan" });
  }
});

// Clone a scan
router.post("/scan/:scanId/clone", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanclone?id=${encodeURIComponent(scanId)}`, { method: "POST" });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to clone scan" });
  }
});

// Export a scan (JSON)
router.get("/scan/:scanId/export", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanexport?id=${encodeURIComponent(scanId)}`);
    if (!response.ok) return res.status(500).json({ error: "Failed to export scan" });
    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to export scan" });
  }
});

// Abort/stop a scan
router.post("/scan/:scanId/abort", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanabort?id=${encodeURIComponent(scanId)}`, { method: "POST" });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to abort scan" });
  }
});

// (Optional) Start a new scan (if supported by SpiderFoot API)
router.post("/scan", async (req, res) => {
  try {
    const { target, modules } = req.body;
    const response = await fetch(`${SPIDERFOOT_API_URL}/startscan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, modules })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to start scan" });
  }
});

// (Optional) List available modules (if needed)
router.get("/modules", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_API_URL}/modules`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

export default router;
