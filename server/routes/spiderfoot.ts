import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spiderFootService } from '../services/spiderfoot.service';

const router = Router();

const SPIDERFOOT_HOST = process.env.SPIDERFOOT_HOST || '127.0.0.1';
const SPIDERFOOT_PORT = parseInt(process.env.SPIDERFOOT_PORT || '5001', 10);
const SPIDERFOOT_TARGET = `http://${SPIDERFOOT_HOST}:${SPIDERFOOT_PORT}`;
const DOCROOT = process.env.SPIDERFOOT_DOCROOT || '/osint';

// Health endpoint to ensure underlying service is up
router.get('/health', async (_req, res) => {
  const result = await spiderFootService.ensureStarted();
  if (!result.ok) return res.status(500).json({ ok: false, error: result.reason });
  res.json({ ok: true });
});

// Ensure SpiderFoot is running before proxying
router.use(async (req, res, next) => {
  const result = await spiderFootService.ensureStarted();
  if (!result.ok) return res.status(500).json({ ok: false, error: result.reason });
  next();
});

// Proxy everything under /osint to SpiderFoot, preserving path
router.use(
  '*',
  createProxyMiddleware({
    target: SPIDERFOOT_TARGET,
    changeOrigin: true,
    ws: true,
    secure: false,
    pathRewrite: (incomingPath) => {
      // We expose SpiderFoot under /osint but upstream expects to be at '/'
      const p = incomingPath || '/';
      if (p.startsWith(DOCROOT)) {
        const stripped = p.slice(DOCROOT.length);
        return stripped.startsWith('/') ? stripped : `/${stripped}`;
      }
      return p;
    },
  })
);

export default router;
