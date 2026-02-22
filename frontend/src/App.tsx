import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { ThemeProvider, SocketProvider } from './context';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SupportPage from './pages/SupportPage';
import PublicChatPage from './pages/PublicChatPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LobbyPage from './pages/LobbyPage';
import MonitorPage from './pages/MonitorPage';
import FriendsWallPage from './pages/FriendsWallPage';
import NotificationManager from './components/NotificationManager';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import PrivateChatPage from './pages/PrivateChatPage';
import { AdminRoute, MonitorRoute } from './components/RoleRoute';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Smart redirect based on role
const RoleBasedRedirect: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  if (user?.role === 'monitor') return <Navigate to="/monitor" />;
  return <Navigate to="/lobby" />;
};



function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <NotificationManager />
        <GlobalAnnouncement />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wall"
              element={
                <ProtectedRoute>
                  <FriendsWallPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <ProtectedRoute>
                  <PublicChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitor"
              element={
                <MonitorRoute>
                  <MonitorPage />
                </MonitorRoute>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <ProtectedRoute>
                  <PrivateChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
