import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    Search,
    UserPlus,
    X,
    MessageSquare,
    Check,
    Loader2,
    Heart,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_ORIGIN } from '../services/api';
import { socketService } from '../services/socket.service';

interface FriendsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onStartWhisper: (friend: any) => void;
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({ isOpen, onClose, onStartWhisper }) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, pendingRes] = await Promise.all([
                api.get('/social/friends'),
                api.get('/social/friends/pending')
            ]);
            setFriends(friendsRes.data);
            setPendingRequests(pendingRes.data);
        } catch (err) {
            console.error('Failed to fetch social data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('notification', (notif: any) => {
                if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
                    fetchData();
                }
            });
            return () => {
                socket.off('notification');
            };
        }
    }, []);

    const handleAccept = async (requesterId: string) => {
        try {
            await api.patch('/social/friend/accept', { requesterId });
            fetchData();
        } catch (err) {
            console.error('Failed to accept friend request', err);
        }
    };

    const handleReject = async (requesterId: string) => {
        try {
            await api.patch('/social/friend/reject', { requesterId });
            fetchData();
        } catch (err) {
            console.error('Failed to reject friend request', err);
        }
    };

    const filteredFriends = friends.filter(f =>
        (f.username || f.firstName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-start sm:items-start justify-center bg-black/40 backdrop-blur-sm pt-4 sm:pt-[5vh] lg:pt-[10vh]" onClick={onClose}>
                <motion.aside
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] sm:rounded-b-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border sm:border border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex justify-between items-center">
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white leading-none">Social Hub ({friends.length})</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-indigo-600 transition-colors text-sm font-black uppercase tracking-widest"
                        >
                            CLOSE
                        </button>
                    </div>

                    <div className="px-8 mb-4">
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Find a friend..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-black shadow-sm placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
                        {loading && (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        )}

                        {!loading && (
                            <>
                                {/* Pending Requests */}
                                {pendingRequests.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between px-2 mb-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                                <UserPlus size={12} />
                                                Pending Requests
                                            </h4>
                                            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-[9px] font-black">
                                                {pendingRequests.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {pendingRequests.map((req) => (
                                                <div key={req.id} className="p-4 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-[2rem] flex items-center justify-between group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img
                                                            src={req.requester.profilePictureUrl ? (req.requester.profilePictureUrl.startsWith('http') ? req.requester.profilePictureUrl : `${API_ORIGIN}${req.requester.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${req.requester.username}&background=f43f5e&color=fff`}
                                                            className="h-12 w-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                                                            alt="avatar"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                                @{req.requester.username}
                                                            </p>
                                                            <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Wants to network</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <button
                                                            onClick={() => handleAccept(req.requesterId)}
                                                            className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                                                            title="Accept"
                                                        >
                                                            <Check size={16} strokeWidth={3} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.requesterId)}
                                                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            title="Reject"
                                                        >
                                                            <X size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Friends List */}
                                <section>
                                    <div className="px-2 mb-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Users size={12} />
                                            Active Connections
                                        </h4>
                                    </div>
                                    {filteredFriends.length > 0 ? (
                                        <div className="space-y-1">
                                            {filteredFriends.map((friend) => (
                                                <div
                                                    key={friend.id}
                                                    className="flex items-center justify-between p-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={friend.profilePictureUrl ? (friend.profilePictureUrl.startsWith('http') ? friend.profilePictureUrl : `${API_ORIGIN}${friend.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${friend.username}&background=6366f1&color=fff`}
                                                                className="h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-800 object-cover shadow-sm group-hover:scale-105 transition-transform"
                                                                alt="friend"
                                                            />
                                                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${friend.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-base font-black text-gray-900 dark:text-white leading-none mb-1 cursor-default truncate">
                                                                @{friend.username || friend.firstName}
                                                            </p>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`h-1.5 w-1.5 rounded-full ${friend.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest ${friend.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                    {friend.isOnline ? 'Online' : 'Offline'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { onStartWhisper(friend); onClose(); }}
                                                        className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.25rem] opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all shadow-indigo-500/10"
                                                    >
                                                        <MessageSquare size={18} fill="currentColor" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-24 flex flex-col items-center justify-center text-center">
                                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] mb-6 shadow-inner">
                                                <Heart size={48} className="text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Silence is gold</p>
                                            <p className="text-[10px] font-bold uppercase text-slate-400/60 mt-2 px-12">Search explorers to fill your hub!</p>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                </motion.aside>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default FriendsSidebar;
