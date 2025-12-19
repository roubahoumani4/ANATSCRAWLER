import { AnimatePresence } from 'framer-motion';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSessionSocket } from './hooks/useSessionSocket';
import { SessionTerminatedDialog } from './components/SessionTerminatedDialog';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import EnhancedLoginPage from '@/pages/EnhancedLoginPage';
import GeneralSettingsPage from '@/pages/GeneralSettingsPage';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SignupPage from '@/pages/SignupPage';
import AssessmentPage from '@/pages/AssessmentPage';
import OutputPage from '@/pages/OutputPage';
import HistoryPage from '@/pages/HistoryPage';
import OsintPlatformPage from '@/pages/OsintPlatformPage';
import DiscoveryPage from '@/pages/DiscoveryPage';
import DomainMonitoringPage from '@/pages/DomainMonitoringPage';
import ThreatIntelligenceFeedPage from '@/pages/ThreatIntelligenceFeedPage';
import SearchHistoryPage from '@/pages/SearchHistoryPage';
import DarkWebMonitoringPage from '@/pages/DarkWebMonitoringPage';
import ManageUsersPage from '@/pages/ManageUsersPage';
import UserActivityLogsPage from '@/pages/UserActivityLogsPage';
import UserActivityDashboardPage from '@/pages/UserActivityDashboardPage';
import SessionManagementPage from '@/pages/SessionManagementPage';
import IndexManagementPage from '@/pages/IndexManagementPage';
import IndexDetailsPage from '@/pages/IndexDetailsPage';
import IndexQueryPage from '@/pages/IndexQueryPage';

// Layout Component
import Layout from '@/components/layout/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Initialize session socket for real-time session management
  useSessionSocket();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-jetBlack text-coolWhite">
      <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
    </div>
  );
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
};

// Admin Route Component - Only accessible by admin users
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-jetBlack text-coolWhite">
      <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-white rounded-full animate-spin"></div>
    </div>
  );
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Check if user has admin role
  const isAdmin = user?.roles?.includes('admin');
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  
  return <Layout>{children}</Layout>;
};

export default function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Session Termination Dialog - Shows when session is terminated */}
      <SessionTerminatedDialog />
      
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!isAuthenticated ? <EnhancedLoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />} />
          
          {/* Landing Page - Public but redirects if authenticated */}
          <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
          
          {/* Protected Routes */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute><DarkWebMonitoringPage /></ProtectedRoute>} />
    <Route path="/osint" element={<ProtectedRoute><OsintPlatformPage /></ProtectedRoute>} />
    <Route path="/osint/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
    <Route path="/osint/assessment/output" element={<ProtectedRoute><OutputPage /></ProtectedRoute>} />
    <Route path="/osint/assessment/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    <Route path="/discovery" element={<ProtectedRoute><DiscoveryPage /></ProtectedRoute>} />
    <Route path="/domain-monitoring" element={<ProtectedRoute><DomainMonitoringPage /></ProtectedRoute>} />
    <Route path="/search-history" element={<ProtectedRoute><SearchHistoryPage /></ProtectedRoute>} />
    <Route path="/threat-intelligence" element={<ProtectedRoute><ThreatIntelligenceFeedPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><GeneralSettingsPage /></ProtectedRoute>} />
          
          {/* User Management Routes - Admin Only */}
          <Route path="/users/management" element={<AdminRoute><ManageUsersPage /></AdminRoute>} />
          <Route path="/users/activity-logs" element={<AdminRoute><UserActivityLogsPage /></AdminRoute>} />
          <Route path="/users/sessions" element={<AdminRoute><SessionManagementPage /></AdminRoute>} />
          <Route path="/users/activity/:userId" element={<AdminRoute><UserActivityDashboardPage /></AdminRoute>} />
          
          {/* Index Management Routes - Admin Only */}
          <Route path="/index/management" element={<AdminRoute><IndexManagementPage /></AdminRoute>} />
          <Route path="/index/details/:indexName" element={<AdminRoute><IndexDetailsPage /></AdminRoute>} />
          <Route path="/index/query" element={<AdminRoute><IndexQueryPage /></AdminRoute>} />
          
          {/* Fallback Route */}
          <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
