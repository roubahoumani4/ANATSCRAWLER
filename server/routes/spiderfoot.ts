import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const SPIDERFOOT_URL = "http://127.0.0.1:5001";
const SPIDERFOOT_API_KEY = process.env.SPIDERFOOT_API_KEY || "your_api_key_here";

// List available modules
router.get("/modules", async (req, res) => {
  try {
    const response = await fetch(`${SPIDERFOOT_URL}/api/modules/list`, {
      headers: {
        "X-API-KEY": SPIDERFOOT_API_KEY
      }
    });
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
    const response = await fetch(`${SPIDERFOOT_URL}/api/scan/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": SPIDERFOOT_API_KEY
      },
      body: JSON.stringify({
        scan_target: target,
        modules: modules || [],
        scan_type: "sfp__default"
      })
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
    const response = await fetch(`${SPIDERFOOT_URL}/api/scan/list`, {
      headers: {
        "X-API-KEY": SPIDERFOOT_API_KEY
      }
    });
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
    const response = await fetch(`${SPIDERFOOT_URL}/api/scan/${scanId}/status`, {
      headers: {
        "X-API-KEY": SPIDERFOOT_API_KEY
      }
    });
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
    const response = await fetch(`${SPIDERFOOT_URL}/api/scan/${scanId}/data`, {
      headers: {
        "X-API-KEY": SPIDERFOOT_API_KEY
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan results" });
  }
});

// (Optional) Delete/cancel scan
router.delete("/scan/:scanId", async (req, res) => {
  try {
    const { scanId } = req.params;
    const response = await fetch(`${SPIDERFOOT_URL}/api/scan/${scanId}/delete`, {
      method: "POST",
      headers: {
        "X-API-KEY": SPIDERFOOT_API_KEY
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete scan" });
  }
});

export default router;
