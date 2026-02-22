import api from './api';

export const userService = {
    async getMe() {
        const response = await api.get('/users/me');
        return response.data;
    },

    async updateProfile(updateData: any) {
        console.log('📡 [UserService] Sending PATCH /users/profile', updateData);
        const response = await api.patch('/users/profile', updateData);
        console.log('📩 [UserService] Response:', response.status, response.data);
        return response.data;
    },

    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/media/upload/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
