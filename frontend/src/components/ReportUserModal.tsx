import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

interface ReportUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportedUser: any;
}

const REPORT_REASONS = [
    { value: 'Spam', label: 'Spamming / Advertising' },
    { value: 'Harassment', label: 'Abuse / Harassment' },
    { value: 'Fake', label: 'Fake Account / Impersonation' },
    { value: 'Inappropriate', label: 'Inappropriate Content' },
    { value: 'Scam', label: 'Scam / Phishing' },
    { value: 'Other', label: 'Other Reason' }
];

const ReportUserModal: React.FC<ReportUserModalProps> = ({ isOpen, onClose, reportedUser }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;

        setLoading(true);
        try {
            await api.post('/reports', {
                reportedId: reportedUser.id,
                reason,
                description
            });
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                // Reset state for next time
                setReason('');
                setDescription('');
                setSubmitted(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to submit report', err);
            alert('Failed to submit report. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !reportedUser) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="bg-white dark:bg-gray-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 sm:p-8 w-full sm:max-w-md shadow-2xl relative overflow-hidden border-t sm:border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag indicator */}
                    <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full z-10"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition-all hover:rotate-90"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
                            <Flag size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Safety Report</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reporting @{reportedUser.username || reportedUser.firstName}</p>
                        </div>
                    </div>

                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-12 flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <Send size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Report Submitted</h3>
                            <p className="text-sm text-gray-500 font-medium px-8">Thank you for keeping our community safe. Admins will review this shortly.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Reason</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {REPORT_REASONS.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setReason(r.value)}
                                            className={`p-3 rounded-xl text-xs font-bold transition-all text-left border ${reason === r.value
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 ring-2 ring-red-500/10'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Details (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the violation in more detail..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 transition-all h-32 resize-none text-gray-700 dark:text-gray-300"
                                />
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-relaxed">
                                    Misuse of the reporting system may result in account restrictions. All reports are logged and manually reviewed.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !reason}
                                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Flag size={18} />}
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReportUserModal;
