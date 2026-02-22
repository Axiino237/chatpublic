import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, Sparkles } from 'lucide-react';
import { socketService } from '../services/socket.service';

const GlobalAnnouncement: React.FC = () => {
    const [announcement, setAnnouncement] = useState<{ message: string, sender: string } | null>(null);

    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('globalAnnouncement', (data: { message: string, sender: string }) => {
                setAnnouncement(data);
                // Auto hide after 15 seconds
                setTimeout(() => setAnnouncement(null), 15000);
            });
        }
        return () => {
            socket?.off('globalAnnouncement');
        };
    }, []);

    return (
        <AnimatePresence>
            {announcement && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[200] flex justify-center px-4"
                >
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex items-center gap-6 border border-white/20 backdrop-blur-xl">
                        <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center shrink-0 animate-bounce">
                            <Megaphone size={32} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-yellow-300" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Official System Broadcast</span>
                            </div>
                            <h3 className="text-lg font-black tracking-tight leading-tight">{announcement.message}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">— Admin {announcement.sender}</p>
                        </div>
                        <button
                            onClick={() => setAnnouncement(null)}
                            className="p-3 hover:bg-white/10 rounded-full transition-colors self-start"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalAnnouncement;
