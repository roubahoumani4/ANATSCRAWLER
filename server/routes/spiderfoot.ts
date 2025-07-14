
import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const SPIDERFOOT_API_URL = "http://127.0.0.1:8000"; // FastAPI wrapper URL

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

// (Optional) Delete/cancel scan
// Not implemented in FastAPI wrapper yet
router.delete("/scan/:scanId", async (req, res) => {
  res.status(501).json({ error: "Delete scan not implemented" });
});

export default router;
