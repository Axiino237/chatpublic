import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { socketService } from '../services/socket.service';
import type { RootState } from '../store';
import { Send, ArrowLeft, Search, Smile, Paperclip, Ban, Info, Sparkles } from 'lucide-react';
import { authService } from '../services/auth.service';
import { UserBadge } from '../components/ui/UserBadge';

interface Message {
    senderId: string;
    content: string;
    createdAt: Date;
    senderRole?: string;
}

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [recipientEmail] = useState(location.state?.targetEmail || '');
    const [recipientId, setRecipientId] = useState(location.state?.targetId || '');
    const [recipientData, setRecipientData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch recipient user data
    useEffect(() => {
        const fetchRecipientData = async (id: string) => {
            try {
                const res = await api.get(`/users/id/${id}`);
                setRecipientData(res.data);
            } catch (err) {
                console.error('Failed to fetch recipient data', err);
            }
        };

        if (recipientId && !recipientData) {
            fetchRecipientData(recipientId);
        }
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
        if (!token) return;
        const socket = socketService.getSocket() || socketService.connect(token);

        const handleReceiveMessage = (message: any) => {
            // Only add message if it's from the person we are currently chatting with
            if (message.senderId === recipientId || message.receiverId === recipientId) {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.find(m => (m as any).id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        // Join our own identity room to receive private messages
        if (user?.id) {
            socket.emit('join', user.id);
        }

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('error');
        };
    }, [token, user?.id, recipientId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim() || !recipientId) return;

        const socket = socketService.getSocket();
        if (socket) {
            const messageData = {
                senderId: user?.id || '',
                receiverId: recipientId,
                content: input,
            };

            socket.emit('sendMessage', messageData);

            // Add to local messages
            setMessages((prev) => [...prev, {
                senderId: user?.id || '',
                content: input,
                createdAt: new Date(),
            }]);

            setInput('');
        }
    };

    const handleBlock = async () => {
        if (!recipientId) return;
        if (window.confirm('Are you sure you want to block this user?')) {
            try {
                await authService.blockUser(recipientId);
                alert('User blocked successfully');
                navigate('/');
            } catch (err) {
                console.error('Failed to block user', err);
            }
        }
    };

    const handleReport = async () => {
        if (!recipientId) return;
        const reason = window.prompt('Enter reason for reporting:');
        if (reason) {
            try {
                await authService.reportUser(recipientId, reason);
                alert('Report submitted successfully');
            } catch (err) {
                console.error('Failed to report user', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {recipientEmail ? recipientEmail[0].toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">{recipientData?.firstName ? `${recipientData.firstName} ${recipientData.lastName || ''}` : recipientEmail || 'Select a chat'}</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-green-500 font-medium whitespace-nowrap">Online</p>
                                {recipientData?.location && (
                                    <>
                                        <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{recipientData.location}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {recipientId && (
                        <>
                            <button
                                onClick={() => handleReport()}
                                className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                                title="Report User"
                            >
                                <Info className="h-5 w-5" />
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await api.post('/ai/icebreaker', { targetId: recipientId });
                                        setInput(res.data);
                                    } catch (err) {
                                        console.error('Failed to generate icebreaker', err);
                                    }
                                }}
                                className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-full transition-all"
                                title="AI Icebreaker"
                            >
                                <Sparkles className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => handleBlock()}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Block User"
                            >
                                <Ban className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Chat Content */}
            <div className="max-w-4xl mx-auto space-y-4">
                {recipientData?.bio && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 mb-6">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">About {recipientData.firstName}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{recipientData.bio}"</p>
                    </div>
                )}

                {!recipientId && (
                    <div className="max-w-md mx-auto mt-20 text-center">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <Search className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">New Message</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">Enter a user's ID to start chatting</p>
                            <input
                                type="text"
                                placeholder="User ID"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${msg.senderId === user?.id
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                {msg.senderId !== user?.id && msg.senderRole && (
                                    <div className="mb-1">
                                        <UserBadge role={msg.senderRole} showText={false} className="scale-75 origin-left" />
                                    </div>
                                )}
                                <p className="text-sm font-medium">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                            <Smile className="h-5 w-5" />
                        </button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={!input.trim() || !recipientId}
                        className={`p-3 rounded-2xl shadow-lg transition-all ${!input.trim() || !recipientId ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' : 'bg-blue-600 dark:bg-blue-500 text-white shadow-blue-200 hover:bg-blue-700 dark:hover:bg-blue-600'}`}
                    >
                        <Send className="h-5 w-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
