import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { uploadToR2 } from "../lib/r2.js";
import {
    sendVisitorRequestTemplate,
    sendWhatsAppImage,
} from "../lib/whatsapp.js";
import { createSignedR2Url } from "../lib/r2.js";
import { sendResidentPush } from "../lib/webPush.js";

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
            if (!photoKey) {
                throw new Error(
                    "Photo key is missing after selfie upload",
                );
            }

            const photoUrl = await createSignedR2Url(
                photoKey,
                5 * 60,
            );

            await sendWhatsAppImage({
                to: flat.phone,
                imageUrl: photoUrl,
                caption: `Visitor: ${visitorName}\nFlat: ${flat.unitNumber}`,
            });

            await sendVisitorRequestTemplate({
                to: flat.phone,
                visitorName,
                flatNumber: flat.unitNumber,
                visitorLogId: visitor.id,
            });

            console.log(
                `WhatsApp visitor notification sent for VisitorLog ${visitor.id}`,
            );
        } catch (error) {
            console.error(
                `Failed to send WhatsApp visitor notification for visitor ${visitor.id}:`,
                error,
            );
        }

        const resident = await prisma.resident.findUnique({
            where: { flatId: flat.id },
            select: { id: true },
        });

        if (resident) {
            await sendResidentPush(resident.id, {
                title: "New visitor request",
                body: `${visitorName} is requesting entry to Flat ${flat.unitNumber}`,
                url: `/resident/visitors/${visitor.id}`,
                visitorLogId: visitor.id,
            });
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

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const visitor = await prisma.visitorLog.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                expiresAt: true,
            },
        });

        if (!visitor) {
            return res.status(404).json({
                error: "Visitor log not found",
            });
        }

        return res.json({
            id: visitor.id,
            status: visitor.status,
            passExpiresAt: visitor.expiresAt ? visitor.expiresAt.toISOString() : null,
        });
    } catch (error) {
        console.error("Failed to fetch visitor status:", error);
        return res.status(500).json({
            error: "Failed to fetch visitor status",
        });
    }
});

export default router;