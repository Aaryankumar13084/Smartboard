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

  const httpServer = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    log(`Error: ${message}`);
  });

  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 5000;

  httpServer.listen(port, "0.0.0.0", () => {
    log(`Server is running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});