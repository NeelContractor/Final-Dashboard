// services/userService.ts

import { api } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

// export const getUser = () => api(ENDPOINTS.GET_USER);



// export const createUser = (data: any) =>
//     api(ENDPOINTS.CREATE_USER, {
//         method: "POST",
//         body: data,
//     });

// export const updateUser = (id: string, data: any) =>
//     api(ENDPOINTS.UPDATE_USER(id), {
//         method: "PUT",
//         body: data,
//     });

export const userDetails = (
    // jwt_token: string
) =>
    api(ENDPOINTS.USER_DETAILS, {
        method: "POST",
        requiresAuth: true,
        // body: jwt_token,
    });