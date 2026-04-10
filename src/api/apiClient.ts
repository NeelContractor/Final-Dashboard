// src/api/apiClient.ts

import { tokenStorage } from "../utils/tokenStorage";

type ApiOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    requiresAuth?: boolean; 
};

const BASE_URL = "https://admin.storly.co.in";

export async function api<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, requiresAuth = false } = options;

    const authHeaders: Record<string, string> = {};

    if (requiresAuth) {
        const bearer = tokenStorage.getBearer(); 
        if (bearer) {
            authHeaders["Authorization"] = bearer;
        }
    }

    const requestBody = body ? JSON.stringify(body) : undefined;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "channel": "web",
            ...authHeaders,
            ...headers,
        },
        body: requestBody,
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.message || "API Error";
        const error = new Error(message);
        (error as any).status = response.status; 
        throw error;
      }

    return data as T;
}