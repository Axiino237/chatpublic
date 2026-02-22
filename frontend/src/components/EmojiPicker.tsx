import React from 'react';
import { motion } from 'framer-motion';

const EMOJIS = [
    '👍', '❤️', '😂', '😮', '😢', '😡',
    '🎉', '🔥', '👋', '🚀', '👀', '💯',
    '✨', '🙏', '🤝', '🤔', '😎', '🥳',
    '😊', '🤣', '🥰', '😒', '😩', '😭',
    '😤', '🤬', '🤯', '🥵', '🥶', '😱'
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    return (
        <React.Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            ></div>

            {/* Picker */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-16 right-0 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-64"
            >
                <div className="grid grid-cols-6 gap-2">
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onSelect(emoji);
                                // Don't close immediately allows multiple picks? No, usually single pick.
                                // Let's keep it open? No, close is standard.
                            }}
                            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-lg transition-colors flex items-center justify-center aspect-square"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                    Quick Reactions
                </div>
            </motion.div>
        </React.Fragment>
    );
};

export default EmojiPicker;
