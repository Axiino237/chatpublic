import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Home,
    Globe,
    Newspaper,
    Shield,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavigationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'rooms', label: 'Room list', icon: Home, color: 'text-blue-500', path: '/lobby' },
        { id: 'wall', label: 'Friends wall', icon: Globe, color: 'text-sky-500', path: '/wall' },
        { id: 'news', label: 'News Feed', icon: Newspaper, color: 'text-emerald-500', path: '#' },
        { id: 'staff', label: 'Staff Hub', icon: Shield, color: 'text-red-500', path: '/admin' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-full sm:w-80 bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#3b5998] rounded-xl flex items-center justify-center text-white">
                                    <MessageSquare size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Current room</p>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none">Main room</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        navigate(item.path);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                                >
                                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:scale-110 transition-transform ${item.color}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-tighter">
                                <span>LOVELINK V2.4</span>
                                <div className="flex items-center gap-2">
                                    <Shield size={12} className="text-green-500" />
                                    <span>Secure Connection</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NavigationDrawer;
