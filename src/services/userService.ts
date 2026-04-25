// services/userService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import type { ApiResponse, User } from "../types/store";

export const userDetails = (): Promise<ApiResponse<User>> =>
    api(ENDPOINTS.USER_DETAILS, {
        method: "POST",
        requiresAuth: true,
    });