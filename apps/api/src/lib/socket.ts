import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(
    socketServer: SocketIOServer,
) {
    io = socketServer;
}

export function emitVisitorStatus(
    visitorLogId: string,
    status: "APPROVED" | "DENIED" | "EXPIRED",
    passExpiresAt: string | null,
) {
    if (!io) {
        console.warn(
            "Socket.IO has not been initialized",
        );

        return;
    }

    const roomName = `visitor:${visitorLogId}`;

    io.to(roomName).emit("visitor-status-updated", {
        visitorLogId,
        status,
        passExpiresAt,
    });

    console.log("Visitor status event emitted:", {
        roomName,
        visitorLogId,
        status,
        passExpiresAt,
    });
}