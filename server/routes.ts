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
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<string, Client>();

  // WebSocket upgrade handling
  httpServer.on("upgrade", (request, socket, head) => {
    // Skip Vite HMR requests
    if (request.headers["sec-websocket-protocol"] === "vite-hmr") {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "register" && data.minerId) {
          clients.set(data.minerId, { ws, minerId: data.minerId });
          broadcastMiners();
        }
      } catch (error) {
        log("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      for (const [id, client] of clients) {
        if (client.ws === ws) {
          clients.delete(id);
          broadcastMiners();
          break;
        }
      }
    });
  });

  function broadcastMiners() {
    const message = JSON.stringify({
      type: "onlineMiners",
      count: clients.size
    });

    for (const client of clients.values()) {
      client.ws.send(message);
    }
  }

  // Auth verification
  app.post("/api/auth/verify", async (req, res) => {
    const { initData } = req.body;
    try {
      const data = JSON.parse(initData);
      const user = data.user;
      
      if (!user || !user.id) {
        return res.status(400).json({ error: "Invalid user data" });
      }

      await db.insert(users).values({
        telegramId: user.id.toString(),
        username: user.username || `user${user.id}`,
      }).onConflictDoNothing();

      res.json({ success: true, user });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(400).json({ error: "Invalid init data" });
    }
  });

  // Get current mining block
  app.get("/api/blocks/current", async (req, res) => {
    const currentBlock = await db.query.blocks.findFirst({
      where: eq(blocks.status, "mining"),
      orderBy: desc(blocks.createdAt)
    });

    if (!currentBlock) {
      // Create new block
      const newBlock = {
        hash: crypto.randomBytes(32).toString('hex'),
        difficulty: 6,
        status: "mining"
      };
      
      const [block] = await db.insert(blocks)
        .values(newBlock)
        .returning();

      res.json(block);
    } else {
      res.json(currentBlock);
    }
  });

  // Submit mining solution
  app.post("/api/blocks/solution", async (req, res) => {
    const { blockId, nonce, minerId } = req.body;
    
    const block = await db.query.blocks.findFirst({
      where: eq(blocks.id, blockId)
    });

    if (!block || block.status === "completed") {
      return res.status(400).json({ error: "Invalid block" });
    }

    // Verify solution
    const hash = crypto.createHash('sha256')
      .update(block.hash + nonce)
      .digest('hex');

    const isValid = hash.startsWith("0".repeat(block.difficulty));

    if (isValid) {
      // Update block
      await db.update(blocks)
        .set({ 
          status: "completed",
          nonce,
          minedBy: minerId,
          completedAt: new Date()
        })
        .where(eq(blocks.id, blockId));

      // Distribute rewards
      const totalReward = 100;
      const minerReward = Math.floor(totalReward * 0.6);
      const participantReward = Math.floor(totalReward * 0.4);

      // Miner reward
      await db.insert(rewards).values({
        blockId,
        userId: minerId,
        amount: minerReward,
        type: "miner"
      });

      // Distribute participant rewards
      const activeUsers = await db.query.users.findMany();
      const otherUsers = activeUsers.filter(u => u.telegramId !== minerId);
      
      const perUserReward = Math.floor(participantReward / otherUsers.length);
      
      for (const user of otherUsers) {
        await db.insert(rewards).values({
          blockId,
          userId: user.telegramId,
          amount: perUserReward,
          type: "participant"
        });
      }

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid solution" });
    }
  });

  // Get leaderboard
  app.get("/api/stats/leaderboard", async (req, res) => {
    const leaderboard = await db.query.users.findMany({
      orderBy: desc(users.totalRewards),
      limit: 10
    });
    res.json(leaderboard);
  });

  // Get block rewards
  app.get("/api/blocks/:id/rewards", async (req, res) => {
    try {
      const blockRewards = await db.query.rewards.findMany({
        where: eq(rewards.blockId, parseInt(req.params.id))
      });
      res.json(blockRewards);
    } catch (error) {
      console.error('Failed to fetch block rewards:', error);
      res.status(500).json({ error: "Failed to fetch block rewards" });
    }
  });

  // Get block history
  app.get("/api/blocks/history", async (req, res) => {
    try {
      const history = await db.query.blocks.findMany({
        orderBy: desc(blocks.id),
        limit: 10,
        where: eq(blocks.status, "completed")
      });
      res.json(history);
    } catch (error) {
      console.error('Failed to fetch block history:', error);
      res.status(500).json({ error: "Failed to fetch block history" });
    }
  });

  // Get user stats
  app.get("/api/stats/user/:id", async (req, res) => {
    const user = await db.query.users.findFirst({
      where: eq(users.telegramId, req.params.id)
    });
    
    const userRewards = await db.query.rewards.findMany({
      where: eq(rewards.userId, req.params.id)
    });

    res.json({
      user,
      rewards: userRewards
    });
  });

  // Update user energy
  app.post("/api/users/:id/energy", async (req, res) => {
    const { id } = req.params;
    const { energy } = req.body;

    if (typeof energy !== 'number' || energy < 0 || energy > 100) {
      return res.status(400).json({ error: "Invalid energy value" });
    }

    try {
      await db.update(users)
        .set({ energy })
        .where(eq(users.telegramId, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to update energy:', error);
      res.status(500).json({ error: "Failed to update energy" });
    }
  });

  return httpServer;
}
