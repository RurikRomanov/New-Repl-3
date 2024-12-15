import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, blocks, rewards } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Auth verification
  app.post("/api/auth/verify", async (req, res) => {
    const { initData } = req.body;
    // Verify Telegram init data here
    const user = {
      id: req.body.id,
      username: req.body.username
    };
    
    await db.insert(users).values({
      telegramId: user.id.toString(),
      username: user.username,
    }).onConflictDoNothing();

    res.json({ success: true });
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
        difficulty: 4, // Adjust based on network
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

  return httpServer;
}
