import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    MessageSquare,
    Share2,
    Plus,
    Image as ImageIcon,
    Flame,
    Clock,
    Trash2
} from 'lucide-react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import Header from '../components/Header';
import NavigationDrawer from '../components/NavigationDrawer';

interface Post {
    id: string;
    userId: string;
    content: string;
    imageUrl?: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        profilePictureUrl: string;
        badge: string;
    };
}

const FriendsWallPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/social/wall');
            setPosts(res.data);
        } catch (err) {
            console.error('Failed to fetch wall posts', err);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post('/social/post', { content: newPostContent });
            setNewPostContent('');
            fetchPosts();
        } catch (err) {
            console.error('Failed to create post', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            await api.patch(`/social/post/${postId}/like`);
            setPosts(posts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
        } catch (err) {
            console.error('Failed to like post', err);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/social/post/${postId}`);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Failed to delete post', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
                {/* Wall Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-[#3b5998] rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <Flame size={20} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Social Pulse</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Friends Wall</h1>
                    </div>
                </div>

                {/* Create Post Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    <div className="flex gap-4">
                        <img
                            src={user?.profilePictureUrl || `https://ui-avatars.com/api/?name=${user?.firstName}`}
                            className="h-12 w-12 rounded-2xl object-cover shadow-md"
                        />
                        <div className="flex-1 space-y-4">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-24"
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                        <ImageIcon size={20} />
                                    </button>
                                    <button className="p-2.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={isSubmitting || !newPostContent.trim()}
                                    className="px-8 py-3 bg-[#3b5998] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Story'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
                            >
                                {/* Post Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                src={post.user.profilePictureUrl || `https://ui-avatars.com/api/?name=${post.user.firstName}`}
                                                className="h-12 w-12 rounded-2xl object-cover ring-4 ring-blue-500/5"
                                            />
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white capitalize">{post.user.firstName} {post.user.lastName}</h3>
                                                <span className="text-[9px] font-black bg-blue-100 text-[#3b5998] px-1.5 py-0.5 rounded uppercase">{post.user.badge}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                                <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'monitor' || user?.id === post.userId) && (
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="space-y-6">
                                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                        {post.content}
                                    </p>
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            className="w-full rounded-[2rem] object-cover max-h-[400px]"
                                        />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors group/btn"
                                        >
                                            <div className="p-2.5 rounded-xl group-hover/btn:bg-pink-50 dark:group-hover/btn:bg-pink-900/10 transition-all">
                                                <Heart size={20} className={post.likesCount > 0 ? 'fill-pink-500 text-pink-500' : ''} />
                                            </div>
                                            <span className="text-xs font-black">{post.likesCount}</span>
                                        </button>
                                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors group/btn">
                                            <div className="p-2.5 rounded-xl group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-blue-900/10 transition-all">
                                                <MessageSquare size={20} />
                                            </div>
                                            <span className="text-xs font-black">{post.commentsCount}</span>
                                        </button>
                                    </div>
                                    <button className="p-2.5 text-gray-400 hover:text-[#3b5998] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default FriendsWallPage;
