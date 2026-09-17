import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "ok",
            service: "gate-pulse-api",
            environment: env.nodeEnv,
            database: "connected",
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(503).json({
            status: "error",
            service: "gate-pulse-api",
            environment: env.nodeEnv,
            database: "disconnected",
        });
    }
});

app.get("/api/societies", async (_req, res) => {
    try {
        const societies = await prisma.society.findMany({
            include: {
                flats: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(societies);
    } catch (error) {
        console.error("Failed to fetch societies:", error);

        res.status(500).json({
            error: "Failed to fetch societies",
        });
    }
});

app.listen(env.port, () => {
    console.log(
        `GatePulse API running on http://localhost:${env.port}`,
    );
});