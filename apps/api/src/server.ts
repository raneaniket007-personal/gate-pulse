import cors from "cors";
import express from "express";
import { env } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "gate-pulse-api",
        environment: env.nodeEnv,
    });
});

app.listen(env.port, () => {
    console.log(
        `GatePulse API running on http://localhost:${env.port}`,
    );
});