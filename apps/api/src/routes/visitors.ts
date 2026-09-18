import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { uploadToR2 } from "../lib/r2.js";
import { sendVisitorRequestTemplate } from "../lib/whatsapp.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

router.post("/", upload.single("selfie"), async (req, res) => {
    try {
        const { visitorName, flatId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: "Selfie is required",
            });
        }

        const photoKey = `visitors/${new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "/")}/${crypto.randomUUID()}.jpg`;

        await uploadToR2(
            photoKey,
            req.file.buffer,
            req.file.mimetype,
        );

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
                photoKey,
            },
        });

        try {
            await sendVisitorRequestTemplate({
                to: flat.phone,
                visitorName,
                flatNumber: flat.unitNumber,
                visitorLogId: visitor.id,
            });

            console.log(
                `WhatsApp visitor request sent for VisitorLog ${visitor.id}`,
            );
        } catch (error) {
            console.error(
                `Failed to send WhatsApp visitor request for VisitorLog ${visitor.id}:`,
                error,
            );
        }

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