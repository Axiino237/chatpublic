import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Check, Zap } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'fa', name: 'Persian (Farsi)', flag: '🇮🇷' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'tl', name: 'Filipino (Tagalog)', flag: '🇵🇭' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
    { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
    { code: 'my', name: 'Burmese', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', flag: '🇰🇭' },
    { code: 'lo', name: 'Lao', flag: '🇱🇦' },
    { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
    { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
    { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
    { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
    { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
    { code: 'ca', name: 'Catalan', flag: '🏳️' },
    { code: 'gl', name: 'Galician', flag: '🏳️' },
    { code: 'eu', name: 'Basque', flag: '🏳️' },
    { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    { code: 'ga', name: 'Irish', flag: '🇮🇪' },
    { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
    { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
    { code: 'et', name: 'Estonian', flag: '🇪🇪' },
    { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
    { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
    { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
    { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
    { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
];

// Detect language from Unicode character ranges
const detectLanguage = (text: string): string => {
    if (!text) return 'en';
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi/Gurmukhi
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
    if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi/Devanagari
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[\u0590-\u05FF]/.test(text)) return 'he';
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
    return 'en';
};

// Real translation via MyMemory free API (no key needed, 1000 words/day free)
const translateText = async (text: string, from: string, to: string): Promise<string> => {
    try {
        // MyMemory uses 'zh-CN' not 'zh'
        const fromCode = from === 'zh' ? 'zh-CN' : from === 'zh-TW' ? 'zh-TW' : from;
        const toCode = to === 'zh' ? 'zh-CN' : to === 'zh-TW' ? 'zh-TW' : to;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
            return data.responseData.translatedText;
        }
        return `[Translation unavailable]`;
    } catch {
        return `[Network error — check connection]`;
    }
};

interface FloatingTranslatorOrbProps {
    targetLanguage?: string;
}

const FloatingTranslatorOrb: React.FC<FloatingTranslatorOrbProps> = () => {
    const [targetLang, setTargetLang] = useState('es');
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [hoveredText, setHoveredText] = useState('');
    const [detectedLang, setDetectedLang] = useState('en');
    const [translation, setTranslation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const orbRef = useRef<HTMLDivElement>(null);

    const targetLangInfo = LANGUAGES.find(l => l.code === targetLang);

    // When orb is dragged over text nodes, detect and translate
    const handleDragEnd = useCallback((_: any, info: any) => {
        setIsDragging(false);
        const point = { x: info.point.x, y: info.point.y };

        // Find the element under the orb at drop position
        const orb = orbRef.current;
        if (orb) orb.style.visibility = 'hidden';
        const el = document.elementFromPoint(point.x, point.y);
        if (orb) orb.style.visibility = '';

        let text = '';
        if (el) {
            // Walk up DOM to find meaningful text
            let node: Element | null = el;
            while (node && !text.trim()) {
                const candidate = node.textContent?.trim() || '';
                if (candidate.length > 0 && candidate.length < 500) {
                    text = candidate.split('\n')[0].trim().slice(0, 200);
                }
                node = node.parentElement;
            }
        }

        if (text) {
            const detected = detectLanguage(text);
            setDetectedLang(detected);
            setHoveredText(text);
            setIsLoading(true);
            setTranslation('');
            setShowTranslation(true);
            setPopupPos({ x: Math.min(point.x, window.innerWidth - 340), y: Math.min(point.y + 20, window.innerHeight - 200) });

            // Use real MyMemory translation API
            translateText(text, detected, targetLang).then(result => {
                setTranslation(result);
                setIsLoading(false);
            });
        }
    }, [targetLang]);

    const handleOrbClick = () => {
        if (!isDragging) {
            setShowLangPicker(prev => !prev);
            setShowTranslation(false);
        }
    };

    return (
        <>
            {/* Floating Orb */}
            <motion.div
                ref={orbRef}
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ position: 'fixed', bottom: 100, right: 20, zIndex: 9999 }}
                className="cursor-grab active:cursor-grabbing"
            >
                <motion.button
                    onClick={handleOrbClick}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center border-2 border-white/20 group"
                    title={`Drag onto text to translate • Click to change language (→${targetLangInfo?.name})`}
                >
                    <Globe size={20} className="text-white" />
                    {/* Target language badge */}
                    <span className="absolute -bottom-1 -right-1 bg-white text-indigo-600 text-[8px] font-black rounded-full px-1 border border-indigo-200 uppercase tracking-widest">
                        {targetLang}
                    </span>
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20"></span>
                </motion.button>

                {/* Language Picker */}
                <AnimatePresence>
                    {showLangPicker && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 10 }}
                            className="absolute bottom-14 right-0 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Translate to</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto p-1">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setTargetLang(lang.code); setShowLangPicker(false); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${targetLang === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <span className="text-base">{lang.flag}</span>
                                        <span className="flex-1">{lang.name}</span>
                                        {targetLang === lang.code && <Check size={12} className="text-indigo-500" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Translation Popup */}
            <AnimatePresence>
                {showTranslation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        style={{ position: 'fixed', top: popupPos.y, left: popupPos.x, zIndex: 9998 }}
                        className="w-80 max-w-[90vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/80 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Globe size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                                    {LANGUAGES.find(l => l.code === detectedLang)?.flag} {LANGUAGES.find(l => l.code === detectedLang)?.name} → {targetLangInfo?.flag} {targetLangInfo?.name}
                                </span>
                            </div>
                            <button onClick={() => setShowTranslation(false)} className="p-1 hover:bg-white/50 rounded-full transition-colors">
                                <X size={12} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Original */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Original</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-3">{hoveredText}</p>
                        </div>

                        {/* Translation */}
                        <div className="px-4 py-3">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Zap size={8} className={isLoading ? 'animate-bounce' : ''} />
                                Translation
                            </p>
                            {isLoading ? (
                                <div className="flex gap-1.5 py-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-300 leading-relaxed">{translation}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingTranslatorOrb;
