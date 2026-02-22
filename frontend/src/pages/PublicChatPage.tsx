import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket.service';
import { logout } from '../store/authSlice';
import { useTheme } from '../context';
import type { RootState } from '../store';
import {
    Send,
    Smile,
    PlusCircle,
    CheckCircle2,
    MessageCircle,
    MessageSquare,
    Mic2,
    Users,
    Search,
    Info,
    Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import NavigationDrawer from '../components/NavigationDrawer';
import OnlineUsersSidebar from '../components/OnlineUsersSidebar';
import FriendsSidebar from '../components/FriendsSidebar';
import PrivateChatOverlay from '../components/PrivateChatOverlay';
import AdComponent from '../components/AdComponent';
import TypingIndicator from '../components/TypingIndicator';
import UserProfileModal from '../components/UserProfileModal';
import UserContextMenu from '../components/UserContextMenu';
import ReportUserModal from '../components/ReportUserModal';
import EmojiPicker from '../components/EmojiPicker';
import FloatingTranslatorOrb from '../components/FloatingTranslatorOrb';
import api, { API_ORIGIN } from '../services/api';

const PublicChatPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);
    const { theme, toggleTheme } = useTheme();

    // State
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Explorers
    const [isFriendsOpen, setIsFriendsOpen] = useState(false); // Social

    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [roomData, setRoomData] = useState<any>(null);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
    const [activePrivateChats, setActivePrivateChats] = useState<any[]>([]);
    const [privateMessages, setPrivateMessages] = useState<{ [key: string]: any[] }>({});
    const [activeSpotlight, setActiveSpotlight] = useState<any>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; user: any }>({
        isOpen: false,
        x: 0,
        y: 0,
        user: null
    });
    const [whisperTarget, setWhisperTarget] = useState<any | null>(null);
    const [ignoredUsers, setIgnoredUsers] = useState<string[]>([]);
    const [socketStatus, setSocketStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
    const [isTranslationMode, setIsTranslationMode] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [chatError, setChatError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const ignoredUsersRef = useRef<string[]>([]);
    const syncInProgressRef = useRef(false);

    const fetchRoomData = async () => {
        if (!roomId) return;
        try {
            const [roomRes, allRoomsRes] = await Promise.all([
                api.get(`/rooms/${roomId}`),
                api.get('/rooms')
            ]);
            setRoomData(roomRes.data);
            setAllRooms(allRoomsRes.data);
        } catch (err) {
            console.error('Failed to fetch room data', err);
        }
    };

    const fetchHistory = async () => {
        if (!roomId || syncInProgressRef.current) return;
        syncInProgressRef.current = true;
        try {
            const url = user?.id ? `/chat/room/${roomId}/messages?userId=${user.id}` : `/chat/room/${roomId}/messages`;
            const res = await api.get(url);
            setMessages(res.data);
            console.log('[PublicChatPage] History synced successfully');
        } catch (err) {
            console.error('Failed to sync history', err);
        } finally {
            syncInProgressRef.current = false;
        }
    };

    useEffect(() => {
        ignoredUsersRef.current = ignoredUsers;
    }, [ignoredUsers]);

    useEffect(() => {
        const socket = socketService.getSocket() || (token ? socketService.connect(token) : null);

        if (socket) {
            setSocketStatus(socket.connected ? 'connected' : 'connecting');

            socket.on('connect', () => {
                console.log('[PublicChatPage] Socket connected');
                setSocketStatus('connected');
                if (roomId) socket.emit('joinPublic', roomId);
            });

            socket.on('disconnect', () => {
                console.log('[PublicChatPage] Socket disconnected');
                setSocketStatus('disconnected');
            });

            socket.on('reconnect', () => {
                console.log('[PublicChatPage] Socket reconnected');
                setSocketStatus('connected');
                if (roomId) socket.emit('joinPublic', roomId);
            });
        }

        // Fetch Data
        fetchRoomData();
        fetchHistory();

        if (socket && roomId) {
            socket.emit('joinPublic', roomId);

            socket.on('receivePublicMessage', (msg: any) => {
                console.log('[Frontend Debug] Received:', msg.type, 'Sender:', msg.senderId, 'Content:', msg.content);
                console.log('[Frontend Debug] My ID:', user?.id, 'Mentioned:', msg.mentionedUserIds);

                setMessages((prev) => {
                    // Gap Detection: if incoming message is > 30s away from latest, trigger sync
                    if (prev.length > 0) {
                        const lastMsg = prev[prev.length - 1];
                        const gap = new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime();
                        if (gap > 30000 || gap < -60000) {
                            console.warn('[PublicChatPage] Desync detected (gap: ' + gap + 'ms). Triggering sync...');
                            fetchHistory();
                        }
                    }

                    // Find an optimistic message (no ID) that matches sender and content
                    const optIndex = prev.findIndex(p =>
                        (msg.tempId && p.tempId === msg.tempId) ||
                        (!p.id &&
                            p.senderId === msg.senderId &&
                            p.content === msg.content &&
                            Math.abs(new Date(p.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000)
                    );

                    if (optIndex !== -1) {
                        // Replace optimistic message with server-enriched message
                        const newMessages = [...prev];
                        newMessages[optIndex] = { ...msg };
                        return newMessages;
                    }

                    // Standard duplicate check for server-to-server or persistent messages
                    const exists = prev.find(p => p.id && msg.id && p.id === msg.id);
                    if (exists) return prev;

                    return [...prev, msg];
                });

                // Side effects (Sound/Notifications)
                const isMentioned = msg.mentionedUserIds?.includes(user?.id);
                const isWhisper = msg.type === 'WHISPER' && msg.receiverId === user?.id;
                const isIgnored = ignoredUsersRef.current.includes(msg.senderId);

                if ((isMentioned || isWhisper) && !isIgnored && msg.senderId !== user?.id) {
                    const audio = new Audio('https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brads_hill-ondat.ogg');
                    audio.play().catch(e => console.log('Audio blocked', e));
                }
            });

            // Listen for active users in room
            socket.on('activeUsers:update', (users: any[]) => {
                setOnlineUsers(users);
                // Badge Logic could go here (e.g. setExplorerCount)
            });

            // Listen for private messages while in public chat
            socket.on('receiveMessage', (msg: any) => {
                setPrivateMessages(prev => {
                    const existing = prev[msg.senderId] || [];
                    // Check for duplicate by temporary ID (optimistic) or match fingerprint
                    const duplicateIndex = existing.findIndex(p =>
                        (p.id && msg.id && p.id === msg.id) ||
                        (!p.id.includes('-') && p.senderId === msg.senderId && p.content === msg.content && Math.abs(new Date(p.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000)
                    );

                    if (duplicateIndex !== -1) {
                        const next = [...existing];
                        next[duplicateIndex] = msg;
                        return { ...prev, [msg.senderId]: next };
                    }

                    return {
                        ...prev,
                        [msg.senderId]: [...existing, msg]
                    };
                });

                // Automatically open chat overlay if not already active
                setActivePrivateChats(prev => {
                    if (!prev.find(p => p.id === msg.senderId)) {
                        // We need user info to open chat, but msg only has senderId.
                        // For now, we'll fetch or assume we have the list.
                        return prev;
                    }
                    return prev;
                });
            });

            socket.on('spotlightEvent', (event: any) => {
                setActiveSpotlight(event);
            });

            // Listen for typing events
            socket.on('userTyping', (data: { userId: string; userEmail: string }) => {
                setTypingUsers((prev) => {
                    if (!prev.includes(data.userEmail)) {
                        return [...prev, data.userEmail];
                    }
                    return prev;
                });
            });

            socket.on('userStopTyping', (data: { userId: string; userEmail: string }) => {
                setTypingUsers((prev) => prev.filter((email) => email !== data.userEmail));
            });

            socket.on('message_delivered', (data: { messageId: string, tempId: string }) => {
                setMessages((prev) => prev.map(m =>
                    m.tempId === data.tempId ? { ...m, id: data.messageId, status: 'delivered' } : m
                ));
            });

            socket.on('delivery_failed', (data: { reason: string, tempId: string }) => {
                setMessages((prev) => prev.map(m =>
                    m.tempId === data.tempId ? { ...m, status: 'failed', error: data.reason } : m
                ));
            });

            socket.on('user_muted', (data: { remainingTime: string }) => {
                setChatError(`🔇 You have been muted for ${data.remainingTime} due to a policy violation.`);
                setTimeout(() => setChatError(null), 5000);
                api.get('/users/me').then(() => { });
            });

            socket.on('error', (err: any) => {
                console.error('Socket error:', err);
                const errorMsg = typeof err === 'string' ? err : (err?.message || 'Something went wrong.');
                if (errorMsg === 'Unauthorized') {
                    console.warn('[PublicChatPage] Socket unauthorized. Redirecting to login...');
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }, 500);
                } else {
                    setChatError(errorMsg);
                    setTimeout(() => setChatError(null), 5000);
                }
            });
        }

        // User list polling fallback
        const pollInterval = setInterval(() => {
            if (socket && roomId && socket.connected) {
                socket.emit('joinPublic', roomId); // Re-join triggers broadcast
            }
        }, 30000);

        return () => {
            clearInterval(pollInterval);
            if (socket && roomId) {
                socket.emit('leavePublic', roomId);
                socket.off('receivePublicMessage');
                socket.off('activeUsers:update');
                socket.off('receiveMessage');
                socket.off('error');
            }
        };
    }, [roomId, token]);

    useEffect(() => {
        const handleOpenPrivate = (e: any) => {
            startPrivateChat(e.detail);
        };
        const handleStartWhisper = (e: any) => {
            setWhisperTarget(e.detail);
        };
        window.addEventListener('openPrivateChat', handleOpenPrivate);
        window.addEventListener('startWhisper', handleStartWhisper);
        return () => {
            window.removeEventListener('openPrivateChat', handleOpenPrivate);
            window.removeEventListener('startWhisper', handleStartWhisper);
        };
    }, [activePrivateChats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !user || !roomId) return;

        let contentToSend = input;
        if (isTranslationMode) {
            // Mock translation for instant feedback
            contentToSend = `[${targetLanguage.toUpperCase()}] ${input}`;
        }

        const socket = socketService.getSocket();
        if (socket) {
            const tempId = `temp-${Date.now()}`;
            const messageData: any = {
                tempId,
                roomId,
                senderId: user.id,
                username: user.username,
                content: contentToSend,
                message: contentToSend,
                userEmail: user.email,
                badge: user.badge,
                createdAt: new Date(),
                status: 'sending'
            };

            if (whisperTarget) {
                // Optimistic Whisper
                messageData.type = 'WHISPER';
                messageData.receiverId = whisperTarget.id;
                messageData.receiverUsername = whisperTarget.username || whisperTarget.firstName;

                setMessages((prev) => [...prev, messageData]);

                socket.emit('sendWhisper', {
                    tempId,
                    receiverId: whisperTarget.id,
                    content: contentToSend,
                    roomId
                });
            } else {
                // Optimistic Public Message
                setMessages((prev) => [...prev, messageData]);
                socket.emit('sendPublicMessage', { ...messageData, tempId });
            }

            // Stop typing when message sent
            socket.emit('stopTyping', { roomId, userId: user.id, userEmail: user.email });

            setInput('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        if (!user || !roomId) return;
        const socket = socketService.getSocket();
        if (!socket) return;

        // Emit typing event
        socket.emit('typing', { roomId, userId: user.id, userEmail: user.email });

        // Clear previous timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Set new timeout to emit stop typing after 2 seconds of inactivity
        const timeout = setTimeout(() => {
            socket.emit('stopTyping', { roomId, userId: user.id, userEmail: user.email });
        }, 2000);

        setTypingTimeout(timeout);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !roomId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const tempId = `temp-img-${Date.now()}`;
            const optimisticMsg = {
                tempId,
                roomId,
                senderId: user.id,
                username: user.username,
                content: URL.createObjectURL(file), // blob preview
                type: 'IMAGE', // Consistency
                createdAt: new Date(),
                status: 'sending'
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const res = await api.post('/media/upload/chat-attachment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('[PublicChatPage] Image uploaded:', res.data);

            const socket = socketService.getSocket();
            if (!socket) return;
            socket.emit('sendPublicMessage', {
                tempId,
                roomId,
                senderId: user.id,
                content: res.data.url,
                type: 'IMAGE', // Consistency: Use Uppercase
                userEmail: user.email
            });
        } catch (err) {
            console.error('File upload failed', err);
            // Could add error state to optimistic message here
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const startPrivateChat = (targetUser: any) => {
        if (!user || targetUser.id === user.id) return;
        navigate(`/messages/${targetUser.id}`);
    };

    const sendPrivateMessage = (recipientId: string, content: string) => {
        const socket = socketService.getSocket();
        if (socket && user) {
            const msg = {
                id: Date.now().toString(),
                senderId: user.id,
                receiverId: recipientId,
                content,
                createdAt: new Date()
            };
            socket.emit('sendMessage', msg);
            setPrivateMessages(prev => ({
                ...prev,
                [recipientId]: [...(prev[recipientId] || []), msg]
            }));
        }
    };

    // Modal Handlers
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [reportedProfile, setReportedProfile] = useState<any>(null);

    const handleUsernameClick = (e: React.MouseEvent, target: any) => {
        e.preventDefault();
        if (!user || target.id === user.id || target.id === 'ai-system') return;
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            user: target
        });
    };

    const handleContextMenuAction = async (action: string, targetUser: any) => {
        switch (action) {
            case 'tag':
                handleTagUser(targetUser.username || targetUser.firstName);
                break;
            case 'message':
                startPrivateChat(targetUser);
                break;
            case 'whisper':
                setWhisperTarget(targetUser);
                break;
            case 'profile':
                setSelectedProfile(targetUser);
                break;
            case 'friend':
                try {
                    await api.post('/social/friend/request', { addresseeId: targetUser.id });
                    alert(`Friend request sent to ${targetUser.username || targetUser.firstName}`);
                } catch (e) {
                    alert('Failed to send friend request');
                }
                break;
            case 'ignore':
                handleIgnoreUser(targetUser.id, targetUser.username || targetUser.firstName);
                break;
            case 'report':
                setReportedProfile(targetUser);
                break;
        }
    };

    const handleTagUser = (username: string) => {
        setInput(prev => `${prev} @${username} `);
        // Focus input logic if needed
    };

    const handleWhisperUser = (target: any) => {
        // Prepare UI for whisper (e.g. prefix input or open private chat)
        // For distinct whisper flow requested:
        const msg = window.prompt(`Send private whisper to @${target.username || target.firstName}:`);
        if (msg) {
            socketService.getSocket()?.emit('sendWhisper', { receiverId: target.id, content: msg, roomId });
        }
    };


    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                const res = await api.get('/blocks');
                setIgnoredUsers(res.data.map((b: any) => b.blocked.id));
            } catch (err) {
                console.error('Failed to fetch blocked users', err);
            }
        };

        if (token) {
            fetchBlockedUsers();
        }
    }, [token]);

    const handleIgnoreUser = async (userId: string, username?: string) => {
        if (window.confirm(`Are you sure you want to ignore ${username || 'this user'}?`)) {
            try {
                await api.post(`/blocks/${userId}`);
                setIgnoredUsers(prev => [...prev, userId]);
                alert('User is now ignored across the platform.');
            } catch (e) {
                console.error('Failed to ignore user', e);
                alert('Failed to ignore user');
            }
        }
    };

    // Filter messages
    const visibleMessages = messages.filter(msg => !ignoredUsers.includes(msg.senderId));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleMessages]); // Update scroll on filtered list


    return (
        <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden md:pb-0 pb-safe">
            <AnimatePresence>
                {socketStatus !== 'connected' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                    >
                        <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="h-20 w-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`h-4 w-4 rounded-full ${socketStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'}`}></div>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black uppercase tracking-widest mb-2">
                                    {socketStatus === 'connecting' ? 'Initializing Pulse...' : 'Connection Lost'}
                                </h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    {socketStatus === 'connecting' ? 'Establishing secure link to the lobby' : 'Attempting to reconnect to the pulse...'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UserProfileModal
                isOpen={!!selectedProfile}
                onClose={() => setSelectedProfile(null)}
                user={selectedProfile}
                onTag={handleTagUser}
                onWhisper={handleWhisperUser}
                onIgnore={handleIgnoreUser}
                onReport={(u) => setReportedProfile(u)}
                isMe={selectedProfile?.id === user?.id}
                onLogout={() => {
                    dispatch(logout());
                    navigate('/login');
                }}
                currentTheme={theme}
                onToggleTheme={toggleTheme}
            />
            <ReportUserModal
                isOpen={!!reportedProfile}
                onClose={() => setReportedProfile(null)}
                reportedUser={reportedProfile}
            />
            <UserContextMenu
                isOpen={contextMenu.isOpen}
                onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                position={{ x: contextMenu.x, y: contextMenu.y }}
                targetUser={contextMenu.user}
                onAction={handleContextMenuAction as any}
            />
            <Header
                onMenuClick={() => setIsDrawerOpen(true)}
                onFriendsClick={() => setIsFriendsOpen(true)}
            />
            {/* ... rest of JSX ... */}
            <NavigationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
            <OnlineUsersSidebar
                users={onlineUsers}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onUserClick={(u) => {
                    setSelectedProfile(u);
                    if (window.innerWidth < 640) setIsSidebarOpen(false);
                }}
            />
            <FriendsSidebar
                isOpen={isFriendsOpen}
                onClose={() => setIsFriendsOpen(false)}
                onStartWhisper={(friend) => setWhisperTarget(friend)}
            />

            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-0">
                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 shadow-xl z-10 relative">
                    {/* Room Header / Info Bar */}
                    <div className="flex-none px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative group/switcher">
                                <button
                                    onClick={() => setIsRoomSwitcherOpen(!isRoomSwitcherOpen)}
                                    className="h-10 w-10 luxe-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform active:scale-95"
                                >
                                    <MessageSquare size={20} />
                                </button>

                                <AnimatePresence>
                                    {isRoomSwitcherOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden backdrop-blur-xl"
                                        >
                                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Switch Room</h3>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto p-1.5">
                                                {allRooms.map(room => (
                                                    <button
                                                        key={room.id}
                                                        onClick={() => {
                                                            navigate(`/room/${room.id}`);
                                                            setIsRoomSwitcherOpen(false);
                                                        }}
                                                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${room.id === roomId ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={`text-xs font-bold ${room.id === roomId ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                {room.roomName || 'Untitled Room'}
                                                            </span>
                                                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                                                                {room.onlineCount || 0} Explorers
                                                            </span>
                                                        </div>
                                                        {room.id === roomId && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div>
                                <h1
                                    className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none mb-1 cursor-pointer hover:text-indigo-500 transition-colors flex items-center gap-2"
                                    onClick={() => setIsRoomSwitcherOpen(!isRoomSwitcherOpen)}
                                >
                                    {roomData?.roomName || 'Lobby'}
                                    <div className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-gray-400 transition-transform ${isRoomSwitcherOpen ? 'rotate-180' : ''}`}></div>
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                        {Math.max(onlineUsers.length, roomData?.onlineCount || 0)} Explorers Pulsing
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <Search size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hidden sm:block">
                                <Info size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Spotlight / Live Area */}
                    <AnimatePresence>
                        {activeSpotlight && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-6 border-b border-white/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center animate-pulse">
                                            <Mic2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-200">Live Spotlight</h3>
                                            <p className="text-lg font-black tracking-tight">{activeSpotlight.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">On Air</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 rounded-[2rem] p-4 border border-white/5 backdrop-blur-sm">
                                    <p className="text-xs font-medium text-blue-100 leading-relaxed italic">
                                        "{activeSpotlight.message}"
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Public Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar bg-white dark:bg-gray-900">
                        {visibleMessages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <MessageCircle size={48} className="mb-4 opacity-20" />
                                <p className="font-bold text-sm">Welcome to the Room!</p>
                                <p className="text-[10px] uppercase font-black tracking-widest">Keep it friendly and fun.</p>
                            </div>
                        )}

                        {visibleMessages.map((msg, index) => {
                            const isSystem = msg.senderId === 'ai-system';
                            const showAd = index > 0 && index % 5 === 0;
                            const isTagged = msg.mentionedUserIds?.includes(user?.id);

                            // Grouping Logic
                            const prevMsg = visibleMessages[index - 1];
                            const isSequence = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60000);
                            const showAvatar = !isSequence || isSystem;

                            // Format display name: username, then email part, then fallback
                            const displayName = isSystem ? 'AI Assistant' : (msg.username || msg.userEmail?.split('@')[0] || 'Unknown Explorer');

                            // Format Content (Mentions & Whispers)
                            const formatContent = (content: string) => {
                                if (msg.type === 'WHISPER') {
                                    const isOutgoing = msg.senderId === user?.id;
                                    const otherParty = isOutgoing ? (msg.receiverUsername || 'User') : (msg.username || 'User');
                                    return (
                                        <div className="flex flex-col gap-2 relative overflow-hidden group/whisper max-w-full">
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-tighter sm:tracking-widest text-indigo-600 dark:text-indigo-400 opacity-80 z-10">
                                                <span className="p-1 px-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shadow-sm whitespace-nowrap">🔒 Secret Whisper</span>
                                                <span className="hidden sm:inline flex-1 border-b border-indigo-200 dark:border-indigo-800 border-dashed mx-1"></span>
                                                <span className="truncate max-w-[100px] sm:max-w-none">{isOutgoing ? `To @${otherParty}` : `From @${displayName}`}</span>
                                            </div>
                                            <div className="italic opacity-90 text-indigo-900 dark:text-indigo-100 pl-2 border-l-2 border-indigo-300 dark:border-indigo-700 break-words line-clamp-4">
                                                {content || '(No message content)'}
                                            </div>
                                        </div>
                                    );
                                }
                                if (msg.type === 'IMAGE' || msg.type === 'image') {
                                    const imageUrl = msg.content.startsWith('http') || msg.content.startsWith('blob:')
                                        ? msg.content
                                        : `${API_ORIGIN}${msg.content.startsWith('/') ? '' : '/'}${msg.content}`;

                                    return (
                                        <div className="flex flex-col gap-2">
                                            <div className="relative group/image overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                <img
                                                    src={imageUrl}
                                                    alt="Attachment"
                                                    className="max-w-xs md:max-w-sm rounded-lg object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error('❌ [PublicChatPage] Image failed to load:', imageUrl);
                                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Error&background=f43f5e&color=fff&text=Broken';
                                                    }}
                                                />
                                            </div>
                                            {msg.message && msg.message !== msg.content && (
                                                <div className="text-xs opacity-80 italic">{msg.message}</div>
                                            )}
                                        </div>
                                    );
                                }
                                // Highlight mentions (PUBLIC, MENTION)
                                const parts = (content || '').split(/(@[a-zA-Z0-9._-]+)/g);
                                return parts.map((part, i) => {
                                    if (part.startsWith('@')) {
                                        const username = part.substring(1);
                                        return (
                                            <span
                                                key={i}
                                                className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors mx-0.5"
                                                onClick={(e) => handleMentionClick(e, username)}
                                            >
                                                {part}
                                            </span>
                                        );
                                    }
                                    return part;
                                });
                            };

                            const handleMentionClick = (e: React.MouseEvent, username: string) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Try to find user in online list or sender/receiver of current message
                                let targetUser = onlineUsers.find(u => u.username?.toLowerCase() === username.toLowerCase() || (u.firstName && u.firstName.toLowerCase() === username.toLowerCase()));

                                if (!targetUser) {
                                    if (msg.username?.toLowerCase() === username.toLowerCase()) {
                                        targetUser = { id: msg.senderId, username: msg.username, firstName: msg.username || displayName, profilePictureUrl: msg.profilePictureUrl };
                                    } else if (msg.receiverUsername?.toLowerCase() === username.toLowerCase()) {
                                        targetUser = { id: msg.receiverId, username: msg.receiverUsername, firstName: msg.receiverUsername };
                                    }
                                }

                                if (targetUser) {
                                    setContextMenu({
                                        isOpen: true,
                                        x: e.clientX,
                                        y: e.clientY,
                                        user: { ...targetUser, firstName: targetUser.firstName || targetUser.username }
                                    });
                                }
                            };

                            const messageKey = msg.id || `${msg.senderId}-${msg.createdAt}-${index}`;


                            const isMe = msg.senderId === user?.id;

                            return (
                                <React.Fragment key={messageKey}>
                                    {showAd && <AdComponent />}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: isTagged ? 1.02 : 1 }}
                                        className={`flex gap-3 group transition-all duration-300 ${isSequence ? 'mt-1' : 'mt-4'} ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isTagged ? 'pl-4 border-l-4 border-yellow-400 bg-yellow-500/5 rounded-r-xl py-2 my-2 shadow-sm shadow-yellow-500/10' : ''}`}
                                    >
                                        {!isMe && (
                                            <div className="relative w-8 flex-shrink-0 self-end mb-1">
                                                {showAvatar ? (
                                                    <img
                                                        src={isSystem ? `https://ui-avatars.com/api/?name=AI&background=4f46e5&color=fff` : (msg.profilePictureUrl ? (msg.profilePictureUrl.startsWith('http') ? msg.profilePictureUrl : `${API_ORIGIN}${msg.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${displayName}&background=random`)}
                                                        className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 cursor-pointer shadow-sm object-cover hover:scale-110 transition-transform"
                                                        alt={displayName}
                                                        onClick={(e) => handleUsernameClick(e, { id: msg.senderId, firstName: displayName, username: msg.username || displayName, profilePictureUrl: msg.profilePictureUrl, isOnline: true })}
                                                    />
                                                ) : (
                                                    <div className="w-8" />
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {showAvatar && !isMe && (
                                                <div className="flex items-center gap-2 mb-1 ml-1 overflow-hidden max-w-full">
                                                    <span
                                                        className={`text-[10px] sm:text-[11px] font-black cursor-pointer hover:underline tracking-tight truncate ${isSystem ? 'text-indigo-500' : 'text-slate-600 dark:text-slate-400'}`}
                                                        onClick={(e) => handleUsernameClick(e, { id: msg.senderId, firstName: displayName, username: msg.username || displayName, profilePictureUrl: msg.profilePictureUrl, isOnline: true })}
                                                    >
                                                        {displayName}
                                                    </span>
                                                    {isSystem && <span className="text-[8px] sm:text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 rounded uppercase font-mono">BOT</span>}
                                                    {msg.badge && !isSystem && (
                                                        <span className="text-[8px] sm:text-[9px] font-black bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-1.5 rounded uppercase tracking-wider scale-90 origin-left truncate max-w-[60px]">
                                                            {msg.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`px-4 py-2.5 shadow-sm text-sm relative break-words transition-all
                                                ${!showAvatar && !isMe ? 'rounded-tl-none rounded-bl-xl' : 'rounded-2xl'}
                                                ${!showAvatar && isMe ? 'rounded-tr-none rounded-br-xl' : 'rounded-2xl'}
                                                ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}
                                                ${isSystem
                                                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-100 w-full'
                                                    : msg.type === 'WHISPER'
                                                        ? 'bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/50 text-gray-800 dark:text-gray-200 w-full'
                                                        : isMe
                                                            ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                                                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                                                }
                                            `}>
                                                {msg.type === 'IMAGE' || msg.type === 'image'
                                                    ? formatContent(msg.message || '') // Only show caption if exists
                                                    : formatContent(msg.message || msg.content)
                                                }
                                            </div>

                                            <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isMe ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                                {isMe && (msg.status === 'delivered' || msg.id) && <CheckCircle2 size={10} className="text-emerald-500" />}
                                                {isMe && msg.status === 'sending' && <div className="h-2 w-2 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
                                                <span className="opacity-70">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}
                        {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Chat Input Area with Whisper Mode Indicator */}
                    <div className="flex-none p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative z-20">
                        <AnimatePresence>
                            {whisperTarget && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg border border-indigo-500 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                                            <MessageSquare size={16} className="text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-80 leading-tight">One-to-One Mode</span>
                                            <span className="text-sm font-bold">
                                                Whispering to <span className="underline decoration-indigo-300 underline-offset-4">@{whisperTarget.username || whisperTarget.firstName}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setWhisperTarget(null)}
                                        className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors flex items-center gap-2"
                                        title="Cancel Whisper"
                                    >
                                        <span className="text-[10px] font-black uppercase pr-1 hidden sm:inline">Cancel</span>
                                        <PlusCircle size={16} className="rotate-45" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error / Mute Banner */}
                        <AnimatePresence>
                            {chatError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                                    className="w-full max-w-4xl mx-auto mb-2 flex items-center gap-3 bg-rose-500 text-white px-4 py-3 rounded-2xl shadow-lg shadow-rose-500/20 text-xs font-bold"
                                >
                                    <span className="flex-1">🔇 {chatError}</span>
                                    <button
                                        onClick={() => setChatError(null)}
                                        className="text-white/60 hover:text-white transition-colors text-xs font-black uppercase"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="w-full max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-100 dark:shadow-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center gap-1.5 sm:gap-2 border border-indigo-100 dark:border-indigo-800"
                                title="Show Online Users"
                            >
                                <div className="relative">
                                    <Users size={18} className="sm:w-5 sm:h-5" />
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                </div>
                                <div className="flex flex-col items-start leading-none pr-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Explorers</span>
                                    <span className="text-[9px] font-bold opacity-70">{onlineUsers.length || roomData?.onlineCount || 0} Live</span>
                                </div>
                            </button>
                            <div className="h-4 sm:h-6 w-px bg-gray-100 dark:bg-gray-700 mx-0.5"></div>

                            <button
                                className={`p-1.5 sm:p-2 transition-colors ${user?.isGuest ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`}
                                onClick={() => !user?.isGuest && fileInputRef.current?.click()}
                                title={user?.isGuest ? "Register to send media" : "Attach Image"}
                            >
                                <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                            </button>
                            {/* Hidden file input - one instance */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <input
                                type="text"
                                placeholder={user?.mutedUntil && new Date(user.mutedUntil) > new Date()
                                    ? `🔇 Muted until ${new Date(user.mutedUntil).toLocaleTimeString()}`
                                    : (user?.isGuest && whisperTarget ? "Guests cannot whisper..." : (whisperTarget ? `Secret @${whisperTarget.username || whisperTarget.firstName}...` : "Message..."))}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={!!(user?.mutedUntil && new Date(user.mutedUntil) > new Date())}
                                className={`flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 min-w-0 ${user?.mutedUntil && new Date(user.mutedUntil) > new Date() ? 'cursor-not-allowed opacity-50' : ''}`}
                            />
                            <div className="flex items-center gap-0.5 sm:gap-1 relative">
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <EmojiPicker
                                            onSelect={(emoji) => {
                                                setInput(prev => prev + emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            onClose={() => setShowEmojiPicker(false)}
                                        />
                                    )}
                                </AnimatePresence>
                                <div className="flex items-center gap-1 sm:gap-2">

                                    <button
                                        className={`p-1.5 sm:p-2 transition-colors ${user?.isGuest ? 'text-gray-200 cursor-not-allowed opacity-30' : (showEmojiPicker ? 'text-indigo-600' : 'text-gray-400 hover:text-blue-500')}`}
                                        onClick={() => !user?.isGuest && setShowEmojiPicker(!showEmojiPicker)}
                                        title={user?.isGuest ? "Register to use emojis/GIFs" : "Add Emoji"}
                                    ><Smile size={18} className="sm:w-5 sm:h-5" /></button>
                                    <button
                                        className={`p-1.5 sm:p-2 transition-colors ${user?.isGuest ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`}
                                        onClick={() => !user?.isGuest && fileInputRef.current?.click()}
                                        title={user?.isGuest ? "Register to send media" : "Attach Image"}
                                    >
                                        <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                                    >
                                        <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <OnlineUsersSidebar
                    users={onlineUsers}
                    currentUserId={user?.id}
                    onUserClick={(u) => handleUsernameClick({ clientX: window.innerWidth - 300, clientY: 100 } as any, u)}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div >

            {/* Floating Private Chats */}
            <div className="fixed bottom-0 right-0 flex flex-row-reverse items-end pr-4 pointer-events-none">
                <AnimatePresence>
                    {activePrivateChats.map((chat) => (
                        <div key={chat.id} className="pointer-events-auto ml-4">
                            <PrivateChatOverlay
                                recipient={chat}
                                onClose={() => setActivePrivateChats(prev => prev.filter(c => c.id !== chat.id))}
                                onSendMessage={(content) => sendPrivateMessage(chat.id, content)}
                                messages={privateMessages[chat.id] || []}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Floating Translator Orb - drag onto any text to translate */}
            <FloatingTranslatorOrb />
        </div>
    );

};


export default PublicChatPage;
