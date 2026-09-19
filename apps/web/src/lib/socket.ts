import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

export type VisitorStatus =
    | "APPROVED"
    | "DENIED"
    | "EXPIRED";

export function connectToVisitorSocket(
    visitorLogId: string,
    onStatusUpdate: (status: VisitorStatus) => void,
) {
    const socket = io(SOCKET_URL, {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);

        socket.emit("join-visitor-room", {
            visitorLogId,
        });
    });

    socket.on(
        "visitor-status-updated",
        (data: {
            visitorLogId: string;
            status: VisitorStatus;
        }) => {
            console.log("Visitor status update received:", data);

            if (data.visitorLogId !== visitorLogId) {
                return;
            }

            onStatusUpdate(data.status);
        },
    );

    socket.on("connect_error", (error) => {
        console.error("Socket connection failed:", error);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    return socket;
}