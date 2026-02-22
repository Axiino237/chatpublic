import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, User as UserIcon, Users, Shield, Sparkles, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import NavigationDrawer from '../components/NavigationDrawer';
import api, { API_ORIGIN } from '../services/api';

import PrivateChatOverlay from '../components/PrivateChatOverlay';
import { useSocket } from '../context';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeRecipient, setActiveRecipient] = useState<any | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const socket = useSocket();

    React.useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await api.get('/social/friends');
                setFriends(res.data);
            } catch (err) {
                console.error('Failed to fetch friends', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, []);

    React.useEffect(() => {
        if (socket && activeRecipient) {
            socket.emit('join', user?.id); // Ensure room join

            const handleMessage = (msg: any) => {
                if (msg.senderId === activeRecipient.id || msg.senderId === user?.id) {
                    setChatMessages((prev) => [...prev, { ...msg, id: Date.now().toString() }]);
                }
            };

            socket.on('receiveMessage', handleMessage);
            return () => {
                socket.off('receiveMessage', handleMessage);
            };
        }
    }, [socket, activeRecipient, user]);

    const handleSendMessage = (content: string) => {
        if (!socket || !activeRecipient) return;

        const payload = {
            senderId: user?.id,
            receiverId: activeRecipient.id,
            content
        };

        socket.emit('sendMessage', payload);
        // Optimistic update
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: user?.id,
            content,
            createdAt: new Date()
        }]);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden">
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <main className="max-w-[1700px] mx-auto py-12 px-6 lg:px-12">
                {/* Hero / Welcome Section */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 luxe-gradient rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Command Center</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                        Welcome back, <span className="luxe-text-gradient">{user?.username || user?.firstName || 'Explorer'}</span>
                    </h1>

                </div>

                {/* Primary Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => navigate('/discover')}
                        className="glass-morphism p-8 rounded-[3rem] shadow-sm cursor-pointer hover:border-indigo-500/40 transition-all group"
                    >
                        <div className="h-16 w-16 bg-rose-500/10 dark:bg-rose-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:luxe-gradient transition-all duration-300">
                            <Heart className="h-8 w-8 text-rose-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Find Matches</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">Discover people heart-to-heart.</p>
                        <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 transition-colors">
                            Explore Now <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => {/* Focus on message list if needed, usually chat opens from friends list */ }}
                        className="glass-morphism p-8 rounded-[3rem] shadow-sm cursor-pointer hover:border-indigo-500/40 transition-all group"
                    >
                        <div className="h-16 w-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:luxe-gradient transition-all duration-300">
                            <MessageSquare className="h-8 w-8 text-indigo-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Private Chat</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">Secure private connections.</p>
                        <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 transition-colors">
                            Open Inbox <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => navigate('/lobby')}
                        className="glass-morphism p-8 rounded-[3rem] shadow-sm cursor-pointer hover:border-indigo-500/40 transition-all group"
                    >
                        <div className="h-16 w-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:luxe-gradient transition-all duration-300">
                            <Users className="h-8 w-8 text-emerald-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Luxe Lobby</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">Join the global conversation.</p>
                        <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 transition-colors">
                            Join Rooms <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => navigate('/profile')}
                        className="glass-morphism p-8 rounded-[3rem] shadow-sm cursor-pointer hover:border-indigo-500/40 transition-all group"
                    >
                        <div className="h-16 w-16 bg-amber-500/10 dark:bg-amber-500/20 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:luxe-gradient transition-all duration-300">
                            <UserIcon className="h-8 w-8 text-amber-500 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Identity Settings</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">Refine your public appearance.</p>
                        <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 transition-colors">
                            Edit Profile <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.div>
                </div>

                {/* Friend System Integration */}
                <div className="mt-20">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Social Pulse</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">Active Connections</h2>
                        </div>
                        <button
                            onClick={() => navigate('/discover')}
                            className="px-6 py-3 luxe-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95 transition-all"
                        >
                            Connect More
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {loading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="aspect-square glass-morphism rounded-[2.5rem] animate-pulse"></div>
                            ))
                        ) : friends.length > 0 ? (
                            friends.map((friend) => (
                                <motion.div
                                    key={friend.id}
                                    whileHover={{ y: -8, scale: 1.05 }}
                                    onClick={() => {
                                        setActiveRecipient(friend);
                                        // Ideally fetch history here
                                    }}
                                    className="glass-morphism p-6 rounded-[3rem] shadow-sm text-center cursor-pointer hover:border-indigo-500/30 transition-all group"
                                >
                                    <div className="relative inline-block mb-4">
                                        <div className="absolute inset-0 luxe-gradient rounded-[1.75rem] blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                                        <img
                                            src={friend.profilePictureUrl ? (friend.profilePictureUrl.startsWith('http') ? friend.profilePictureUrl : `${API_ORIGIN}${friend.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${friend.firstName}&background=6366f1&color=fff`}
                                            className="h-24 w-24 rounded-[2rem] object-cover ring-4 ring-white dark:ring-slate-800 relative z-10"
                                            alt={friend.firstName}
                                        />
                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 z-20 shadow-sm"></div>
                                    </div>
                                    <h4 className="text-base font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                                        {friend.firstName}
                                    </h4>
                                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                        {friend.location || 'Online'}
                                    </p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center glass-morphism rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Users size={48} className="mx-auto text-gray-300 mb-6 opacity-40 luxe-text-gradient" />
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Your circle is empty</h3>
                                <p className="text-sm font-medium text-gray-400 mb-10 mt-2">Millions are waiting to discover someone like you.</p>
                                <button
                                    onClick={() => navigate('/discover')}
                                    className="px-10 py-4 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all"
                                >
                                    Begin Discovery
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Moderation Access for elevated roles */}
                {['admin', 'monitor'].includes(user?.role || '') && (
                    <div className="mt-24 p-10 bg-slate-900 dark:bg-white rounded-[4rem] text-white dark:text-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/10 dark:bg-slate-900/5 rounded-[2rem]">
                                <Shield size={40} className="text-indigo-400 dark:text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">Moderator Terminal</h4>
                                <p className="text-sm opacity-60 font-medium">Safe-guard the community with pulse monitoring tools.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/monitor')}
                            className="w-full md:w-auto px-10 py-4 bg-indigo-600 dark:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all"
                        >
                            Open Terminal
                        </button>
                    </div>
                )}
            </main>

            {/* Private Chat Overlay */}
            {activeRecipient && (
                <PrivateChatOverlay
                    recipient={activeRecipient}
                    onClose={() => setActiveRecipient(null)}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                />
            )}
        </div>
    );
};

export default Dashboard;

