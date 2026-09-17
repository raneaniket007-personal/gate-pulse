const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
}

export async function getHealth() {
    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
        throw new Error("API request failed");
    }

    return response.json();
}