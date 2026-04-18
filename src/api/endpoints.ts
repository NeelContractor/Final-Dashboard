// src/api/endpoints.ts

export const ENDPOINTS = {
    // Auth
    LOGIN: "/api/v1/rest/auth/login",
    LOGOUT: "/api/v1/rest/logout",
    REGISTER: "/api/v1/rest/auth/register",

    // User
    USER_DETAILS: "/api/v1/rest/common/userDetails",
    GET_USER: "/api/v1/user",
    CREATE_USER: "/api/v1/user",
    UPDATE_USER: (id: string) => `/api/v1/user/${id}`,

    // Products
    DELETE_PRODUCT: (username: string, slug: string) => `/api/v1/rest/stores/${username}/products/${slug}`,
    GET_PRODUCT_BY_SLUG: (username: string, slug: string) => `/api/v1/rest/stores/${username}/products/${slug}`,
    GET_PRODUCTS: (username: string) => `/api/v1/rest/stores/${username}/products`,
    CREATE_PRODUCT: (username: string) => `/api/v1/rest/stores/${username}/products`,
    UPDATE_PRODUCT: (username: string, slug: string) => `/api/v1/rest/stores/${username}/products/${slug}`,

    // Store
    GET_STORE: (username: string) => `/api/v1/rest/stores/${username}`,
    CREATE_STORE: `/api/v1/rest/stores`,
    UPDATE_STORE: (username: string) => `/api/v1/rest/stores/${username}`,
    DELETE_STORE: (username: string) => `/api/v1/rest/stores/${username}`,


    GET_STORE_PRODUCTS: (username: string) => `/api/v1/rest/stores/${username}/products`,
    GET_STORE_PRODUCT_BY_SLUG: (username: string, slug: string) => `/api/v1/rest/stores/${username}/products/${slug}`,
} as const;