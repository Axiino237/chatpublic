import api from './api';
import { getDeviceId, getDeviceType } from '../utils/device.utils';

export const authService = {
    async login(credentials: any) {
        const response = await api.post('/auth/login', {
            ...credentials,
            deviceId: getDeviceId(),
            deviceType: getDeviceType()
        });
        return response.data;
    },

    async register(userData: any) {
        const response = await api.post('/auth/register', {
            ...userData,
            deviceId: getDeviceId(),
            deviceType: getDeviceType()
        });
        return response.data;
    },

    async blockUser(userId: string) {
        const response = await api.post(`/blocks/${userId}`);
        return response.data;
    },

    async reportUser(reportedId: string, reason: string) {
        const response = await api.post('/reports', { reportedId, reason });
        return response.data;
    },

    async generateOtp(email: string) {
        const response = await api.post('/auth/otp/generate', { email });
        return response.data;
    },

    async verifyOtp(email: string, code: string) {
        const response = await api.post('/auth/otp/verify', {
            email,
            code,
            deviceId: getDeviceId(),
            deviceType: getDeviceType()
        });
        return response.data;
    },

    async guestLogin(username?: string, age?: number) {
        const response = await api.post('/auth/guest-login', {
            username,
            age,
            deviceId: getDeviceId(),
            deviceType: getDeviceType()
        });
        return response.data;
    },
};
