
import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const SPIDERFOOT_API_URL = "http://127.0.0.1:8000"; // FastAPI wrapper URL

// Delete a scan
router.post("/scan/:scanId/delete", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/delete`, { method: "POST" });
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
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/clone`, { method: "POST" });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to clone scan" });
  }
});

// Export a scan
router.get("/scan/:scanId/export", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/export`);
    if (!response.ok) return res.status(500).json({ error: "Failed to export scan" });
    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to export scan" });
  }
});

// Get scan log
router.get("/scan/:scanId/log", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/log`);
    if (!response.ok) return res.status(500).json({ error: "Failed to fetch scan log" });
    const data = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan log" });
  }
});

// Proxy for SpiderFoot scanlist (raw array, for UI compatibility)
router.get("/scanlist", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_API_URL}/scanlist`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan list" });
  }
});
// List available modules
router.get("/modules", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_API_URL}/modules`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

// Start a new scan
router.post("/scan", async (req, res) => {
  try {
    const { target, modules } = req.body;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan`, {
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

// List all scans
router.get("/scans", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_API_URL}/scans`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

// Get scan status
router.get("/scan/:scanId/status", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/status`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan status" });
  }
});

// Get scan results
router.get("/scan/:scanId/results", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/results`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan results" });
  }
});


// Stop/abort a scan
router.post("/scan/:scanId/abort", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_API_URL}/scan/${scanId}/abort`, {
      method: "POST"
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to abort scan" });
  }
});

export default router;
