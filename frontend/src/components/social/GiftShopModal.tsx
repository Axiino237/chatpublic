import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, Star } from 'lucide-react';
import api from '../../services/api';

interface Gift {
    id: string;
    name: string;
    icon: string;
    price: number;
    rarity: string;
}

interface GiftShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiverId: string;
    receiverName: string;
}

const GiftShopModal: React.FC<GiftShopModalProps> = ({ isOpen, onClose, receiverId, receiverName }) => {
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/social/gifts').then(res => setGifts(res.data));
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!selectedGift) return;
        setIsSending(true);
        try {
            await api.post('/social/gift/send', {
                receiverId,
                giftId: selectedGift.id,
                message: message.trim() || undefined
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Failed to send gift', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={16} className="text-yellow-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Premium Gifting</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Send a Gift to {receiverName}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Gift Grid */}
                        <div className="p-8 max-h-[400px] overflow-y-auto">
                            {!success ? (
                                <div className="grid grid-cols-3 gap-6">
                                    {gifts.map((gift) => (
                                        <button
                                            key={gift.id}
                                            onClick={() => setSelectedGift(gift)}
                                            className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${selectedGift?.id === gift.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                                : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}
                                        >
                                            <div className="text-4xl transition-transform group-hover:scale-125 duration-300 drop-shadow-lg">
                                                {gift.icon}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-gray-900 dark:text-white">{gift.name}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{gift.rarity}</p>
                                            </div>
                                            {selectedGift?.id === gift.id && (
                                                <div className="absolute top-2 right-2">
                                                    <Star size={12} className="text-blue-500 fill-current" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-10"
                                >
                                    <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20">
                                        <Heart size={48} fill="currentColor" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">Gift Sent!</h3>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{receiverName} will be thrilled.</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer / Message */}
                        <div className="p-8 border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            {!success && (
                                <>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a special message (optional)..."
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-20 mb-6"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending || !selectedGift}
                                        className="w-full py-4 bg-[#3b5998] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSending ? 'Sending...' : 'Confirm & Send Gift'}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GiftShopModal;
