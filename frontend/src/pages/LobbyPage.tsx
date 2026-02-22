import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    MessageSquare,
    Users,
    Plus,
    ArrowRight,
    Shield,
    Search,
    Zap,
    Pencil,
    Trash
} from 'lucide-react';
import EditRoomModal from '../components/EditRoomModal';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import Header from '../components/Header';
import NavigationDrawer from '../components/NavigationDrawer';

const LobbyPage: React.FC = () => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        }
    };

    const handleDeleteRoom = async (roomId: string, roomName: string) => {
        if (window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/rooms/${roomId}`);
                fetchRooms();
            } catch (err) {
                console.error('Failed to delete room', err);
                alert('Failed to delete room');
            }
        }
    };

    const handleEditRoom = (room: any) => {
        setEditingRoom(room);
        setIsEditModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Rooms Section Header */}
                    <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 mt-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 luxe-gradient rounded-xl text-white shadow-lg"><MessageSquare size={18} fill="currentColor" /></div>
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Public Channels</h2>
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Live Chatting Rooms</h3>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80 group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Find a specific room..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 text-sm font-bold shadow-sm transition-all"
                                />
                            </div>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={async () => {
                                        const name = window.prompt('Enter Room Name:');
                                        if (name) {
                                            await api.post('/rooms', { roomName: name });
                                            fetchRooms();
                                        }
                                    }}
                                    className="p-4 luxe-gradient text-white rounded-2xl shadow-xl shadow-indigo-500/20 hover:rotate-90 transition-all duration-500"
                                >
                                    <Plus size={24} />
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Rooms Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {rooms.length === 0 && (
                            <div className="col-span-full glass-morphism p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="h-24 w-24 luxe-gradient rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                    <Zap className="h-12 w-12 text-white" fill="currentColor" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Waiting for Launch</h3>
                                <p className="text-gray-400 max-w-sm mx-auto mt-3 font-medium">The administrators are currently preparing the public rooms. Check back shortly!</p>
                            </div>
                        )}

                        {rooms.map((room) => (
                            <motion.div
                                key={room.id}
                                whileHover={{ y: -10 }}
                                onClick={() => navigate(`/room/${room.id}`)}
                                className="glass-morphism p-10 rounded-[3.5rem] shadow-sm cursor-pointer hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-12">
                                    <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center group-hover:luxe-gradient transition-all duration-500 group-hover:rotate-6 shadow-sm">
                                        <Users className="h-10 w-10 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            Active
                                        </span>
                                        <span className="text-[10px] font-black text-gray-400 px-1 mt-1 uppercase tracking-widest">{room.onlineCount || 0} Online</span>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter group-hover:luxe-text-gradient transition-all duration-300">
                                        {room.roomName}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex -space-x-2.5">
                                            {[1, 2, 3].map(i => (
                                                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="h-7 w-7 rounded-xl border-4 border-white dark:border-slate-900 shadow-xl" alt="user" />
                                            ))}
                                        </div>
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em]">Recent explorers</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium line-clamp-2">
                                        Experience the best conversation in the {room.roomName}. A safe space to chill, talk, and make new connections.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800/50">
                                    <div className="flex gap-2">
                                        {user?.role === 'admin' && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditRoom(room);
                                                    }}
                                                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRoom(room.id, room.roomName);
                                                    }}
                                                    className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-indigo-600 transition-all">ENTER ROOM</span>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:luxe-gradient group-hover:text-white transition-all group-hover:translate-x-3 shadow-sm">
                                            <ArrowRight size={22} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <EditRoomModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        room={editingRoom}
                        onUpdate={fetchRooms}
                    />

                    {/* Features/Stats Section */}
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="flex items-center gap-8 p-10 glass-morphism rounded-[3rem] group hover:scale-[1.02] transition-transform">
                            <div className="h-16 w-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center shrink-0 shadow-sm"><Shield size={32} /></div>
                            <div>
                                <h4 className="font-black text-xl leading-tight uppercase tracking-tighter luxe-text-gradient">100% Secure</h4>
                                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Moderated by Lumina</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 p-10 glass-morphism rounded-[3rem] group hover:scale-[1.02] transition-transform">
                            <div className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shrink-0 shadow-sm"><Zap size={32} fill="currentColor" /></div>
                            <div>
                                <h4 className="font-black text-xl leading-tight uppercase tracking-tighter luxe-text-gradient">Fast Chat</h4>
                                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Real-time pulse engine</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LobbyPage;
