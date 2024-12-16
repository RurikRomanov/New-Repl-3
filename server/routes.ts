
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { db } from "@db";
import { users, blocks, rewards } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { log } from "./vite";

interface Client {
  ws: WebSocket;
  minerId: string;
  connectedAt: Date;
  lastActive: Date;
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<string, Client>();

  app.get('/api/miners/active', (req, res) => {
    const activeMiners = Array.from(clients.keys());
    res.json(activeMiners);
  });

  // Rest of your existing routes code...
  
  return httpServer;
}
