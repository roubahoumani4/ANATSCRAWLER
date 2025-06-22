import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
      watch: {
        usePolling: true,
        interval: 100
      }
    },
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use(vite.middlewares);

  app.use("*", async (req: express.Request, res: express.Response, next) => {
    const url = req.originalUrl;

    if (url.startsWith('/api')) {
      return next();
    }

    try {
      console.log(`[Vite] Handling request for: ${url}`);

      // Read index.html
      const template = await fs.promises.readFile(
        path.resolve(process.cwd(), 'client/index.html'),
        'utf-8'
      );

      // Apply Vite HTML transforms
      const html = await vite.transformIndexHtml(url, template);

      console.log(`[Vite] Sending transformed HTML for: ${url}`);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      console.error(`[Vite] Error processing ${url}:`, e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const distPath = path.resolve(process.cwd(), "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
