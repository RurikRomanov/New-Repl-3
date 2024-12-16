
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

  // WebSocket upgrade handling
  httpServer.on("upgrade", (request, socket, head) => {
    try {
      // Skip Vite HMR requests
      if (request.headers["sec-websocket-protocol"] === "vite-hmr") {
        return;
      }

      // Handle WebSocket connections
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    log(`New WebSocket connection from ${req.socket.remoteAddress}`);
    
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "register" && data.minerId) {
          const now = new Date();
          const client: Client = { 
            ws, 
            minerId: data.minerId,
            connectedAt: now,
            lastActive: now
          };
          clients.set(data.minerId, client);
          log(`Miner registered: ${data.minerId}`);
          broadcastMiners();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`WebSocket message error: ${errorMessage}`);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on("error", (error) => {
      log(`WebSocket error: ${error.message}`);
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
    
    // Уведомляем всех о новом пире для WebRTC
    const minerIds = Array.from(clients.keys());
    for (const client of clients.values()) {
      minerIds.forEach(peerId => {
        if (peerId !== client.minerId) {
          client.ws.send(JSON.stringify({
            type: 'peer-joined',
            peerId
          }));
        }
      });
    }
  }

  // Обработка WebRTC сигналов
  app.post("/api/signal", (req, res) => {
    const { type, from, to, offer, answer, candidate } = req.body;
    const targetClient = clients.get(to);
    
    if (!targetClient) {
      return res.status(404).json({ error: "Peer not found" });
    }
    
    targetClient.ws.send(JSON.stringify({ type, from, offer, answer, candidate }));
    res.json({ success: true });
  });

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

      // Calculate dynamic block reward based on difficulty and time
      const miningDuration = new Date().getTime() - new Date(block.createdAt).getTime();
      const difficultyMultiplier = Math.pow(2, block.difficulty - 1);
      const baseReward = 100;
      
      // Reward increases with difficulty but decreases if mining took too long
      const totalReward = Math.floor(
        baseReward * difficultyMultiplier * 
        Math.max(0.5, Math.min(2, 300000 / miningDuration)) // 5 minutes optimal time
      );

      // Calculate active miners bonus
      const activeMiners = Array.from(clients.values()).length;
      const networkBonus = Math.min(2, 1 + (activeMiners - 1) * 0.1); // Up to 2x bonus for 10+ miners

      // Adjusted rewards with network bonus
      const adjustedReward = Math.floor(totalReward * networkBonus);
      
      // Progressive reward distribution
      // Miner gets 40-70% based on network size
      const minerShare = Math.max(0.4, Math.min(0.7, 0.7 - (activeMiners - 1) * 0.03));
      const minerReward = Math.floor(adjustedReward * minerShare);
      
      // Rest is distributed among participants based on their online time
      const participantReward = adjustedReward - minerReward;

      // Miner reward
      await db.insert(rewards).values({
        blockId,
        userId: minerId,
        amount: minerReward,
        type: "miner"
      });

      // Get online time statistics for fair distribution
      const onlineUsers = Array.from(clients.values())
        .filter(client => client.minerId !== minerId);
      
      if (onlineUsers.length > 0) {
        const perUserReward = Math.floor(participantReward / onlineUsers.length);
        
        // Distribute rewards to active participants
        for (const user of onlineUsers) {
          await db.insert(rewards).values({
            blockId,
            userId: user.minerId,
            amount: perUserReward,
            type: "participant"
          });
        }
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
