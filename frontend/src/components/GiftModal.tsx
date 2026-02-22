import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift as GiftIcon, Coins } from 'lucide-react';
import { socialService } from '../services/social.service';

interface GiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiverId: string;
    receiverName: string;
}

const GiftModal: React.FC<GiftModalProps> = ({ isOpen, onClose, receiverId, receiverName }) => {
    const [gifts, setGifts] = useState<any[]>([]);
    const [selectedGift, setSelectedGift] = useState<any>(null);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGifts();
            setSuccess(false);
            setSelectedGift(null);
        }
    }, [isOpen]);

    const fetchGifts = async () => {
        try {
            const data = await socialService.getGifts();
            setGifts(data);
        } catch (err) {
            console.error('Failed to fetch gifts', err);
        }
    };

    const handleSendGift = async () => {
        if (!selectedGift) return;
        setSending(true);
        try {
            await socialService.sendGift(receiverId, selectedGift.id);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Failed to send gift', err);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="w-full sm:max-w-lg glass-morphism p-6 sm:p-8 sm:rounded-[3rem] rounded-t-[2.5rem] shadow-2xl relative overflow-hidden bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag indicator */}
                    <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full z-10"></div>
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                                <GiftIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">Send a Pulse</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">To {receiverName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {!success ? (
                        <>
                            <div className="grid grid-cols-3 gap-4 mb-8 max-h-[400px] overflow-y-auto p-2">
                                {gifts.map((gift) => (
                                    <div
                                        key={gift.id}
                                        onClick={() => setSelectedGift(gift)}
                                        className={`group relative p-4 rounded-3xl cursor-pointer border-2 transition-all ${selectedGift?.id === gift.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="text-4xl mb-3 text-center transition-transform group-hover:scale-110">{gift.icon}</div>
                                        <h4 className={`text-center text-xs font-black uppercase tracking-wider mb-1 ${selectedGift?.id === gift.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>{gift.name}</h4>
                                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-400">
                                            <Coins size={10} /> {gift.price}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSendGift}
                                disabled={!selectedGift || sending}
                                className="w-full py-4 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {sending ? 'Sending...' : 'Send Gift'}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="h-24 w-24 mx-auto bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6"
                            >
                                <GiftIcon size={48} />
                            </motion.div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Gift Sent!</h3>
                            <p className="text-gray-500 text-sm">You've made someone's day.</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GiftModal;
