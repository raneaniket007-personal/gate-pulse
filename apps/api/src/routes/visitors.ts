import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const { visitorName, flatId } = req.body;

        if (!visitorName || !flatId) {
            return res.status(400).json({
                error: "visitorName and flatId are required",
            });
        }

        const flat = await prisma.flat.findUnique({
            where: {
                id: flatId,
            },
        });

        if (!flat) {
            return res.status(404).json({
                error: "Flat not found",
            });
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const visitor = await prisma.visitorLog.create({
            data: {
                societyId: flat.societyId,
                flatId: flat.id,
                visitorName: visitorName.trim(),
                status: "PENDING",
                expiresAt,
            },
        });

        return res.status(201).json({
            id: visitor.id,
            status: visitor.status,
            expiresAt: visitor.expiresAt,
        });
    } catch (error) {
        console.error("Failed to create visitor request:", error);

        return res.status(500).json({
            error: "Failed to create visitor request",
        });
    }
});

export default router;