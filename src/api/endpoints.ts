// src/api/endpoints.ts

export const ENDPOINTS = {
    // Auth
    LOGIN: "/rest/auth/login",
    REGISTER: "/rest/auth/register",

    // User
    USER_DETAILS: "/rest/common/userDetails",
    GET_USER: "/user",
    CREATE_USER: "/user",
    UPDATE_USER: (id: string) => `/user/${id}`,

    // Products
    DELETE_PRODUCT: (username: string, slug: string) => `/rest/stores/${username}/products/${slug}`,
    GET_PRODUCT_BY_SLUG: (username: string, slug: string) => `/rest/stores/${username}/products/${slug}`,
    GET_PRODUCTS: (username: string) => `/rest/stores/${username}/products`,
    CREATE_PRODUCT: (username: string) => `/rest/stores/${username}/products`,
    UPDATE_PRODUCT: (username: string, slug: string) => `/rest/stores/${username}/products/${slug}`,

    // Store
    GET_STORE: (username: string) => `/rest/stores/${username}`,
    CREATE_STORE: `/rest/stores`,
    UPDATE_STORE: (username: string) => `/rest/stores/${username}`,
    DELETE_STORE: (username: string) => `/rest/stores/${username}`,


    GET_STORE_PRODUCTS: (username: string) => `/rest/stores/${username}/products`,
    GET_STORE_PRODUCT_BY_SLUG: (username: string, slug: string) => `/v1/stores/${username}/products/${slug}`,
};