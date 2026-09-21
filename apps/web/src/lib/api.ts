const API_URL = import.meta.env.VITE_API_URL || "";

export async function getHealth() {
    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
        throw new Error("API request failed");
    }

    return response.json();
}

export async function createVisitor(
    visitorName: string,
    flatId: string,
    selfie: Blob,
) {
    const formData = new FormData();

    formData.append("visitorName", visitorName);
    formData.append("flatId", flatId);
    formData.append("selfie", selfie, "visitor-selfie.jpg");

    const response = await fetch(`${API_URL}/api/visitors`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to create visitor request");
    }

    return data;
}

export async function getSocieties() {
    const response = await fetch(`${API_URL}/api/societies`);

    if (!response.ok) {
        throw new Error("Failed to fetch societies");
    }

    return response.json();
}

export async function getSocietyById(societyId: string) {
    const response = await fetch(`${API_URL}/api/societies/${societyId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch society");
    }

    return response.json();
}

export async function getVisitorStatus(visitorLogId: string) {
    const response = await fetch(`${API_URL}/api/visitors/${visitorLogId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch visitor status");
    }

    return response.json();
}