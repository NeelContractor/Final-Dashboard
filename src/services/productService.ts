// src/services/productService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
// import type {
//     DeleteProductParams,
//     GetProductBySlugParams,
//     UpdateProductParams,
//     CreateProductRequestBody,
//     GetAllProducts,
//     ApiResponse,
// } from "../types/store";
import type {
    ApiResponse,
    GetAllProducts,
    Product,
    CreateProductRequestBody,
    UpdateProductRequestBody,
    GetProductBySlugParams,
} from "../types/store";

const PAGE_SIZE = 10;

// GET /rest/stores/{username}/products?page=1&pageSize=10&category=...&featured=...
export const getProducts = (
    username: string,
    filters?: {
        page?: number;
        pageSize?: number;
        category?: string;
        featured?: boolean;
    }
): Promise<ApiResponse<GetAllProducts>> => {
    const params = new URLSearchParams();
    params.set("page",     String(filters?.page     ?? 1));
    params.set("pageSize", String(filters?.pageSize ?? PAGE_SIZE));
    if (filters?.category !== undefined) params.set("category", filters.category);
    if (filters?.featured !== undefined) params.set("featured", String(filters.featured));
 
    return api(`${ENDPOINTS.GET_PRODUCTS(username)}?${params.toString()}`, {
        method: "GET",
        requiresAuth: true,
    });
};

// GET /rest/stores/{username}/products/{slug}
export const getProductBySlug = (
    data: GetProductBySlugParams
): Promise<ApiResponse<Product>> =>
    api(ENDPOINTS.GET_PRODUCT_BY_SLUG(data.username, data.slug), {
        method: "GET",
        requiresAuth: true,
    });

// POST /rest/stores/{username}/products
export const createProduct = (
    username: string,
    body: CreateProductRequestBody
): Promise<ApiResponse<Product>> =>
    api(ENDPOINTS.CREATE_PRODUCT(username), {
        method: "POST",
        requiresAuth: true,
        body,
    });

// PUT /rest/stores/{username}/products/{slug}
export const updateProduct = (
    username: string,
    slug: string,
    body: UpdateProductRequestBody
): Promise<ApiResponse<Product>> =>
    api(ENDPOINTS.UPDATE_PRODUCT(username, slug), {
        method: "PUT",
        requiresAuth: true,
        body,
    });

// DELETE /rest/stores/{username}/products/{slug}
export const deleteProduct = (
    username: string,
    slug: string
): Promise<ApiResponse<void>> =>
    api(ENDPOINTS.DELETE_PRODUCT(username, slug), {
        method: "DELETE",
        requiresAuth: true,
    });