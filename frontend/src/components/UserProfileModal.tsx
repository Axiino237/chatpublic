import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MessageSquare,
    AtSign,
    Ban,

    Flag,
    Calendar,
    Info,
    Loader2,
    UserPlus,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import api from '../services/api';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onTag: (username: string) => void;
    onWhisper: (user: any) => void;
    onIgnore: (userId: string, username?: string) => void;
    onReport: (user: any) => void;
    isMe?: boolean;
    onLogout?: () => void;
    currentTheme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onTag, onWhisper, onIgnore, onReport, isMe, onLogout, onToggleTheme, currentTheme }) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            setLoading(true);
            api.get(`/users/profile/${user.id}`)
                .then(res => {
                    setProfileData(res.data);
                })
                .catch(err => {
                    console.error('Failed to load profile', err);
                    setProfileData(null);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, user?.id]);

    if (!isOpen || !user) return null;

    const displayName = profileData?.firstName ? `${profileData.firstName} ${profileData.lastName || ''}` : (user.firstName || user.username || 'Mysterious Explorer');

    const handleAddFriend = async () => {
        try {
            await api.post('/social/friend/request', { addresseeId: user.id });
            alert(`Friend request sent to ${profileData?.username || user.username}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send friend request');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] sm:max-h-[85vh] border-t sm:border border-gray-100 dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag indicator */}
                    <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 -z-10"></div>

                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90 shadow-sm border border-gray-100 dark:border-gray-700 z-10">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center pt-4">
                        <div className="relative mb-6">
                            <div className="w-24 sm:w-28 h-24 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-blue-500 shadow-xl shadow-indigo-500/20">
                                <img
                                    src={profileData?.profilePictureUrl || user.profilePictureUrl || `https://ui-avatars.com/api/?name=${displayName}&background=4f46e5&color=fff`}
                                    className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 object-cover"
                                    alt={displayName}
                                />
                            </div>
                            {profileData?.isOnline !== false && <div className="absolute bottom-2 right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full shadow-lg"></div>}
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1">{displayName}</h2>
                            <p className="text-xs sm:text-sm font-bold text-indigo-500 uppercase tracking-widest font-mono">@{profileData?.username || user.username || 'unknown'}</p>
                        </div>

                        {loading ? (
                            <div className="h-24 flex items-center justify-center w-full">
                                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full space-y-3 mb-6"
                            >
                                {profileData?.age && (
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Age</p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{profileData.age} Years</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mt-0.5">
                                        <Info size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Bio</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                            "{profileData?.bio || 'No bio available'}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {isMe && (
                            <div className="w-full mb-6 space-y-3">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Settings</h3>
                                    <button
                                        onClick={onToggleTheme}
                                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                {currentTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">App Theme</span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 uppercase">{currentTheme} Mode</span>
                                    </button>

                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-sm hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                                                <LogOut size={18} />
                                            </div>
                                            <span className="text-sm font-bold">Sign Out</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                            <button
                                onClick={() => { onTag(profileData?.username || user.username); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl sm:rounded-3xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95 group shadow-sm"
                            >
                                <AtSign size={20} className="mb-1 sm:mb-2 group-hover:rotate-12 transition-transform" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Tag</span>
                            </button>
                            <button
                                onClick={() => { onWhisper(profileData || user); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl sm:rounded-3xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 group shadow-sm"
                            >
                                <MessageSquare size={20} className="mb-1 sm:mb-2 group-hover:-translate-y-1 transition-transform" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Whisper</span>
                            </button>
                            <button
                                onClick={() => { onIgnore(user.id, profileData?.username || user.username); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl sm:rounded-3xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95 group shadow-sm"
                            >
                                <Ban size={20} className="mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Ignore</span>
                            </button>
                            <button
                                onClick={() => { handleAddFriend(); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl sm:rounded-3xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95 group shadow-sm"
                            >
                                <UserPlus size={20} className="mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Connect</span>
                            </button>
                            <button
                                onClick={() => { onReport(user); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl sm:rounded-3xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all active:scale-95 group shadow-sm col-span-2"
                            >
                                <Flag size={20} className="mb-1 sm:mb-2 group-hover:animate-bounce transition-transform" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Report</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UserProfileModal;
