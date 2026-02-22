import api from './api';

export const socialService = {
    async getGifts() {
        const response = await api.get('/social/gifts');
        return response.data;
    },

    async sendGift(receiverId: string, giftId: string, message?: string) {
        const response = await api.post('/social/gift/send', { receiverId, giftId, message });
        return response.data;
    },

    async getUserGifts(userId: string) {
        const response = await api.get(`/social/gifts/${userId}`);
        return response.data;
    },

    async getWallPosts() {
        const response = await api.get('/social/wall');
        return response.data;
    },

    async createPost(content: string, imageUrl?: string) {
        const response = await api.post('/social/post', { content, imageUrl });
        return response.data;
    },

    async likePost(postId: string) {
        const response = await api.patch(`/social/post/${postId}/like`);
        return response.data;
    },
};
