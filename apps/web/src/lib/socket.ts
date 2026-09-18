import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;

if (!SOCKET_URL) {
    throw new Error("VITE_API_URL is not configured");
}

export function connectToVisitorSocket(visitorLogId: string) {
    const socket = io(SOCKET_URL, {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);

        socket.emit("join-visitor-room", {
            visitorLogId,
        });
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection failed:", error);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    return socket;
}