import "dotenv/config";
import express, { type Express } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { stripeWebhookHandler } from "../stripeWebhook";
import { securityHeaders } from "./securityHeaders";
import { JSON_BODY_LIMIT, payloadTooLargeHandler, URL_ENCODED_BODY_LIMIT } from "./requestLimits";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const app = express();
export { app };

export function configureApi(targetApp: Express = app) {
  targetApp.disable("x-powered-by");
  targetApp.use(securityHeaders);
  // Stripe requires the raw request body for signature verification.
  targetApp.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
  // Base64 uploads have dedicated schema limits; this parser limit keeps room
  // for the largest allowed accounting document without accepting 50 MiB.
  targetApp.use(express.json({ limit: JSON_BODY_LIMIT }));
  targetApp.use(express.urlencoded({ limit: URL_ENCODED_BODY_LIMIT, extended: true }));
  // OAuth callback under /api/oauth/callback.
  registerOAuthRoutes(targetApp);
  // tRPC API.
  targetApp.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  targetApp.use(payloadTooLargeHandler);
}

export async function startProductionServer() {
  const server = createServer(app);
  configureApi(app);
  serveStatic(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  startProductionServer().catch(console.error);
}
