import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Room {
    id: string;
    roomName: string;
    roomDescription: string;
    isActive: boolean;
    roomType: string;
}

interface EditRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    onUpdate: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose, room, onUpdate }) => {
    const [formData, setFormData] = useState({
        roomName: '',
        roomDescription: '',
        isActive: true,
        roomType: 'PUBLIC'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (room) {
            setFormData({
                roomName: room.roomName || '',
                roomDescription: room.roomDescription || '',
                isActive: room.isActive,
                roomType: room.roomType || 'PUBLIC'
            });
        }
    }, [room]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room) return;

        setLoading(true);
        setError('');

        try {
            await api.patch(`/rooms/${room.id}`, formData);
            onUpdate();
            onClose();
        } catch (err: any) {
            console.error('Failed to update room', err);
            setError(err.response?.data?.message || 'Failed to update room');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-lg glass-morphism p-8 rounded-[2.5rem] shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                                <Edit2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">Edit Room</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Room Details</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Room Name</label>
                            <input
                                type="text"
                                value={formData.roomName}
                                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="e.g. Global Lobby"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Description</label>
                            <textarea
                                value={formData.roomDescription}
                                onChange={(e) => setFormData({ ...formData, roomDescription: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-32"
                                placeholder="What's this room about?"
                            />
                        </div>

                        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <div>
                                <span className="block text-sm font-black text-gray-900 dark:text-white">Active Status</span>
                                <span className="text-xs text-gray-400 font-medium">Visible to users</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditRoomModal;
