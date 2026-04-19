// src/api/apiClient.ts

import { tokenStorage } from "../utils/tokenStorage";

type ApiOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    requiresAuth?: boolean; 
};

// const BASE_URL = "https://admin.storly.co.in/api/v1";
// const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
// const BASE_URL = "";
const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}`
    : "";

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

export async function api<T = any>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {}, requiresAuth = false } = options;

    const authHeaders: Record<string, string> = {};

    if (requiresAuth) {
        const bearer = tokenStorage.getBearer();
        if (bearer) {
            authHeaders["Authorization"] = bearer;
        }
    }

    const requestBody = body ? JSON.stringify(body) : undefined;

    let response: Response;

    try {
        response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "channel": "web",
                ...authHeaders,
                ...headers,
            },
            body: requestBody,
        });
    } catch (networkError) {
        // Network failure (no internet, CORS, server down)
        throw new ApiError("Network error. Please check your connection.", 0);
    }

    let data: any;
    try {
        data = await response.json();
        // console.log("Response status:", response.status);
        // console.log("Response data:", data);
    } catch {
        throw new ApiError("Invalid response from server.", response.status);
    }

    if (!response.ok) {
        throw new ApiError(
            data?.message || "Something went wrong.",
            response.status,
            data
        );
    }

    return data as T;
}