import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, MessageSquare, User, UserPlus, Ban, Flag } from 'lucide-react';

interface UserContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    targetUser: {
        id: string;
        username: string;
        firstName?: string;
        profilePictureUrl?: string;
        badge?: string;
        role?: string;
    } | null;
    onAction: (action: 'tag' | 'message' | 'whisper' | 'profile' | 'friend' | 'ignore' | 'report', user: any) => void;
}

const UserContextMenu: React.FC<UserContextMenuProps> = ({ isOpen, onClose, position, targetUser, onAction }) => {
    if (!isOpen || !targetUser) return null;

    const actions = [
        { id: 'tag', label: 'Mention', icon: AtSign, color: 'text-indigo-500' },
        { id: 'message', label: 'Message', icon: MessageSquare, color: 'text-sky-500' },
        { id: 'whisper', label: 'Whisper', icon: MessageSquare, color: 'text-emerald-500' },
        { id: 'profile', label: 'View Profile', icon: User, color: 'text-blue-500' },
        { id: 'friend', label: 'Add Friend', icon: UserPlus, color: 'text-pink-500' },
        { id: 'ignore', label: 'Ignore User', icon: Ban, color: 'text-red-500' },
        { id: 'report', label: 'Report User', icon: Flag, color: 'text-orange-500' },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{
                        top: Math.min(position.y, window.innerHeight - 300),
                        left: Math.min(position.x, window.innerWidth - 200)
                    }}
                    className="absolute bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with User Info */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Exploration Actions</p>
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {targetUser.username || targetUser.firstName}
                        </p>
                    </div>

                    {/* Action List */}
                    <div className="p-1">
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    onAction(action.id as any, targetUser);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all group"
                            >
                                <action.icon size={16} className={`${action.color} group-hover:scale-110 transition-transform`} />
                                {action.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UserContextMenu;
