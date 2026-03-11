import express from "express";
import type { Express } from "express";
import fs from "fs";
import path from "path";
export function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}
export function serveStatic(app: Express) {
  // Use a more robust way to resolve paths that works both in development (tsx) and production (bundled)
  // distPath is the directory containing index.html and assets/
  // In production (dist/index.mjs), __dirname is 'dist/'
  // In development (server/index.ts), __dirname is 'server/'
  const isBundled = __dirname.endsWith('dist') || fs.existsSync(path.join(__dirname, 'index.html'));
  const distPath = isBundled ? __dirname : path.resolve(__dirname, "..", "dist");
  const publicPath = isBundled ? path.resolve(__dirname, "..", "public") : path.resolve(__dirname, "..", "public");

  log(`[PROD] Initializing static file serving...`);
  log(`[PROD] cwd: ${process.cwd()}`);
  log(`[PROD] __dirname: ${__dirname}`);
  log(`[PROD] distPath: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.warn(`⚠️ [PROD] Build directory NOT found at: ${distPath}. Make sure to build the client first.`);
  }

  // Add CORS headers for uploads directory
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // Serve static assets from dist
  app.use(express.static(distPath, {
    maxAge: '1d',
    index: false // Don't serve index.html for root, we handle SPA fallback at the end
  }));

  // Servir a pasta de uploads estaticamente
  const uploadsPath = path.resolve(publicPath, "uploads");
  if (fs.existsSync(uploadsPath)) {
    log(`[PROD] Serving uploads from: ${uploadsPath}`);
    app.use('/uploads', express.static(uploadsPath));
  } else {
    // Attempt relative to process.cwd() as fallback
    const altUploadsPath = path.resolve(process.cwd(), "public", "uploads");
    if (fs.existsSync(altUploadsPath)) {
      log(`[PROD] Serving uploads from fallback: ${altUploadsPath}`);
      app.use('/uploads', express.static(altUploadsPath));
    } else {
      console.warn(`[PROD] Uploads directory not found at: ${uploadsPath}`);
    }
  }

  // SPA Fallback Handler
  app.use((req, res, next) => {
    // CRITICAL: Skip static assets - prevent returning HTML for JS/CSS files (MIME type error)
    // Removed $ anchor to catch requests with query params and added more comprehensive extensions
    const staticExtensions = /\.(js|mjs|jsx|ts|tsx|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|ttf|eot|map|wasm|webmanifest|webp|txt|xml)/i;
    
    if (staticExtensions.test(req.path) && !req.path.startsWith('/uploads/')) {
      console.log(`❌ [PROD-STATIC-MISS] Asset NOT found: ${req.method} ${req.path}`);
      return res.status(404).set("Content-Type", "text/plain").send(`Asset not found: ${req.path}`);
    }

    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Serve index.html for all other routes (SPA navigation)
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`❌ [PROD-FATAL] index.html not found at: ${indexPath}`);
      res.status(500).send("Application shell missing. Please check the build.");
    }
  });
}
