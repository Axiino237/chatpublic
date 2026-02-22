import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';

const VerifyOtpPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const email = location.state?.email || '';
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const data = await authService.verifyOtp(email, code);
            dispatch(loginSuccess({
                user: data.user,
                token: data.accessToken,
                refreshToken: data.refreshToken
            }));
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await authService.generateOtp(email);
            setMessage('Pulse code resent. Check your inbox.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full glass-morphism p-12 rounded-[3.5rem] shadow-2xl text-center relative z-10"
            >
                <div className="mx-auto h-20 w-20 luxe-gradient rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
                    <ShieldCheck className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter shadow-sm">Verify Connection</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10">Pulse code sent to {email}</p>

                <form onSubmit={handleVerify} className="space-y-8">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-5 text-center text-4xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                        />
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</motion.p>
                    )}
                    {message && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{message}</motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 6}
                        className="w-full h-16 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? 'Confirming...' : <><ShieldCheck size={20} /> Establish Identity</>}
                    </button>

                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pt-4">
                        Didn't receive code? <button type="button" onClick={handleResendOtp} disabled={loading} className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">Re-pulse</button>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default VerifyOtpPage;
