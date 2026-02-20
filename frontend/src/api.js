// Central API configuration
// In development: Vite proxy handles /api → localhost:8001
// In production: Use the deployed backend URL from environment variable

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response;
}

export default API_BASE;
