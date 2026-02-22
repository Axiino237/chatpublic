import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { socketService } from '../services/socket.service';
import type { RootState } from '../store';
import { toast, Toaster } from 'react-hot-toast';

const NotificationManager: React.FC = () => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (token && user) {
            const socket = socketService.getSocket() || socketService.connect(token);

            socket.on('newNotification', (notification: any) => {
                toast(notification.content, {
                    icon: '🔔',
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            });

            return () => {
                socket.off('newNotification');
            };
        }
    }, [token, user]);

    return <Toaster />;
};

export default NotificationManager;
