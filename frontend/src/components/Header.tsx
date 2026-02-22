import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Menu,
    Mail,
    UserPlus,
    Bell,
    MessageSquare
} from 'lucide-react';
import type { RootState } from '../store';
import { useSocket } from '../context';
import NotificationCenter from './NotificationCenter';
import InboxDialog from './InboxDialog';
import api, { API_ORIGIN } from '../services/api';

import { notificationService } from '../services/notification.service';

interface HeaderProps {
    onMenuClick?: () => void;
    onFriendsClick?: () => void;
    onInboxClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onFriendsClick, onInboxClick }) => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [inboxConversations, setInboxConversations] = useState<any[]>([]);
    const [whisperCount, setWhisperCount] = useState(0);
    const [pendingFriendsCount, setPendingFriendsCount] = useState(0);
    const socket = useSocket();

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            fetchInbox();
            fetchPendingFriends();
        }
    }, [user]);

    useEffect(() => {
        if (socket && user) {
            socket.on('notification', (notif?: any) => {
                setUnreadCount(prev => prev + 1);
                if (notif?.type === 'friend_request') {
                    setPendingFriendsCount(prev => prev + 1);
                }
            });
            socket.on('receiveMessage', () => {
                fetchInbox();
            });
            return () => {
                socket.off('notification');
                socket.off('receiveMessage');
            };
        }
    }, [socket, user]);

    const fetchInbox = async () => {
        try {
            const res = await api.get('/chat/inbox');
            setInboxConversations(res.data);
            setWhisperCount(res.data.length);
        } catch (err) {
            console.error('Failed to fetch inbox', err);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationService.getNotifications();
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const fetchPendingFriends = async () => {
        try {
            const res = await api.get('/social/friends/pending');
            setPendingFriendsCount(res.data.length);
        } catch (err) {
            console.error('Failed to fetch pending friends', err);
        }
    };


    return (
        <header className="glass-morphism sticky top-0 z-50 h-16 transition-all duration-300">
            <div className="max-w-[1700px] mx-auto h-full px-6 flex items-center justify-between">
                {/* Left: Menu & Brand */}
                <div className="flex items-center gap-2 sm:gap-6 lowercase">
                    <button
                        onClick={onMenuClick}
                        className="p-1 sm:p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                    >
                        <Menu size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2.5 cursor-pointer group"
                    >
                        <div className="p-2 luxe-gradient rounded-xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
                            <MessageSquare className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter luxe-text-gradient hidden sm:block">LOVELINK</h1>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                    <button
                        onClick={onInboxClick || (() => setIsInboxOpen(true))}
                        className="p-1.5 sm:p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors relative text-gray-600 dark:text-gray-300"
                        title="Messages"
                    >
                        <Mail size={18} className="sm:w-5 sm:h-5" />
                        {whisperCount > 0 && (
                            <span className="absolute top-1 sm:top-2 right-1 sm:right-2 h-3.5 min-w-[14px] px-1 luxe-gradient rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                                {whisperCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onFriendsClick}
                        className="p-1.5 sm:p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors relative text-gray-600 dark:text-gray-300"
                        title="Friends & Requests"
                    >
                        <UserPlus size={18} className="sm:w-5 sm:h-5" />
                        {pendingFriendsCount > 0 && (
                            <span className="absolute top-1 sm:top-2 right-1 sm:right-2 h-3.5 min-w-[14px] px-1 bg-amber-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                                {pendingFriendsCount}
                            </span>
                        )}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-1.5 sm:p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors relative text-gray-600 dark:text-gray-300"
                            title="Notifications"
                        >
                            <Bell size={18} className="sm:w-5 sm:h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 sm:top-2 right-1 sm:right-2 h-3.5 min-w-[14px] px-1 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <NotificationCenter
                            isOpen={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    </div>

                    <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/20 mx-1 hidden sm:block"></div>

                    {/* User Profile Info */}
                    <div
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 p-1.5 pr-3 rounded-2xl transition-all group"
                    >
                        <div className="relative">
                            <img
                                src={user?.profilePictureUrl ? (user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${API_ORIGIN}${user.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${user?.username || user?.firstName}&background=6366f1&color=fff`}
                                alt="avatar"
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-2 border-white dark:border-slate-800 object-cover shadow-md group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
                        </div>
                        <div className="hidden md:block leading-none">
                            <p className="text-xs font-black text-gray-900 dark:text-white mb-0.5 truncate max-w-[100px]">{user?.username || user?.firstName}</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 select-none">Active Now</span>
                        </div>
                    </div>
                </div>
            </div>

            <InboxDialog
                isOpen={isInboxOpen}
                onClose={() => setIsInboxOpen(false)}
                conversations={inboxConversations}
                onConversationClick={(partner) => {
                    // This will need coordination with PublicChatPage to open the overlay
                    // For now we'll emit a custom event or use a global state
                    window.dispatchEvent(new CustomEvent('openPrivateChat', { detail: partner }));
                }}
            />

        </header>
    );
};

export default Header;
