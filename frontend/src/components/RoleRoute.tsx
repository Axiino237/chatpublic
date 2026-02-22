import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface RoleRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/lobby" />;
    }

    return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RoleRoute allowedRoles={['admin']}>{children}</RoleRoute>
);

export const MonitorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RoleRoute allowedRoles={['admin', 'monitor']}>{children}</RoleRoute>
);
