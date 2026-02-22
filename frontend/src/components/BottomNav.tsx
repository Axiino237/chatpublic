import React from 'react';
import { MessageSquare, Users } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'chat' | 'explorers';
    onTabChange: (tab: 'chat' | 'explorers') => void;
    badges?: {
        explorers?: number;
    };
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, badges }) => {
    const navItems = [
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'explorers', icon: Users, label: 'Explorers' },
    ] as const;

    return (
        <nav className="contact-bottom-nav fixed bottom-0 left-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe z-50 md:hidden block">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative group ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 -translate-y-1' : ''}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            {/* Label removed as requested */}

                            {/* Badges */}
                            {item.id === 'explorers' && badges?.explorers && badges.explorers > 0 && (
                                <span className="absolute top-2 right-6 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
