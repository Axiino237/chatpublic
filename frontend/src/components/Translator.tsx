import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, X, Grip, ArrowRightLeft, Globe, Zap } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];

interface TranslatorProps {
    isOpen: boolean;
    onClose: () => void;
}

const Translator: React.FC<TranslatorProps> = ({ isOpen, onClose }) => {
    const [text, setText] = useState('');
    const [fromLang, setFromLang] = useState('en');
    const [toLang, setToLang] = useState('es');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) return;
        setIsTranslating(true);

        // Mock Translation Logic - In a real app, call Google Translate / DeepL API
        setTimeout(() => {
            const mocks: { [key: string]: string } = {
                'Hello': 'Hola',
                'How are you?': '¿Cómo estás?',
                'Welcome': 'Bienvenido',
                'I love this chat': 'Me encanta este chat',
            };

            const result = mocks[text] || `[${toLang.toUpperCase()}] ${text}`;
            setTranslatedText(result);
            setIsTranslating(false);
        }, 800);
    };

    const swapLanguages = () => {
        setFromLang(toLang);
        setToLang(fromLang);
        setText(translatedText);
        setTranslatedText(text);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-[100] w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden cursor-move"
        >
            {/* Header */}
            <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Languages size={18} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">TransLumina</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Instant Pulse Translation</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X size={16} className="text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Language Selectors */}
                <div className="flex items-center justify-between gap-2">
                    <select
                        value={fromLang}
                        onChange={(e) => setFromLang(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>

                    <button
                        onClick={swapLanguages}
                        className="p-2 hover:bg-indigo-500/10 rounded-full transition-colors group"
                    >
                        <ArrowRightLeft size={14} className="text-indigo-500 group-hover:rotate-180 transition-transform duration-500" />
                    </button>

                    <select
                        value={toLang}
                        onChange={(e) => setToLang(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>

                {/* Input */}
                <div className="space-y-2">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type text to translate..."
                        className="w-full h-24 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium resize-none outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Result */}
                <div className="relative group/result">
                    <div className="w-full min-h-[4rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl p-4 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        {isTranslating ? (
                            <div className="flex items-center gap-2 animate-pulse">
                                <Zap size={14} className="animate-bounce" /> Translating...
                            </div>
                        ) : translatedText || 'Result will appear here'}
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={handleTranslate}
                    disabled={isTranslating || !text.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                    <Globe size={14} className="group-hover:rotate-12 transition-transform" />
                    {isTranslating ? 'Processing...' : 'Translate Now'}
                </button>
            </div>
        </motion.div>
    );
};

export default Translator;
