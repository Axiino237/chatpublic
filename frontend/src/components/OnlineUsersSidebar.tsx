import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
    Search,
    MoreHorizontal,
    Star,
    Zap,
    Heart,
    CheckCircle2,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string;
    role: string;
    status: string;
    isOnline?: boolean;
    badge?: string;
    location?: string;
}

interface OnlineUsersSidebarProps {
    users: User[];
    onUserClick?: (user: User) => void;
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string;
}

const OnlineUsersSidebar: React.FC<OnlineUsersSidebarProps> = ({ users, onUserClick, isOpen, onClose, currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Ensure current user and AI are always accounted for even if API hasn't updated yet
    const displayUsers = [...users];
    if (currentUserId && !displayUsers.find(u => u.id === currentUserId)) {
        displayUsers.push({ id: currentUserId, firstName: 'You', isOnline: true } as any);
    }
    if (!displayUsers.find(u => u.id === 'SYSTEM_AI')) {
        displayUsers.push({ id: 'SYSTEM_AI', firstName: 'AI Assistant', username: 'AI', role: 'AI_SYSTEM', isOnline: true } as any);
    }

    const filteredUsers = displayUsers
        .filter(u => (u.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (a.id === 'SYSTEM_AI') return -1;
            if (b.id === 'SYSTEM_AI') return 1;
            if (a.id === currentUserId) return -1;
            if (b.id === currentUserId) return 1;
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            const roleOrder: { [key: string]: number } = { admin: 0, monitor: 1, vip: 2, user: 3 };
            const aOrder = roleOrder[a.role] ?? 99;
            const bOrder = roleOrder[b.role] ?? 99;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.firstName.localeCompare(b.firstName);
        });

    const getBadgeIcon = (badge?: string) => {
        switch (badge) {
            case 'loyal': return <Star size={12} className="text-yellow-500 fill-current" />;
            case 'active': return <Zap size={12} className="text-orange-500 fill-current" />;
            case 'lovely': return <Heart size={12} className="text-pink-500 fill-current" />;
            case 'verified': return <CheckCircle2 size={12} className="text-blue-500 fill-current" />;
            default: return null;
        }
    };

    const getRoleStyles = (role: string) => {
        switch (role) {
            case 'admin': return 'text-red-600 dark:text-red-400 font-black';
            case 'monitor': return 'text-orange-600 dark:text-orange-400 font-black';
            case 'vip': return 'text-purple-600 dark:text-purple-400 font-black italic';
            default: return 'text-blue-600 dark:text-blue-400 font-bold';
        }
    };

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
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white leading-none">Explorers ({filteredUsers.length})</h3>
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
                                placeholder="Find explorers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-black shadow-sm placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1 hide-scrollbar">
                        {filteredUsers.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
                                <Users size={48} className="mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">No explorers here</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => onUserClick?.(user)}
                                    className={`flex items-center justify-between p-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 ${!user.isOnline ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="relative shrink-0">
                                            <img
                                                src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.firstName}&background=6366f1&color=fff`}
                                                alt={user.firstName}
                                                className={`h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-800 object-cover shadow-sm group-hover:scale-105 transition-transform ${!user.isOnline ? 'grayscale' : ''}`}
                                            />
                                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={`text-base truncate font-black ${getRoleStyles(user.role)}`}>
                                                    @{user.username || user.firstName} {user.id === currentUserId && <span className="text-[10px] text-gray-400 normal-case ml-1">(You)</span>}
                                                </span>
                                                {getBadgeIcon(user.badge || (user.role === 'admin' ? 'verified' : undefined))}
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest truncate">
                                                {user.isOnline ? (user.status || user.location || 'Online') : 'Offline'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.aside>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default OnlineUsersSidebar;
