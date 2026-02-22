import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/auth.service';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import type { RootState } from '../store';
import { Mail, Lock, LogIn, MessageSquare, Eye, EyeOff, UserPlus } from 'lucide-react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [guestData, setGuestData] = useState({ username: '', age: '' });
    const [guestError, setGuestError] = useState('');

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values) => {
            dispatch(loginStart());
            try {
                const data = await authService.login(values);
                dispatch(loginSuccess({
                    user: data.user,
                    token: data.accessToken,
                    refreshToken: data.refreshToken
                }));
                if (data.user.role === 'admin') navigate('/admin');
                else navigate('/lobby');
            } catch (err: any) {
                dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
            }
        },
    });

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
            {/* Left Side: Luxe Branding */}
            <div className="hidden lg:flex w-5/8 luxe-gradient items-center justify-center p-16 relative overflow-hidden">
                <div className="relative z-10 max-w-xl text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-10"
                    >
                        <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-2xl border border-white/30 shadow-2xl">
                            <MessageSquare size={44} className="fill-current text-white" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">LOVELINK</h1>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-7xl font-black leading-[0.9] mb-8 tracking-tight"
                    >
                        CONNECT <br />
                        <span className="text-white/70">WITHOUT</span> <br />
                        LIMITS.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-medium text-indigo-50 leading-relaxed mb-12 max-w-md opacity-90"
                    >
                        Experience the next generation of social connection. Safe, vibrant, and 100% free for our community.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-6 p-6 bg-white/10 rounded-[2.5rem] border border-white/10 backdrop-blur-md w-fit"
                    >
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 30}`} className="h-12 w-12 rounded-2xl border-4 border-white/10 object-cover shadow-xl" alt="user" />
                            ))}
                        </div>
                        <div>
                            <p className="text-lg font-black leading-none">25k+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Active Explorers</p>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Luxe Orbs */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-[140px]"></div>
            </div>

            {/* Right Side: Glass Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md glass-morphism p-12 rounded-[3.5rem] shadow-2xl relative z-10"
                >
                    <div className="mb-12">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="h-2 w-2 luxe-gradient rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Secure Access</span>
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">Welcome back</h2>
                    </div>

                    <form className="space-y-8" onSubmit={formik.handleSubmit}>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Email Connection</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your@email.com"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                    onChange={formik.handleChange}
                                    value={formik.values.email}
                                />
                            </div>
                            {formik.touched.email && formik.errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{formik.errors.email as string}</p>}
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Secret Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                    onChange={formik.handleChange}
                                    value={formik.values.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            className="peer sr-only"
                                            onChange={formik.handleChange}
                                            checked={formik.values.rememberMe}
                                        />
                                        <div className="h-5 w-5 rounded-md border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-md scale-0 group-hover:scale-110 transition-transform -z-10"></div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Remember Me</span>
                                </label>

                                <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                            {formik.touched.password && formik.errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{formik.errors.password as string}</p>}

                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-500/20"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>Access Account <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>

                        <div className="pt-4 text-center space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                New here? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create identity</Link>
                            </p>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">or</span>
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsGuestModalOpen(true)}
                                className="w-full h-12 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <UserPlus size={16} /> Join as Guest
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Guest Setup Modal */}
                <AnimatePresence>
                    {isGuestModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsGuestModalOpen(false)}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800"
                            >
                                <div className="mb-8">
                                    <h3 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">Guest Setup</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose your identity for this session</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Pick a Username</label>
                                        <input
                                            type="text"
                                            placeholder="CosmicExplorer"
                                            value={guestData.username}
                                            onChange={(e) => setGuestData(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Your Age</label>
                                        <input
                                            type="number"
                                            placeholder="18+"
                                            value={guestData.age}
                                            onChange={(e) => setGuestData(prev => ({ ...prev, age: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm"
                                        />
                                    </div>

                                    {guestError && (
                                        <p className="text-[10px] text-rose-500 font-bold text-center uppercase tracking-widest bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                                            {guestError}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!guestData.username || !guestData.age) {
                                                setGuestError('All fields required');
                                                return;
                                            }
                                            if (parseInt(guestData.age) < 18) {
                                                setGuestError('Minimum age is 18');
                                                return;
                                            }
                                            dispatch(loginStart());
                                            try {
                                                const data = await authService.guestLogin(guestData.username, parseInt(guestData.age));
                                                dispatch(loginSuccess({
                                                    user: data.user,
                                                    token: data.accessToken,
                                                    refreshToken: data.refreshToken
                                                }));
                                                navigate('/lobby');
                                            } catch (err: any) {
                                                const msg = err.response?.data?.message || 'Guest login failed';
                                                setGuestError(msg);
                                                dispatch(loginFailure(msg));
                                            }
                                        }}
                                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Blast Off
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] select-none">
                    LOVELINK SECURE SYSTEMS v3.0 // LUMINA EDITION
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
