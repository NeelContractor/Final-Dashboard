// src/services/productService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import type {
    DeleteProductParams,
    GetProductBySlugParams,
    UpdateProductParams,
    CreateProductRequestBody,
    GetAllProducts,
    ApiResponse,
} from "../types/store";

const PAGE_SIZE = 10;

// GET /rest/stores/{username}/products  — filters sent as request body
export const getProducts = (
    username: string,
    body?: {
        page?: number;
        pageSize?: number;
        category?: string;
        featured?: boolean;
    }
): Promise<ApiResponse<GetAllProducts>> =>
    api(ENDPOINTS.GET_PRODUCTS(username), {
        method: "GET",
        requiresAuth: true,
        body: {
            page:     body?.page     ?? 1,
            pageSize: body?.pageSize ?? PAGE_SIZE,
            ...(body?.category !== undefined ? { category: body.category } : {}),
            ...(body?.featured !== undefined ? { featured: body.featured } : {}),
        },
    });

// GET /rest/stores/{username}/products/{slug}
export const getProductBySlug = (
    data: GetProductBySlugParams
): Promise<ApiResponse<any>> =>
    api(ENDPOINTS.GET_PRODUCT_BY_SLUG(data.username, data.slug), {
        method: "GET",
        requiresAuth: true,
    });

// POST /rest/stores/{username}/products
export const createProduct = (
    username: string,
    body: CreateProductRequestBody
): Promise<ApiResponse<any>> =>
    api(ENDPOINTS.CREATE_PRODUCT(username), {
        method: "POST",
        requiresAuth: true,
        body,
    });

// PUT /rest/stores/{username}/products/{slug}
export const updateProduct = (
    data: UpdateProductParams
): Promise<ApiResponse<any>> =>
    api(ENDPOINTS.UPDATE_PRODUCT(data.username, data.slug), {
        method: "PUT",
        requiresAuth: true,
        body: data.data,
    });

// DELETE /rest/stores/{username}/products/{slug}
export const deleteProduct = (
    data: DeleteProductParams
): Promise<ApiResponse<any>> =>
    api(ENDPOINTS.DELETE_PRODUCT(data.username, data.slug), {
        method: "DELETE",
        requiresAuth: true,
    });