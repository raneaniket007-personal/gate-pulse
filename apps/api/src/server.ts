import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import visitorsRouter from "./routes/visitors.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import webhooksRouter from "./routes/webhooks.js";
import { initializeSocket } from "./lib/socket.js";

const app = express();

app.use(
    cors({
        origin: env.webAppUrl,
    }),
);
app.use(express.json());
app.use("/api/visitors", visitorsRouter);
app.use("/api/webhooks", webhooksRouter);

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

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: env.webAppUrl,
    },
});

initializeSocket(io);

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on(
        "join-visitor-room",
        ({ visitorLogId }: { visitorLogId: string }) => {
            if (!visitorLogId) {
                return;
            }

            const roomName = `visitor:${visitorLogId}`;

            socket.join(roomName);

            console.log(
                `Socket ${socket.id} joined visitor room ${roomName}`,
            );
        },
    );

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

httpServer.listen(env.port, "0.0.0.0", () => {
    console.log(
        `GatePulse API running on port ${env.port}`,
    );
});