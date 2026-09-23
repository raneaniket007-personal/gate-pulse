import { Router, type Request } from "express";
import { prisma } from "../lib/prisma.js";
import { getResidentFromToken, loginResident } from "../lib/residentAuth.js";
import { createSignedR2Url } from "../lib/r2.js";
import { emitVisitorStatus } from "../lib/socket.js";
import { updateVisitorStatus } from "../lib/visitorStatus.js";
import { sendResidentPush } from "../lib/webPush.js";

const router = Router();

function bearerToken(req: { headers: { authorization?: string } }) {
    const value = req.headers.authorization || "";
    return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function authenticate(req: Request) {
    return getResidentFromToken(bearerToken(req));
}

router.post("/login", async (req, res) => {
    try {
        const { phone, pin } = req.body as { phone?: string; pin?: string };
        if (!phone || !pin) {
            return res.status(400).json({ error: "Phone and PIN are required" });
        }

        const result = await loginResident(phone, pin);
        if (!result) {
            return res.status(401).json({ error: "Invalid phone or PIN" });
        }

        return res.json({
            token: result.token,
            resident: {
                id: result.resident.id,
                name: result.resident.name,
                phone: result.resident.phone,
                flatId: result.resident.flatId,
                flatNumber: result.resident.flat.unitNumber,
                societyId: result.resident.flat.societyId,
                societyName: result.resident.flat.society.name,
            },
        });
    } catch (error) {
        console.error("Resident login failed:", error);
        return res.status(500).json({ error: "Resident login failed" });
    }
});

router.get("/me", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    return res.json({
        id: resident.id,
        name: resident.name,
        phone: resident.phone,
        flatId: resident.flatId,
        flatNumber: resident.flat.unitNumber,
        societyId: resident.flat.societyId,
        societyName: resident.flat.societyName,
    });
});

router.post("/push-subscriptions", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    const body = req.body as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
        return res.status(400).json({ error: "Invalid push subscription" });
    }

    await prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        update: {
            residentId: resident.id,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent: req.get("user-agent") || null,
        },
        create: {
            residentId: resident.id,
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent: req.get("user-agent") || null,
        },
    });

    return res.status(201).json({ ok: true });
});

router.get("/visitors", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    const visitors = await prisma.visitorLog.findMany({
        where: { flatId: resident.flatId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            visitorName: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            approvedAt: true,
            passExpiresAt: true,
            photoKey: true,
            flat: { select: { unitNumber: true } },
        },
    );

    const result = await Promise.all(
        visitors.map(async (visitor) => ({
            ...visitor,
            photoUrl: visitor.photoKey
                ? await createSignedR2Url(visitor.photoKey, 300)
                : null,
        })),
    );

    return res.json(result);
});

router.get("/visitors/:visitorLogId", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    const visitor = await prisma.visitorLog.findFirst({
        where: {
            id: req.params.visitorLogId,
            flatId: resident.flatId,
        },
        include: { flat: true },
    });

    if (!visitor) return res.status(404).json({ error: "Visitor not found" });

    return res.json({
        id: visitor.id,
        visitorName: visitor.visitorName,
        status: visitor.status,
        createdAt: visitor.createdAt,
        expiresAt: visitor.expiresAt,
        approvedAt: visitor.approvedAt,
        passExpiresAt: visitor.passExpiresAt,
        flatNumber: visitor.flat.unitNumber,
        photoUrl: visitor.photoKey
            ? await createSignedR2Url(visitor.photoKey, 300)
            : null,
    });
});

router.post("/visitors/:visitorLogId/action", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    const { action } = req.body as { action?: "APPROVE" | "DENY" };
    if (action !== "APPROVE" && action !== "DENY") {
        return res.status(400).json({ error: "Action must be APPROVE or DENY" });
    }

    const visitor = await prisma.visitorLog.findFirst({
        where: { id: req.params.visitorLogId, flatId: resident.flatId },
        select: { id: true },
    });

    if (!visitor) return res.status(404).json({ error: "Visitor not found" });

    const statusResult = await updateVisitorStatus(visitor.id, action);
    if (!statusResult.success) {
        return res.status(409).json({
            error: "Visitor action rejected: " + statusResult.reason,
            reason: statusResult.reason,
        });
    }

    emitVisitorStatus(
        statusResult.visitorLogId,
        statusResult.status,
        statusResult.passExpiresAt
            ? statusResult.passExpiresAt.toISOString()
            : null,
    );

    return res.json(statusResult);
});

router.post("/push/test", async (req, res) => {
    const resident = await authenticate(req);
    if (!resident) return res.status(401).json({ error: "Unauthorized" });

    const result = await sendResidentPush(resident.id, {
        title: "GatePulse test notification",
        body: "Push notifications are working on this device.",
        url: "/resident",
        visitorLogId: "test",
    });

    return res.json({ ok: result.failed === 0 && result.sent > 0, ...result });
});

export default router;
