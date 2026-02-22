import React from 'react';
import { Shield, Eye, User as UserIcon } from 'lucide-react';

interface UserBadgeProps {
    role?: string;
    className?: string;
    showText?: boolean;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role = 'user', className = '', showText = true }) => {
    const getBadgeConfig = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return {
                    icon: Shield,
                    classes: 'bg-purple-100 text-purple-700 border-purple-200',
                    label: 'Admin'
                };
            case 'monitor':
                return {
                    icon: Eye,
                    classes: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                    label: 'Monitor'
                };
            default:
                return {
                    icon: UserIcon,
                    classes: 'bg-gray-100 text-gray-600 border-gray-200',
                    label: 'User'
                };
        }
    };

    const config = getBadgeConfig(role);
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${config.classes} ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {showText && <span>{config.label}</span>}
        </div>
    );
};
