import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (token) {
            const newSocket = io('http://localhost:3000', {
                auth: { token },
                transports: ['websocket'],
            });

            let heartbeatInterval: any;

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Keep presence alive
                heartbeatInterval = setInterval(() => {
                    newSocket.emit('heartbeat');
                }, 30000); // 30s heartbeat for 60s TTL
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            setSocket(newSocket);

            return () => {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
