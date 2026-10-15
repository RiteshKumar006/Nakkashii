// small fetch wrapper, throws an Error with the server's message
export async function api(path, { method = "GET", body, token } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const isForm = body instanceof FormData;
    if (body && !isForm) headers["Content-Type"] = "application/json";

    const res = await fetch(`/api${path}`, {
        method,
        headers,
        body: body && !isForm ? JSON.stringify(body) : body,
    });

    if (res.status === 204) return null;

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const error = new Error(json?.message || "Something went wrong");
        error.status = res.status;
        error.details = json?.details;
        throw error;
    }

    return json.data;
}
