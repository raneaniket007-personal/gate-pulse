import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(server: SocketIOServer) {
    io = server;
}

export function emitVisitorStatus(
    visitorLogId: string,
    status: "APPROVED" | "DENIED" | "EXPIRED",
) {
    if (!io) {
        console.warn("Socket.IO has not been initialized");
        return;
    }

    const roomName = `visitor:${visitorLogId}`;

    io.to(roomName).emit("visitor-status-updated", {
        visitorLogId,
        status,
    });

    console.log("Visitor status event emitted:", {
        roomName,
        status,
    });
}