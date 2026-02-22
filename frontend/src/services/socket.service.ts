import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;

    async refreshTokenAndReconnect(): Promise<string | null> {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            console.error('[SocketService] No refresh token available');
            return null;
        }

        try {
            console.log('[SocketService] Attempting to refresh token...');
            const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                headers: { Authorization: `Bearer ${refreshToken}` }
            });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            console.log('[SocketService] Token refreshed successfully');
            return accessToken;
        } catch (error) {
            console.error('[SocketService] Token refresh failed:', error);
            // Clear tokens and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }
    }

    connect(token: string) {
        if (this.socket?.connected) return this.socket;

        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token: token,
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] Connected to server');
            this.reconnectAttempts = 0;
        });

        this.socket.on('connect_error', async (err) => {
            console.error('[SocketService] Connection error:', err.message);

            // Check if error is due to authentication
            if (err.message.includes('Unauthorized') || err.message.includes('jwt expired')) {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[SocketService] Auth error detected, attempting token refresh (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

                    const newToken = await this.refreshTokenAndReconnect();
                    if (newToken && this.socket) {
                        // Update socket auth with new token
                        this.socket.auth = { token: newToken };
                        this.socket.connect();
                    }
                } else {
                    console.error('[SocketService] Max reconnect attempts reached, redirecting to login');
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        });

        this.socket.on('error', async (error: any) => {
            console.error('[SocketService] Socket error:', error);
            if (error?.message?.includes('Unauthorized') || error?.message?.includes('jwt expired')) {
                const newToken = await this.refreshTokenAndReconnect();
                if (newToken) {
                    this.forceReconnect(newToken);
                }
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketService] Disconnected:', reason);
        });

        return this.socket;
    }

    forceReconnect(token: string) {
        console.log('[SocketService] Forcing reconnect with new token...');
        this.disconnect();
        this.reconnectAttempts = 0;
        return this.connect(token);
    }

    disconnect() {
        if (this.socket) {
            this.socket.off();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
