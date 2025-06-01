import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = (bodyJson, ...args) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson, ...args);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
      }
    });

    next();
  });

  // Register routes
  await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    // Optional: log error here
    log(`Error: ${message}`);

    // Don't throw err here to avoid crashing server
  });

  // Setup Vite or serve static depending on environment
  if (app.get("env") === "development") {
    // Vite dev server for frontend + HMR
    await setupVite(app, app);
  } else {
    // Serve built static files in production
    serveStatic(app);
  }

  // Use environment PORT if set (Vercel sets process.env.PORT)
  const port = process.env.PORT ? Number(process.env.PORT) : 5000;

  app.listen(port, () => {
    log(`Server is running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});