import { createServer as createViteServer } from "vite";
import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  console.log('[VITE] Creating Vite server...');

  const vitePromise = createViteServer({
    root: process.cwd(),
    server: {
      middlewareMode: true,
      hmr: {
        server: server,
        timeout: 120000,
      },
      allowedHosts: true,
    },
    appType: "spa",
    clearScreen: false,
    logLevel: 'info',
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Vite server creation timed out after 30 seconds')), 30000);
  });

  const vite = await (Promise.race([vitePromise, timeoutPromise]) as Promise<any>);
  console.log('[VITE] Vite server created successfully');

  app.use(vite.middlewares);

  // SPA Fallback Handler
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    if (url.startsWith("/api/")) {
      return next();
    }

    try {
      // Improved static asset guard to prevent MIME errors in development
      const staticExtensions = /\.(js|mjs|jsx|ts|tsx|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|ttf|eot|map|wasm|webmanifest|webp|txt|xml)/i;
      
      if (staticExtensions.test(req.path)) {
        console.log(`❌ [VITE-STATIC-MISS] Asset NOT found: ${req.method} ${req.path}`);
        return res.status(404).set("Content-Type", "text/plain").send(`Asset not found: ${req.path}`);
      }

      console.log(`🌐 [VITE-SPA-FALLBACK] Serving index.html for navigation route: ${req.method} ${url}`);

      const indexPath = path.resolve(process.cwd(), "index.html");
      if (!fs.existsSync(indexPath)) {
        return next();
      }

      let template = fs.readFileSync(indexPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      
      const headers: Record<string, string> = {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      };

      const isReplit = process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN;
      if (isReplit) {
        headers["Content-Security-Policy"] = "frame-ancestors 'self' *.replit.com *.replit.dev *.repl.co *.picard.replit.dev replit.com replit.dev";
      }

      res.status(200).set(headers).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use robust dist path
  const isBundled = __dirname.endsWith('dist') || fs.existsSync(path.join(__dirname, 'index.html'));
  const distPath = isBundled ? __dirname : path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    console.warn(`⚠️ [STATIC] Build directory NOT found: ${distPath}`);
  }

  app.use(express.static(distPath, { index: false }));

  app.use((req, res, next) => {
    const staticExtensions = /\.(js|mjs|jsx|ts|tsx|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|ttf|eot|map|wasm|webmanifest|webp|txt|xml)/i;
    
    if (staticExtensions.test(req.path)) {
       console.log(`❌ [STATIC-MISS] Asset NOT found in dist: ${req.method} ${req.path}`);
       return res.status(404).set("Content-Type", "text/plain").send(`Asset not found: ${req.path}`);
    }
    
    if (req.path.startsWith('/api/')) return next();
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}
