import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/auth.service';
import { loginStart, loginFailure } from '../store/authSlice';
import type { RootState } from '../store';
import { Mail, Lock, User, UserPlus, Sparkles, MessageSquare, Calendar, Heart, Eye, EyeOff } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state: RootState) => state.auth);
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: '',
            nationality: '',
            languages: '',
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, 'Username must be at least 3 characters')
                .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed')
                .required('Required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().min(6, 'Must be 6 characters or more').required('Required'),
            firstName: Yup.string().required('Required'),
            lastName: Yup.string().required('Required'),
            dateOfBirth: Yup.date()
                .required('Required')
                .test('age', 'You must be at least 18 years old', (value) => {
                    if (!value) return false;
                    const today = new Date();
                    const birthDate = new Date(value);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    return age >= 18;
                }),
            gender: Yup.string().required('Required'),
            nationality: Yup.string(),
            languages: Yup.string(),
        }),

        onSubmit: async (values) => {
            dispatch(loginStart());
            try {
                const payload = {
                    ...values,
                    languages: values.languages ? values.languages.split(',').map((l: string) => l.trim()) : [],
                };
                await authService.register(payload);
                await authService.generateOtp(values.email);
                navigate('/verify-otp', { state: { email: values.email } });
            } catch (err: any) {
                dispatch(loginFailure(err.response?.data?.message || 'Registration failed'));
            }
        },
    });

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
            {/* Left Side: Luxe Branding */}
            <div className="hidden lg:flex w-1/2 luxe-gradient items-center justify-center p-16 relative overflow-hidden">
                <div className="relative z-10 max-w-xl text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4 mb-10"
                    >
                        <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-2xl border border-white/30 shadow-2xl">
                            <MessageSquare size={44} className="fill-current text-white" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">LOVELINK</h1>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-7xl font-black leading-[0.9] mb-8 tracking-tight"
                    >
                        YOUR <br />
                        <span className="text-white/70">NEXT</span> <br />
                        CHAPTER.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-black bg-white/10 w-fit px-5 py-2 rounded-full mb-10 border border-white/20 backdrop-blur-md italic tracking-widest"
                    >
                        100% FREE COMMUNITY PLATFORM
                    </motion.p>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10"
                        >
                            <div className="p-3 bg-white/20 rounded-2xl text-white"><Sparkles size={24} /></div>
                            <div>
                                <p className="font-bold text-lg leading-none mb-1">Pulse Engine</p>
                                <p className="text-sm opacity-70">Instant matching with community-driven logic</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10"
                        >
                            <div className="p-3 bg-white/20 rounded-2xl text-white"><Lock size={24} /></div>
                            <div>
                                <p className="font-bold text-lg leading-none mb-1">Encrypted Privacy</p>
                                <p className="text-sm opacity-70">Seamless and secure private conversations</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-white/5 rounded-full blur-[160px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]"></div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl glass-morphism p-12 rounded-[4rem] shadow-2xl border border-white/40 dark:border-white/5 relative z-10 my-10"
                >
                    <div className="mb-12">
                        <div className="flex items-center gap-2.5 mb-3">
                            <UserPlus size={18} className="text-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Join Community</span>
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">Create Identity</h2>
                    </div>

                    <form className="space-y-8" onSubmit={formik.handleSubmit}>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="John"
                                        className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        onChange={formik.handleChange}
                                        value={formik.values.firstName}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Doe"
                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    onChange={formik.handleChange}
                                    value={formik.values.lastName}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Unique Pulse Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="choose_your_identity"
                                    className={`w-full bg-slate-50 dark:bg-slate-800/30 border ${formik.touched.username && formik.errors.username ? 'border-red-500' : 'border-slate-200 dark:border-slate-700/50'} rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm text-gray-900 dark:text-white placeholder-gray-400`}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.username}
                                />
                            </div>
                            {formik.touched.username && formik.errors.username && (
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">{formik.errors.username as string}</p>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Email Connection</label>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your@email.com"
                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    onChange={formik.handleChange}
                                    value={formik.values.email}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Secret Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
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
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Birth Identity</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white"
                                        onChange={formik.handleChange}
                                        value={formik.values.dateOfBirth}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Gender Identity</label>
                                <div className="relative group">
                                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <select
                                        name="gender"
                                        className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-10 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm appearance-none text-gray-900 dark:text-white"
                                        onChange={formik.handleChange}
                                        value={formik.values.gender}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="non-binary">Non-binary</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Nationality</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="nationality"
                                        placeholder="e.g. Japanese"
                                        className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        onChange={formik.handleChange}
                                        value={formik.values.nationality}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Languages</label>
                                <div className="relative group">
                                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="languages"
                                        placeholder="English, Spanish... (comma separated)"
                                        className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        onChange={formik.handleChange}
                                        value={formik.values.languages}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-500/20">
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                        >
                            {loading ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Begin Journey <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>

                        <div className="pt-6 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Already registered? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Access Identity</Link>
                            </p>
                        </div>
                    </form>
                </motion.div>

                <p className="mb-10 text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.5em] select-none text-center">
                    BY JOINING YOU AGREE TO OUR TERMS & PRIVACY // SECURE ACCESS v3.0
                </p>
            </div>
        </div >
    );
};

export default RegisterPage;
