import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { socketService } from '../services/socket.service';
import type { RootState } from '../store';
import {
    Send,
    ArrowLeft,
    Search,
    Smile,
    Paperclip,
    Ban,
    Info,
    Sparkles,
    Gift,
    MoreVertical,
    Phone,
    Video,
    Shield,
    Image as ImageIcon,
    Eye
} from 'lucide-react';
import { authService } from '../services/auth.service';
import GiftModal from '../components/GiftModal';
import FloatingTranslatorOrb from '../components/FloatingTranslatorOrb';

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date;
    senderRole?: string;
    status?: 'sending' | 'delivered' | 'failed';
}

const PrivateChatPage: React.FC = () => {
    const { id: recipientId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [recipientData, setRecipientData] = useState<any>(null);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [revealedMedia, setRevealedMedia] = useState<Set<string>>(new Set());
    const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
    const [isTranslationMode, setIsTranslationMode] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('es');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch recipient user data
    useEffect(() => {
        const fetchRecipientData = async () => {
            if (!recipientId) return;
            try {
                const res = await api.get(`/users/id/${recipientId}`);
                setRecipientData(res.data);
            } catch (err) {
                console.error('Failed to fetch recipient data', err);
            }
        };

        fetchRecipientData();
    }, [recipientId]);

    // Fetch message history
    useEffect(() => {
        const fetchHistory = async () => {
            if (!recipientId || !user?.id) return;
            try {
                const res = await api.get(`/chat/private/messages/${recipientId}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };

        fetchHistory();
    }, [recipientId, user?.id]);

    // Socket setup
    useEffect(() => {
        if (!token || !user?.id) return;
        const socket = socketService.getSocket() || socketService.connect(token);

        // Receive incoming message FROM the other person only
        const handleReceiveMessage = (message: any) => {
            // ONLY accept messages that the other person sent to me
            const isIncoming = message.senderId === recipientId && message.receiverId === user!.id;
            if (!isIncoming) return;

            setMessages((prev) => {
                // Strict dedup - ignore if we've already got this message id
                const exists = prev.find(m => message.id && m.id === message.id);
                if (exists) return prev;
                return [...prev, message];
            });
        };

        // Delivery ACK from backend - update optimistic message status
        const handleMessageDelivered = ({ messageId, tempId }: { messageId: string; tempId: string }) => {
            setMessages((prev) =>
                prev.map(m =>
                    m.id === tempId
                        ? { ...m, id: messageId, status: 'delivered' as const }
                        : m
                )
            );
        };

        // Socket errors - show inline
        const handleSocketError = (err: any) => {
            const msg = typeof err === 'string' ? err : (err?.message || 'Something went wrong.');
            if (msg !== 'Unauthorized') {
                // Show error as a failed "system" message
                setMessages(prev => [...prev, {
                    id: `err-${Date.now()}`,
                    senderId: 'SYSTEM',
                    content: `⚠️ ${msg}`,
                    createdAt: new Date(),
                    status: 'failed' as const
                }]);
            }
        };

        const handleTyping = (data: { userId: string }) => {
            if (data.userId === recipientId) setIsTyping(true);
        };

        const handleStopTyping = (data: { userId: string }) => {
            if (data.userId === recipientId) setIsTyping(false);
        };

        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('error', handleSocketError);
        socket.on('userTyping', handleTyping);
        socket.on('userStopTyping', handleStopTyping);

        socket.emit('join', user.id);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('message_delivered', handleMessageDelivered);
            socket.off('error', handleSocketError);
            socket.off('userTyping', handleTyping);
            socket.off('userStopTyping', handleStopTyping);
        };
    }, [token, user?.id, recipientId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = () => {
        if (!input.trim() || !recipientId) return;

        let contentToSend = input;
        if (isTranslationMode) {
            contentToSend = `[${targetLanguage.toUpperCase()}] ${input}`;
        }

        const socket = socketService.getSocket();
        if (socket) {
            const tempId = `pvt-${Date.now()}`;
            const messageData = {
                id: tempId,
                tempId,
                senderId: user?.id || '',
                receiverId: recipientId,
                content: contentToSend,
                createdAt: new Date(),
                status: 'sending' as const
            };

            socket.emit('sendMessage', messageData);
            setMessages((prev) => [...prev, messageData]);
            setInput('');
            socket.emit('stopTyping', { receiverId: recipientId });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !recipientId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/media/upload/chat-attachment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const socket = socketService.getSocket();
            if (socket) {
                const tempId = Date.now().toString();
                const messageData = {
                    id: tempId,
                    senderId: user?.id || '',
                    receiverId: recipientId,
                    content: res.data.url,
                    type: 'IMAGE',
                    createdAt: new Date(),
                    status: 'sending' as const
                };
                socket.emit('sendMessage', messageData);
                setMessages(prev => [...prev, messageData as any]);
            }
        } catch (err) {
            console.error('File upload failed', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        const socket = socketService.getSocket();
        if (socket && recipientId) {
            socket.emit('typing', { receiverId: recipientId });
        }
    };

    const generateIcebreaker = async () => {
        try {
            const res = await api.post('/ai/icebreaker', { targetId: recipientId });
            setInput(res.data);
        } catch (err) {
            console.error('Failed to generate icebreaker', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col overflow-hidden font-sans">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Premium Header */}
            <header className="relative z-10 px-4 sm:px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 sm:p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group flex-shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white" />
                    </button>

                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative flex-shrink-0">
                            <img
                                src={recipientData?.profilePictureUrl || `https://ui-avatars.com/api/?name=${recipientData?.firstName || 'User'}&background=random`}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg shadow-indigo-500/10"
                                alt=""
                            />
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-emerald-500 rounded-full border-[3px] sm:border-4 border-[#0a0a0f]"></div>
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2 truncate">
                                {recipientData?.firstName} {recipientData?.lastName}
                                {recipientData?.role === 'admin' && <Shield className="h-3 w-3 text-indigo-400 flex-shrink-0" />}
                            </h2>
                            <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-tighter truncate">
                                {isTyping ? 'Typing something special...' : 'Pulse Active'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button className="p-2 sm:p-3 hover:bg-white/5 rounded-2xl transition-all hidden sm:block">
                        <Phone className="h-5 w-5 text-gray-400" />
                    </button>
                    <button className="p-2 sm:p-3 hover:bg-white/5 rounded-2xl transition-all hidden sm:block">
                        <Video className="h-5 w-5 text-gray-400" />
                    </button>
                    <button className="p-2 sm:p-3 hover:bg-white/5 rounded-2xl transition-all">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-6 space-y-6 sm:space-y-8 scroll-smooth hide-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.id;
                        const isSystem = msg.senderId === 'SYSTEM';

                        // System error messages - shown centered
                        if (isSystem) {
                            return (
                                <motion.div
                                    key={msg.id || idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex justify-center"
                                >
                                    <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full">
                                        {msg.content}
                                    </span>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={msg.id || idx}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div className={`max-w-[85%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        relative px-4 sm:px-5 py-2 sm:py-3 rounded-[1.5rem] sm:rounded-[2rem] text-sm font-medium shadow-2xl
                                        ${isMe
                                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-indigo-500/20'
                                            : 'bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-tl-none'
                                        }
                                    `}>
                                        {(msg as any).type === 'IMAGE' ? (
                                            <div className="relative group/media overflow-hidden rounded-xl">
                                                {!revealedMedia.has(msg.id) ? (
                                                    <button
                                                        onClick={() => setRevealedMedia(prev => new Set([...prev, msg.id]))}
                                                        className="flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 p-6 sm:p-10 transition-all border border-white/5 rounded-xl min-w-[150px] sm:min-w-[200px]"
                                                    >
                                                        <div className="p-3 bg-indigo-500/20 rounded-full">
                                                            <Eye className="h-5 w-5 text-indigo-400" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Reveal Media</span>
                                                    </button>
                                                ) : (
                                                    <img
                                                        src={msg.content.startsWith('http') ? msg.content : `${api.defaults.baseURL?.replace('/api', '')}${msg.content}`}
                                                        className="max-w-full rounded-lg shadow-lg cursor-zoom-in"
                                                        alt="Private Attachment"
                                                        loading="lazy"
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    <div className={`mt-1.5 flex items-center gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-40 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && (
                                            <span className={msg.status === 'sending' ? 'animate-pulse text-yellow-300 opacity-80' : msg.status === 'delivered' ? 'text-emerald-400 opacity-90' : ''}>
                                                {msg.status === 'sending' ? '○ Sending' : msg.status === 'failed' ? '✕ Failed' : '✓ Sent'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex gap-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Premium Input Area */}
            <footer className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-[#0a0a0f] to-transparent mb-safe">
                <div className="max-w-5xl mx-auto">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1 sm:px-2 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={generateIcebreaker}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 transition-all group flex-shrink-0"
                        >
                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Boost</span>
                        </button>
                        <button
                            onClick={() => setIsGiftModalOpen(true)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 transition-all group flex-shrink-0"
                        >
                            <Gift className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-400">Send Gift</span>
                        </button>
                    </div>

                    {/* Main Input Bar */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-[2rem] sm:rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 pl-4 sm:pl-6 focus-within:border-indigo-500/50 transition-all">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={input}
                                onChange={handleInputChange}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-medium placeholder-white/30"
                            />

                            <div className="flex items-center gap-0.5 sm:gap-1">
                                <button className="p-2 sm:p-3 text-white/40 hover:text-white transition-colors">
                                    <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*,video/gif"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 sm:p-3 text-white/40 hover:text-white transition-colors"
                                >
                                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button className="p-2 sm:p-3 text-white/40 hover:text-white transition-colors">
                                    <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim()}
                                    className={`
                                        p-3 sm:p-4 rounded-full shadow-2xl transition-all
                                        ${input.trim()
                                            ? 'bg-indigo-600 text-white shadow-indigo-600/40 hover:scale-105 active:scale-95'
                                            : 'bg-white/5 text-white/20'
                                        }
                                    `}
                                >
                                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setIsGiftModalOpen(false)}
                receiverId={recipientId || ''}
                receiverName={recipientData?.firstName || ''}
            />

            <FloatingTranslatorOrb />
        </div>
    );
};

export default PrivateChatPage;
