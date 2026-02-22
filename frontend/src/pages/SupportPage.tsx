import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

const SupportPage: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMyMessages();
    }, []);

    const fetchMyMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/support/my');
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/support', { subject, message });
            setSubject('');
            setMessage('');
            fetchMyMessages();
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Contact Admin</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="What's this about?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                placeholder="Tell us more..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:bg-gray-300"
                        >
                            {submitting ? 'Sending...' : 'Send Message'}
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </motion.div>

                {/* Status List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Support History</h3>
                    {loading ? (
                        <p className="text-center text-gray-500 py-10">Loading history...</p>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No messages yet.</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-gray-900">{msg.subject}</h4>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${msg.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {msg.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">{msg.message}</p>
                                {msg.reply && (
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Admin Reply:
                                        </p>
                                        <p className="text-sm text-blue-900">{msg.reply}</p>
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {new Date(msg.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SupportPage;
