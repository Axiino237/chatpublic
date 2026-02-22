import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Minus,
    Maximize2,
    Send,
    Smile,
    Paperclip,
    Mic,
    Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import GiftModal from './GiftModal';

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

interface PrivateChatOverlayProps {
    recipient: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl: string;
    };
    onClose: () => void;
    onSendMessage: (content: string) => void;
    messages: Message[];
}

const PrivateChatOverlay: React.FC<PrivateChatOverlayProps> = ({
    recipient,
    onClose,
    onSendMessage,
    messages
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed sm:bottom-0 sm:right-4 bottom-0 left-0 right-0 sm:w-[380px] glass-morphism shadow-2xl sm:rounded-t-[2rem] rounded-t-[2rem] z-[80] flex flex-col border-t sm:border border-white/20 transition-all duration-300 ${isMinimized ? 'h-16' : 'sm:h-[550px] h-[calc(100%-64px)] top-16 sm:top-auto'}`}
        >
            {/* Header */}
            <div
                className="p-4 luxe-gradient text-white rounded-t-[2rem] flex items-center justify-between cursor-pointer shadow-lg relative overflow-hidden"
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <img
                            src={recipient.profilePictureUrl || 'https://via.placeholder.com/150'}
                            alt={recipient.firstName}
                            className="h-10 w-10 rounded-full border-2 border-white/20 object-cover shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-indigo-600 shadow-sm"></div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black truncate w-32 uppercase tracking-widest text-white">
                            {recipient.firstName} {recipient.lastName}
                        </h4>
                        <p className="text-[9px] font-bold text-indigo-100/80 uppercase tracking-wider">Pulse Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 relative z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/messages/${recipient.id}`;
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm"
                        title="Go full screen"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 hover:bg-rose-500 rounded-xl transition-colors backdrop-blur-sm"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content (only if not minimized) */}
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl"
                    >
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-5 space-y-4"
                        >
                            {messages.map((msg) => {
                                const isMe = msg.senderId !== recipient.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-medium shadow-sm relative ${isMe
                                            ? 'luxe-gradient text-white rounded-tr-sm shadow-indigo-500/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                            }`}>
                                            {msg.content}
                                            <p className={`text-[9px] font-black uppercase tracking-wider mt-2 ${isMe ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Footer */}
                        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <button
                                    className={`transition-colors hover:scale-110 transform ${user?.isGuest ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-slate-400 hover:text-indigo-500'}`}
                                    disabled={!!user?.isGuest}
                                    title={user?.isGuest ? "Register to use emojis" : "Add Emoji"}
                                ><Smile size={18} /></button>
                                <button
                                    className={`transition-colors hover:scale-110 transform ${user?.isGuest ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-slate-400 hover:text-indigo-500'}`}
                                    disabled={!!user?.isGuest}
                                    title={user?.isGuest ? "Register to send attachments" : "Attach File"}
                                ><Paperclip size={18} /></button>
                                <button
                                    onClick={() => !user?.isGuest && setIsGiftModalOpen(true)}
                                    className={`transition-colors hover:scale-110 transform ${user?.isGuest ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-slate-400 hover:text-rose-500'}`}
                                    title={user?.isGuest ? "Register to send gifts" : "Send Gift"}
                                >
                                    <Gift size={18} />
                                </button>
                                <button
                                    className={`transition-colors hover:scale-110 transform ${user?.isGuest ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-slate-400 hover:text-indigo-500'}`}
                                    disabled={!!user?.isGuest}
                                    title={user?.isGuest ? "Register to send audio" : "Record Audio"}
                                ><Mic size={18} /></button>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-3 px-5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-slate-400 text-slate-900 dark:text-white"
                                />
                                <button
                                    onClick={handleSend}
                                    className="p-3 luxe-gradient text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setIsGiftModalOpen(false)}
                receiverId={recipient.id}
                receiverName={recipient.firstName}
            />
        </motion.div>
    );
};

export default PrivateChatOverlay;
