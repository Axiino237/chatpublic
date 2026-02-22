import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import type { RootState } from '../store';
import {
    User,
    FileText,
    MapPin,
    Camera,
    Save,
    Heart,
    Target,
    Settings,
    CheckCircle2,
    Calendar,
    Gift as GiftIcon,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { loginSuccess, logout } from '../store/authSlice';
import { useTheme } from '../context';
import Header from '../components/Header';
import NavigationDrawer from '../components/NavigationDrawer';
import api, { API_ORIGIN } from '../services/api';

const ProfilePage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userGifts, setUserGifts] = useState<any[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await userService.getMe();
                dispatch(loginSuccess({
                    user: userData,
                    token: localStorage.getItem('token') || '',
                    refreshToken: localStorage.getItem('refreshToken') || ''
                }));
                // Also fetch gifts
                const giftsRes = await api.get(`/social/gifts/${userData.id}`);
                setUserGifts(giftsRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch user data', err);
                setLoading(false);
            }
        };
        fetchUserData();
    }, [dispatch]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUpdating(true);
            const data = await userService.uploadAvatar(file);
            if (user) {
                dispatch(loginSuccess({
                    user: { ...user, profilePictureUrl: data.url },
                    token: localStorage.getItem('token') || '',
                    refreshToken: localStorage.getItem('refreshToken') || ''
                }));
            }
            setStatusMessage({ type: 'success', text: 'Pulse Identity Updated' });
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (err) {
            console.error('Failed to upload avatar', err);
            setStatusMessage({ type: 'error', text: 'Avatar Identity Failed' });
        } finally {
            setUpdating(false);
        }
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: user?.username || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            bio: user?.bio || '',
            gender: user?.gender || '',
            interestedIn: user?.interestedIn || '',
            location: user?.location || '',
            nationality: user?.nationality || '',
            languages: user?.languages?.join(', ') || '',
            travelBucketList: user?.travelBucketList?.join(', ') || '',
            culturalInterests: user?.culturalInterests?.join(', ') || '',
            dateOfBirth: (() => {
                if (!user?.dateOfBirth) return '';
                const d = new Date(user.dateOfBirth);
                return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
            })(),
        },

        validationSchema: Yup.object({
            username: Yup.string().min(3, 'Too short').required('Required'),
            firstName: Yup.string().required('Required'),
            lastName: Yup.string().required('Required'),
            bio: Yup.string().max(500, 'Too long'),
            gender: Yup.string().oneOf(['male', 'female', 'other', 'non-binary', '']),
            interestedIn: Yup.string().oneOf(['male', 'female', 'both', 'other', '']),
            location: Yup.string(),
            nationality: Yup.string(),
            languages: Yup.string(),
            travelBucketList: Yup.string(),
            culturalInterests: Yup.string(),
            dateOfBirth: Yup.date().required('Required'),
        }),
        onSubmit: async (values) => {
            console.log('🚀 [ProfilePage] Submitting update:', values);
            setUpdating(true);
            setStatusMessage(null);

            // Sanitize empty strings to undefined to be friendly to backend DTOs
            const sanitizedValues = {
                ...values,
                gender: values.gender || undefined,
                interestedIn: values.interestedIn || undefined,
                location: values.location || undefined,
                bio: values.bio || undefined,
                nationality: values.nationality || undefined,
                dateOfBirth: values.dateOfBirth || undefined,
                languages: values.languages ? values.languages.split(',').map((s: string) => s.trim()) : undefined,
                travelBucketList: values.travelBucketList ? values.travelBucketList.split(',').map((s: string) => s.trim()) : undefined,
                culturalInterests: values.culturalInterests ? values.culturalInterests.split(',').map((s: string) => s.trim()) : undefined,
            };
            console.log('🧹 [ProfilePage] Sanitized payload:', sanitizedValues);

            try {
                const updatedUser = await userService.updateProfile(sanitizedValues);
                console.log('✅ [ProfilePage] Update success. Fresh User Data:', updatedUser);

                // CRITICAL: Ensure we keep the token and other session info
                dispatch(loginSuccess({
                    user: updatedUser,
                    token: localStorage.getItem('token') || '',
                    refreshToken: localStorage.getItem('refreshToken') || ''
                }));

                setStatusMessage({ type: 'success', text: 'Pulse Profile Synced!' });
                setTimeout(() => setStatusMessage(null), 3000);
            } catch (err: any) {
                console.error('❌ [ProfilePage] Update failed catch block:', err);
                console.error('❌ [ProfilePage] Error Response:', err.response?.data);
                console.error('❌ [ProfilePage] Error Status:', err.response?.status);

                let msg = 'Connection Interrupted';
                if (err.response?.data?.message) {
                    msg = err.response.data.message;
                } else if (err.message) {
                    msg = err.message;
                }

                setStatusMessage({ type: 'error', text: Array.isArray(msg) ? msg[0] : msg });
            } finally {
                setUpdating(false);
            }
        },
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="h-14 w-14 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse">Syncing Pulse Identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors overflow-x-hidden">
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <main className="flex-1 overflow-y-auto p-6 md:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="glass-morphism rounded-[3.5rem] p-10 shadow-sm text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-24 luxe-gradient opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                <div className="relative inline-block mb-8 z-10">
                                    <div className="absolute inset-0 luxe-gradient rounded-[2.5rem] blur-xl opacity-20"></div>
                                    <img
                                        src={user?.profilePictureUrl ? (user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${API_ORIGIN}${user.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${user?.username || user?.firstName}&background=6366f1&color=fff&size=200`}
                                        alt="Profile"
                                        className="h-44 w-44 rounded-[2.5rem] object-cover ring-8 ring-white dark:ring-slate-800 shadow-2xl relative z-10"
                                    />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-3 -right-3 p-4 luxe-gradient text-white rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all z-20"
                                    >
                                        <Camera size={24} />
                                    </button>
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter mb-2 text-gray-900 dark:text-white leading-none">
                                    {user?.username || `${user?.firstName} ${user?.lastName}`}
                                </h2>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span className="text-[9px] font-black luxe-gradient text-white px-3 py-1 rounded-full uppercase tracking-widest">{user?.role || 'USER'}</span>
                                    {user?.isVerified && <CheckCircle2 size={18} className="text-indigo-500" fill="currentColor" />}
                                </div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{user?.email}</p>

                                <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black leading-none text-gray-900 dark:text-white luxe-text-gradient">{user?.points || 0}</p>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mt-1">Pulses</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black leading-none text-gray-900 dark:text-white luxe-text-gradient">{userGifts.length}</p>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mt-1">Gifts</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gift Gallery */}
                            <div className="glass-morphism rounded-[3rem] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                                            <GiftIcon size={18} />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white">Pulse Gallery</h3>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-400">{userGifts.length} items</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {userGifts.length > 0 ? (
                                        userGifts.map((ug) => (
                                            <div key={ug.id} className="group relative">
                                                <div className="text-2xl h-14 w-14 glass-morphism rounded-2xl flex items-center justify-center hover:scale-110 hover:luxe-gradient hover:text-white transition-all cursor-help shadow-sm">
                                                    {ug.gift.icon}
                                                </div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 translate-y-2 group-hover:translate-y-0 min-w-[120px]">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={ug.sender.profilePictureUrl ? (ug.sender.profilePictureUrl.startsWith('http') ? ug.sender.profilePictureUrl : `${API_ORIGIN}${ug.sender.profilePictureUrl}`) : `https://ui-avatars.com/api/?name=${ug.sender.username}&background=random`}
                                                            className="h-6 w-6 rounded-lg object-cover"
                                                            alt={ug.sender.username}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Sender</span>
                                                            <span className="text-[10px] font-bold">@{ug.sender.username}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-4 py-6 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Gallery is empty<br />Unlock gifts in chat</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="luxe-gradient rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 leading-none">Community First</h3>
                                    <p className="text-sm text-indigo-50 mb-8 font-medium leading-relaxed">LoveLink is 100% free. Enjoy all premium features without limits.</p>
                                    <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                                        INVITE EXPLORERS
                                    </button>
                                </div>
                                <Heart className="absolute -bottom-12 -right-12 opacity-10 group-hover:scale-110 transition-transform" size={180} />
                            </div>

                            {/* Account Actions (Logout/Theme) */}
                            <div className="glass-morphism rounded-[3rem] p-8 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl">
                                        <Settings size={18} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white">Account</h3>
                                </div>

                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">App Theme</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{theme} Mode</span>
                                </button>

                                <button
                                    onClick={() => {
                                        dispatch(logout());
                                        navigate('/login');
                                    }}
                                    className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                            <LogOut size={18} />
                                        </div>
                                        <span className="text-sm font-bold">Sign Out</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Settings Main Area */}
                        <div className="lg:col-span-2">
                            <div className="glass-morphism rounded-[4rem] p-12 shadow-sm relative overflow-hidden">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                                <form onSubmit={formik.handleSubmit} className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-5 mb-4">
                                        <div className="p-3.5 luxe-gradient rounded-2xl text-white shadow-lg"><Settings size={22} /></div>
                                        <h3 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">Pulse Preferences</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Unique Username</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Unique Explorer Name"
                                                className={`w-full bg-slate-50 dark:bg-slate-800/30 border ${formik.touched.username && formik.errors.username ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-black text-sm text-gray-900 dark:text-white`}
                                                {...formik.getFieldProps('username')}
                                            />
                                            {formik.touched.username && formik.errors.username && (
                                                <p className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest">{formik.errors.username as string}</p>
                                            )}

                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">First Identity</label>
                                            <div className="relative group">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white"
                                                    {...formik.getFieldProps('firstName')}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Last Identity</label>
                                            <div className="relative group">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white"
                                                    {...formik.getFieldProps('lastName')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Your Gender</label>
                                            <div className="relative group">
                                                <Heart className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-10 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm appearance-none text-gray-900 dark:text-white"
                                                    {...formik.getFieldProps('gender')}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="non-binary">Non-binary</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Looking For</label>
                                            <div className="relative group">
                                                <Target className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-10 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm appearance-none text-gray-900 dark:text-white"
                                                    {...formik.getFieldProps('interestedIn')}
                                                >
                                                    <option value="">Select Interest</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="both">Both</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Birth Identity</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white"
                                                    {...formik.getFieldProps('dateOfBirth')}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Current Location</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="City, Country"
                                                    className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                                    {...formik.getFieldProps('location')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-10">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Nationality</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="e.g. Japanese"
                                                className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                                {...formik.getFieldProps('nationality')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-4">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Languages (comma separated)</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="English, Spanish, French"
                                                className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                                {...formik.getFieldProps('languages')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-4">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Travel Bucket List (comma separated)</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Paris, Tokyo, New York"
                                                className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                                {...formik.getFieldProps('travelBucketList')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-4 mb-4">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Cultural Interests (comma separated)</label>
                                        <div className="relative group">
                                            <Target className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Anime, Food, History"
                                                className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                                {...formik.getFieldProps('culturalInterests')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] ml-1">Profile Bio</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-6 top-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <textarea
                                                rows={5}
                                                placeholder="Tell others about your story..."
                                                className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] py-6 pl-14 pr-8 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium text-sm resize-none text-gray-900 dark:text-white leading-relaxed"
                                                {...formik.getFieldProps('bio')}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-10 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="flex-1">
                                            {statusMessage && (
                                                <motion.div
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className={`flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${statusMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
                                                >
                                                    <CheckCircle2 size={18} fill="currentColor" className="opacity-80" /> {statusMessage.text}
                                                </motion.div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="flex items-center gap-4 px-12 py-5 luxe-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {updating ? 'Pulse Syncing...' : <><Save size={20} /> Update Identity</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default ProfilePage;

