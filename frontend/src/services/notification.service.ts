import api from './api';

export const notificationService = {
    async getNotifications() {
        const response = await api.get('/notifications');
        return response.data;
    },

    async markAsRead(notificationId: string) {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },
};
