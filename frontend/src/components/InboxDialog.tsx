import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { API_ORIGIN } from '../services/api';

interface InboxDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: any[];
    onConversationClick: (partner: any) => void;
}

const InboxDialog: React.FC<InboxDialogProps> = ({ isOpen, onClose, conversations, onConversationClick }) => {
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
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white leading-none">Private Inbox ({conversations.length})</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-emerald-600 transition-colors text-sm font-black uppercase tracking-widest"
                        >
                            CLOSE
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 hide-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] mb-6 shadow-inner">
                                    <MessageSquare size={48} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">No whispers yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.partner.id}
                                    onClick={() => {
                                        onConversationClick(conv.partner);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-5 p-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 text-left"
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={conv.partner.profilePictureUrl ? (conv.partner.profilePictureUrl.startsWith('http') ? conv.partner.profilePictureUrl : `${API_ORIGIN}${conv.partner.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${conv.partner.username}&background=random`}
                                            className="h-14 w-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                            alt={conv.partner.username}
                                        />
                                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5 leading-none">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-base text-gray-900 dark:text-white truncate mb-1">
                                                @{conv.partner.username}
                                            </span>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 truncate font-medium italic">
                                                {conv.senderId === conv.partner.id ? '' : 'You: '}{conv.content}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default InboxDialog;
