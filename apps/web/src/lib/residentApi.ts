const API_URL = import.meta.env.VITE_API_URL || "";

export type Resident = {
    id: string;
    name: string;
    phone: string;
    flatId: string;
    flatNumber: string;
    societyId: string;
    societyName: string;
};

export type ResidentVisitor = {
    id: string;
    visitorName: string;
    status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
    createdAt: string;
    expiresAt: string | null;
    approvedAt: string | null;
    passExpiresAt: string | null;
    flatNumber: string;
    photoUrl: string | null;
};

const tokenKey = "gatepulse_resident_token";

export function getResidentToken() {
    return localStorage.getItem(tokenKey);
}

export function setResidentToken(token: string) {
    localStorage.setItem(tokenKey, token);
}

export function clearResidentToken() {
    localStorage.removeItem(tokenKey);
}

async function request(path: string, options: RequestInit = {}) {
    const token = getResidentToken();
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", "Bearer " + token);

    const response = await fetch(API_URL + path, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Resident API request failed");
    }

    return data;
}

export async function loginResident(phone: string, pin: string) {
    const data = await request("/api/residents/login", {
        method: "POST",
        body: JSON.stringify({ phone, pin }),
    });
    setResidentToken(data.token);
    return data.resident as Resident;
}

export async function getResidentMe() {
    return request("/api/residents/me") as Promise<Resident>;
}

export async function getPushConfig() {
    return request("/api/residents/push/config") as Promise<{ publicKey: string }>;
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
    return request("/api/residents/push-subscriptions", {
        method: "POST",
        body: JSON.stringify(subscription),
    });
}

export async function getResidentVisitors() {
    return request("/api/residents/visitors") as Promise<ResidentVisitor[]>;
}

export async function getResidentVisitor(id: string) {
    return request("/api/residents/visitors/" + id) as Promise<ResidentVisitor>;
}

export async function actOnVisitor(id: string, action: "APPROVE" | "DENY") {
    return request("/api/residents/visitors/" + id + "/action", {
        method: "POST",
        body: JSON.stringify({ action }),
    });
}

export async function sendTestPush() {
    return request("/api/residents/push/test", { method: "POST" });
}
