import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, Key, ArrowLeft, Send, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const otpFormik = useFormik({
        initialValues: { email: '' },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            try {
                await api.post('/auth/forgot-password', { email: values.email });
                setEmail(values.email);
                setStep(2);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to send OTP');
            } finally {
                setLoading(false);
            }
        },
    });

    const resetFormik = useFormik({
        initialValues: { code: '', password: '', confirmPassword: '' },
        validationSchema: Yup.object({
            code: Yup.string().length(6, 'Must be 6 digits').required('Required'),
            password: Yup.string().min(8, 'Minimum 8 characters').required('Required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Required'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            try {
                await api.post('/auth/reset-password', {
                    email,
                    code: values.code,
                    password: values.password,
                });
                setStep(3); // Success
            } catch (err: any) {
                setError(err.response?.data?.message || 'Reset failed. Check your code.');
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden transition-colors">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-morphism p-12 rounded-[3.5rem] shadow-2xl relative z-10"
            >
                <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-500 transition-colors mb-10 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to access
                </Link>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="mb-10">
                                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white leading-none mb-3">Recover Access</h2>
                                <p className="text-sm font-medium text-gray-500">Enter your identity email to receive a recovery code.</p>
                            </div>

                            <form onSubmit={otpFormik.handleSubmit} className="space-y-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Identity Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                            onChange={otpFormik.handleChange}
                                            value={otpFormik.values.email}
                                        />
                                    </div>
                                    {otpFormik.touched.email && otpFormik.errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{otpFormik.errors.email}</p>}
                                </div>

                                {error && <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-500/20">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Send Recovery Code</>}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="mb-10">
                                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white leading-none mb-3">Reset Password</h2>
                                <p className="text-sm font-medium text-gray-500">We sent a 6-digit code to <span className="text-indigo-500 font-bold">{email}</span></p>
                            </div>

                            <form onSubmit={resetFormik.handleSubmit} className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Recovery Code</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            name="code"
                                            maxLength={6}
                                            placeholder="000000"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-black text-sm tracking-[1em] text-center text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                            onChange={resetFormik.handleChange}
                                            value={resetFormik.values.code}
                                        />
                                    </div>
                                    {resetFormik.touched.code && resetFormik.errors.code && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{resetFormik.errors.code}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">New Secret Key</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                            onChange={resetFormik.handleChange}
                                            value={resetFormik.values.password}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {resetFormik.touched.password && resetFormik.errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{resetFormik.errors.password}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Identity Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                            onChange={resetFormik.handleChange}
                                            value={resetFormik.values.confirmPassword}
                                        />
                                    </div>
                                    {resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{resetFormik.errors.confirmPassword}</p>}
                                </div>

                                {error && <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-500/20">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Set New Password'}
                                </button>

                                <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">Resend Code</button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-3">Identity Restored</h2>
                            <p className="text-sm font-medium text-gray-500 mb-10 px-4">Your secret key has been successfully updated. You can now access your account.</p>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]"
                            >
                                Continue to Access
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
