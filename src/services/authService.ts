// services/authService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
// import { AuthRegisterParams, LoginParams } from "../types/store";
import type { ApiResponse, AuthRegisterParams, LoginParams, User } from "../types/store";

// export const getUser = () => api(ENDPOINTS.GET_USER);

// export const register = (data: AuthRegisterParams) =>
//     api(ENDPOINTS.REGISTER, {
//         method: "POST",
//         body: data,
//     });

// export const login = (data: LoginParams) =>
//     api(ENDPOINTS.LOGIN, {
//         method: "POST",
//         body: data,
//     });

export const register = (data: AuthRegisterParams): Promise<ApiResponse<User>> =>
    api(ENDPOINTS.REGISTER, {
        method: "POST",
        body: data,
    });

export const login = (data: LoginParams): Promise<ApiResponse<User>> =>
    api(ENDPOINTS.LOGIN, {
        method: "POST",
        body: data,
    });

export const logout = () =>
    api(ENDPOINTS.LOGOUT, {
        method: "POST",
        requiresAuth: true,
    });