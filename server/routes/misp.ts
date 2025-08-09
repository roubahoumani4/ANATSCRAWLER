import express from 'express';
import mispService from '../misp.service';

const router = express.Router();

router.get('/ping', async (_req, res) => {
  const r = await mispService.ping();
  res.json(r);
});

router.post('/search', async (req, res) => {
  try {
    const { value, type } = req.body || {};
    if (!value) return res.status(400).json({ error: 'Missing value' });
    const r = await mispService.searchAttributes(String(value), type ? String(type) : undefined);
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;


