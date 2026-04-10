// src/services/storeService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import type { Store, Product, GetStoreProductsParams, CreateStoreBody } from "../types/store";

// GET /v1/stores/{username}
// export const getStore = (username: string) =>
    // api<Store>(ENDPOINTS.GET_STORE(username));

// GET /v1/stores/{username}/products
export const getStoreProducts = (username: string, params?: GetStoreProductsParams) => {
    const query = new URLSearchParams();

    if (params?.page !== undefined)      query.set("page", String(params.page));
    if (params?.pageSize !== undefined)  query.set("pageSize", String(params.pageSize));
    if (params?.category !== undefined)  query.set("category", params.category);
    if (params?.featured !== undefined)  query.set("featured", String(params.featured));

    const queryString = query.toString();
    const endpoint = ENDPOINTS.GET_STORE_PRODUCTS(username) + (queryString ? `?${queryString}` : "");

    return api<Product[]>(endpoint);
};

// GET /v1/stores/{username}/products/{slug}
export const getStoreProductBySlug = (username: string, slug: string) =>
    api<Product>(ENDPOINTS.GET_STORE_PRODUCT_BY_SLUG(username, slug));


export const getStore = (username: string) =>
    api(ENDPOINTS.GET_STORE(username), {
        method: "GET",
        body: username,
    });

// POST /rest/stores
export const createStore = (data: CreateStoreBody) =>
    api<Store>(ENDPOINTS.CREATE_STORE, {
      method: "POST",
      body: data,
    });

export const updateStore = (username: string) =>
    api(ENDPOINTS.UPDATE_STORE(username), {
        method: "PUT",
        // body: username,
    });

export const deleteStore = (username: string) =>
    api(ENDPOINTS.DELETE_STORE(username), {
        method: "DELETE",
        // body: username,
    });
