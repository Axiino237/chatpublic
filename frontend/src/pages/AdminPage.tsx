import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Shield,
    Users,
    Settings,
    MessageSquare,
    Flag,
    Eye,
    Search,
    Mail,
    Calendar,
    MapPin,
    ArrowLeft,
    Clock,
    Zap,
    LogIn,
    Bot,
    Trash2,
    PlusSquare,
    LayoutGrid,
    ShieldAlert,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'rooms' | 'chats' | 'settings'>('overview');
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [roomMessages, setRoomMessages] = useState<any[]>([]);

    // Detailed View State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userChats, setUserChats] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, settingsRes, reportsRes, roomsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/settings'),
                api.get('/reports'),
                api.get('/rooms')
            ]);
            setUsers(usersRes.data);
            setSettings(settingsRes.data);
            setReports(reportsRes.data);
            setRooms(roomsRes.data || []);
        } catch (e) {
            console.error('Failed to fetch admin data', e);
        }
    };

    const fetchUserDetails = async (id: string) => {
        try {
            const [profileRes, chatsRes] = await Promise.all([
                api.get(`/monitor/user/${id}`),
                api.get(`/monitor/user/${id}/chats`)
            ]);
            setSelectedUser(profileRes.data);
            setUserChats(chatsRes.data);
        } catch (e) {
            console.error('Failed to fetch details', e);
        }
    };

    const fetchRoomMessages = async (roomId: string) => {
        try {
            const res = await api.get(`/chat/room/${roomId}/messages`);
            setRoomMessages(res.data);
        } catch (e) {
            console.error('Failed to fetch room messages', e);
        }
    };

    const handleSuspend = async (userId: string) => {
        if (!window.confirm('Toggle suspension for this user?')) return;
        try {
            await api.patch(`/admin/suspend/${userId}`);
            fetchData();
            if (selectedUser?.id === userId) fetchUserDetails(userId);
        } catch (err) {
            console.error('Failed to suspend user', err);
        }
    };

    const handleVerify = async (userId: string) => {
        try {
            await api.patch(`/admin/users/${userId}/verify`);
            fetchData();
            if (selectedUser?.id === userId) fetchUserDetails(userId);
        } catch (err) {
            console.error('Failed to verify user', err);
        }
    };

    const toggleSetting = async (key: string) => {
        try {
            await api.patch('/admin/settings', { [key]: !settings[key] });
            const res = await api.get('/admin/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Failed to update settings', err);
        }
    };

    const handleAnnounce = async () => {
        const msgInput = document.getElementById('announcement-msg') as HTMLTextAreaElement;
        const msg = msgInput.value;
        if (!msg) return;
        try {
            await api.post('/admin/announce', { message: msg });
            alert('Announcement sent to all users!');
            msgInput.value = '';
        } catch (e) { console.error(e); }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* Advanced Admin Sidebar */}
                <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter">CONTROL</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrator</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: Shield },
                            { id: 'users', label: 'User Manager', icon: Users },
                            { id: 'rooms', label: 'Room Manager', icon: LayoutGrid },
                            { id: 'reports', label: 'Safety Reports', icon: Flag },
                            { id: 'chats', label: 'Global Monitor', icon: MessageSquare },
                            { id: 'settings', label: 'System Settings', icon: Settings },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setSelectedUser(null); }}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-x-1'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {item.id === 'reports' && reports.length > 0 && (
                                    <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                                        {reports.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">System Status</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-green-500">
                            <PlusSquare className="w-5 h-5 mr-2" />
                            API: ONLINE
                        </div>
                    </div>
                </aside>

                {/* Main Dynamic View */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#f8fafc] dark:bg-black/20">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-6xl mx-auto space-y-6"
                            >
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:gap-3 transition-all"
                                >
                                    <ArrowLeft size={16} /> Back to List
                                </button>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                        <div className="text-center mb-6">
                                            <img
                                                src={selectedUser.profilePictureUrl || 'https://via.placeholder.com/200'}
                                                className="h-32 w-32 rounded-full mx-auto border-4 border-gray-50 dark:border-gray-800 object-cover mb-4"
                                            />
                                            <h2 className="text-2xl font-black">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                            <p className="text-sm text-gray-500 font-medium">{selectedUser.email}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Mail size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Status</p>
                                                    <p className="text-xs font-bold">{selectedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><Calendar size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</p>
                                                    <p className="text-xs font-bold">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl"><MapPin size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                                                    <p className="text-xs font-bold">{selectedUser.location || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><Shield size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access IP</p>
                                                    <p className="text-xs font-bold font-mono">{selectedUser.lastLoginIp || 'No data'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><LogIn size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Device Type</p>
                                                    <p className="text-xs font-bold uppercase">{selectedUser.deviceType || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-xl"><Clock size={16} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</p>
                                                    <p className="text-xs font-bold">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                            <button
                                                onClick={() => handleSuspend(selectedUser.id)}
                                                className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all ${selectedUser.isSuspended
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                                    }`}
                                            >
                                                {selectedUser.isSuspended ? 'Reactive Account' : 'Suspend Account'}
                                            </button>
                                            {!selectedUser.isVerified && (
                                                <button
                                                    onClick={() => handleVerify(selectedUser.id)}
                                                    className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-tighter hover:bg-blue-700 transition-all"
                                                >
                                                    Manual Verify
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[700px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Message Activity</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                            {userChats.map((msg) => (
                                                <div key={msg.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-gray-400">
                                                            {msg.senderId === selectedUser.id ? 'Outgoing' : 'Incoming'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                            <Clock size={10} /> {new Date(msg.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-black tracking-tight capitalize">{activeTab}</h2>
                                    <div className="relative group">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600" />
                                        <input
                                            type="text"
                                            placeholder="Quick search..."
                                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-3 outline-none focus:ring-2 focus:ring-blue-600/20 text-sm font-medium w-80 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>

                                {activeTab === 'users' && (
                                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-[#fcfdfe] dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Identity</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Presence</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role/Special</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                    {users.map((u) => (
                                                        <tr key={u.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <img src={u.profilePictureUrl || `https://ui-avatars.com/api/?name=${u.firstName}`} className="h-10 w-10 rounded-full object-cover" />
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 dark:text-white mb-1">{u.firstName} {u.lastName} {u.isGuest && '(Guest)'}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-2 w-2 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                    <span className={`text-[10px] font-black uppercase ${u.isOnline ? 'text-green-600' : 'text-gray-400'}`}>{u.isOnline ? 'Active' : 'Offline'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                {u.isBot ? (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-purple-100 text-purple-600 flex items-center gap-1 w-fit">
                                                                        <Bot size={12} /> BOT
                                                                    </span>
                                                                ) : (
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                        {u.role || 'USER'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <button
                                                                    onClick={() => fetchUserDetails(u.id)}
                                                                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'reports' && (
                                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-[#fcfdfe] dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reporter</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reported</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason / Description</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date / Status</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                    {reports.map((r) => (
                                                        <tr key={r.id} className="group hover:bg-red-50/10 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={r.reporter?.profilePictureUrl || `https://ui-avatars.com/api/?name=${r.reporter?.firstName || 'User'}`} className="h-8 w-8 rounded-full" />
                                                                    <p className="text-[11px] font-black text-gray-700 dark:text-gray-300">@{r.reporter?.username || r.reporter?.firstName}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={r.reported?.profilePictureUrl || `https://ui-avatars.com/api/?name=${r.reported?.firstName || 'User'}`} className="h-8 w-8 rounded-full" />
                                                                    <p className="text-[11px] font-black text-red-500">@{r.reported?.username || r.reported?.firstName}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="max-w-xs">
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase tracking-tighter mb-1 inline-block">{r.reason}</span>
                                                                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2">{r.description || 'No description provided.'}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] font-bold text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${r.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                                        r.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                                                        }`}>
                                                                        {r.status}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {r.status === 'pending' && (
                                                                        <>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    await api.post(`/reports/${r.id}/status`, { status: 'resolved' });
                                                                                    fetchData();
                                                                                }}
                                                                                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                                                                            >
                                                                                <Shield size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    await api.post(`/reports/${r.id}/status`, { status: 'dismissed' });
                                                                                    fetchData();
                                                                                }}
                                                                                className="p-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-300 transition-all"
                                                                            >
                                                                                <Flag size={14} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => fetchUserDetails(r.reported?.id)}
                                                                        className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {reports.length === 0 && (
                                                <div className="py-20 flex flex-col items-center justify-center opacity-30 grayscale">
                                                    <Flag size={48} className="mb-4" />
                                                    <p className="text-xs font-black uppercase tracking-widest">No reports found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rooms' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <div>
                                                <h3 className="text-xl font-black">Manage Channels</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Create and control public/private chat rooms</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const name = window.prompt('Room Name:');
                                                    if (name) {
                                                        const desc = window.prompt('Description:');
                                                        await api.post('/rooms', { roomName: name, roomDescription: desc, roomType: 'PUBLIC' });
                                                        fetchData();
                                                    }
                                                }}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                            >
                                                <PlusSquare size={18} /> Create Room
                                            </button>
                                        </div>

                                        {!selectedRoom && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {rooms.map((room) => (
                                                    <motion.div
                                                        key={room.id}
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group"
                                                    >
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className={`p-3 rounded-2xl ${room.roomType === 'PUBLIC' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                <LayoutGrid size={20} />
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Delete this room?')) {
                                                                            await api.delete(`/rooms/${room.id}`);
                                                                            fetchData();
                                                                        }
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-xl font-black mb-1 group-hover:text-blue-600 transition-colors">{room.roomName}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mb-6 h-10">{room.roomDescription || 'No description provided.'}</p>

                                                        <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                                            <button
                                                                onClick={async () => {
                                                                    setSelectedRoom(room);
                                                                    await fetchRoomMessages(room.id);
                                                                }}
                                                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                                            >
                                                                Monitor Pulse
                                                            </button>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{room.roomType}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedRoom && (
                                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-black">Monitoring: {selectedRoom.roomName}</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live pulse Feed // {roomMessages.length} Messages</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedRoom(null)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                                <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
                                                    {roomMessages.map((msg: any) => (
                                                        <div key={msg.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] font-black text-blue-600">@{msg.sender?.username || 'user'}</span>
                                                                <span className="text-[9px] text-gray-400 font-bold">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{msg.content}</p>
                                                        </div>
                                                    ))}
                                                    {roomMessages.length === 0 && (
                                                        <div className="h-full flex items-center justify-center opacity-20">
                                                            <p className="text-xs font-black uppercase tracking-widest">Quiet Room</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-4 gap-6">
                                        {[
                                            { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
                                            { label: 'Online Status', value: users.filter(u => u.isOnline).length, icon: Zap, color: 'emerald' },
                                            { label: 'Active Reports', value: reports.length, icon: Flag, color: 'orange' },
                                            { label: 'Chat Volume', value: '1.2k', icon: MessageSquare, color: 'purple' },
                                        ].map((card, i) => (
                                            <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                                <div className={`p-4 bg-${card.color}-100 dark:bg-${card.color}-900/30 text-${card.color}-600 rounded-2xl w-fit mb-6`}>
                                                    <card.icon size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                                                <h3 className="text-4xl font-black tracking-tight">{card.value}</h3>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 space-y-10 max-w-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><Settings size={24} /></div>
                                                <div>
                                                    <h3 className="text-lg font-black leading-none mb-2">Session Control</h3>
                                                    <p className="text-xs text-gray-400 font-bold uppercase">Force disconnect stale sessions automatically</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleSetting('sessionControlEnabled')}
                                                className={`w-16 h-8 rounded-full relative transition-all ${settings?.sessionControlEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                                            >
                                                <div className={`h-6 w-6 bg-white rounded-full absolute top-1 transition-all ${settings?.sessionControlEnabled ? 'left-9' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Flag size={16} /></div>
                                                <h3 className="text-lg font-black tracking-tighter">Emergency Announcement</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <textarea
                                                    id="announcement-msg"
                                                    placeholder="Enter system-wide message..."
                                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-xs font-medium outline-none h-24 resize-none"
                                                />
                                                <button
                                                    onClick={handleAnnounce}
                                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                                                >
                                                    Broadcast to System
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminPage;
