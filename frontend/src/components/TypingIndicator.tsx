import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
    typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
    if (typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
        } else {
            return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-medium italic"
            >
                {getTypingText()}
                <span className="inline-flex ml-1 gap-1">
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                </span>
            </motion.div>
        </AnimatePresence>
    );
};

export default TypingIndicator;
