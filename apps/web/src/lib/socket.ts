import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL ||
    window.location.origin;

export type VisitorStatus =
    | "APPROVED"
    | "DENIED"
    | "EXPIRED";

export type VisitorStatusUpdate = {
    visitorLogId: string;
    status: VisitorStatus;
    passExpiresAt: string | null;
};

export function connectToVisitorSocket(
    visitorLogId: string,
    onStatusUpdate: (
        update: VisitorStatusUpdate,
    ) => void,
) {
    const socket = io(SOCKET_URL, {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log(
            "Socket connected:",
            socket.id,
        );

        socket.emit("join-visitor-room", {
            visitorLogId,
        });
    });

    socket.on(
        "visitor-status-updated",
        (data: VisitorStatusUpdate) => {
            console.log(
                "Visitor status update received:",
                data,
            );

            if (
                data.visitorLogId !== visitorLogId
            ) {
                return;
            }

            onStatusUpdate(data);
        },
    );

    socket.on(
        "connect_error",
        (error) => {
            console.error(
                "Socket connection failed:",
                error,
            );
        },
    );

    socket.on(
        "disconnect",
        (reason) => {
            console.log(
                "Socket disconnected:",
                reason,
            );
        },
    );

    return socket;
}