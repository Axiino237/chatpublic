import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageSquare, Gift, Info, Trash2 } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import { useSocket } from '../context';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useSelector((state: RootState) => state.auth);
    const socket = useSocket();

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('notification', (newNotification: any) => {
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });
            return () => {
                socket.off('notification');
            };
        }
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'match': return <Heart className="text-rose-500" size={16} />;
            case 'message': return <MessageSquare className="text-blue-500" size={16} />;
            case 'gift': return <Gift className="text-amber-500" size={16} />;
            default: return <Info className="text-gray-500" size={16} />;
        }
    };

    const handleClearAll = async () => {
        if (!notifications.length) return;
        if (window.confirm('Clear all notifications?')) {
            try {
                // Assuming there's a clear all service or just loop
                notifications.forEach(async (n) => await notificationService.markAsRead(n.id));
                setNotifications([]);
                setUnreadCount(0);
            } catch (err) {
                console.error('Failed to clear notifications', err);
            }
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-start sm:items-start justify-center bg-black/40 backdrop-blur-sm pt-4 sm:pt-[5vh] lg:pt-[10vh]" onClick={onClose}>
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] sm:rounded-b-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border sm:border border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex justify-between items-center">
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white leading-none">Notifications ({unreadCount})</h3>
                        <div className="flex items-center gap-6">
                            {notifications.length > 0 && (
                                <button onClick={handleClearAll} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear All">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-indigo-600 transition-colors text-sm font-black uppercase tracking-widest"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 hide-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] mb-6 shadow-inner">
                                    <Bell size={48} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    className={`group relative p-4 rounded-[2rem] flex items-center gap-5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 ${notif.isRead ? 'opacity-50' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}
                                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                >
                                    <div className={`p-4 rounded-[1.25rem] shadow-sm shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none">
                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-base font-black text-gray-900 dark:text-slate-100 leading-tight">
                                            {notif.content}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40"></div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default NotificationCenter;
