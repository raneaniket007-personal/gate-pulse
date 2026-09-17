export type VisitorRequestResponse = {
    id: string;
    status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
    expiresAt: string | null;
};