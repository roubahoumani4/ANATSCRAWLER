import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";

// Pages
import DashboardPage from "@/pages/DashboardPage";
import LandingPage from "@/pages/LandingPage";
import EnhancedLoginPage from "@/pages/EnhancedLoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OsintFrameworkPage from "@/pages/OsintFrameworkPage";
import DarkwebMonitoringPage from "@/pages/DarkwebMonitoringPage";
import MalwareAnalysisPage from "@/pages/MalwareAnalysisPage";
import WebSecurityScanningPage from "@/pages/WebSecurityScanningPage";
import UsersPage from "@/pages/UsersPage";
import GeneralSettingsPage from "@/pages/GeneralSettingsPage";
import EditProfilePage from "@/pages/EditProfilePage";
import EditUserPage from "@/pages/EditUserPage";
import HistoryPage from "@/pages/HistoryPage";
import AccountChangesPage from "@/pages/AccountChangesPage";
import ActivityLogsPage from "@/pages/ActivityLogsPage";
import ThreatIntelligencePage from "@/pages/ThreatIntelligencePage";
import SocialMediaIntelPage from "@/pages/SocialMediaIntelPage";
import OsintNewScanPage from "@/pages/OsintNewScanPage";
import OsintScansPage from "@/pages/OsintScansPage";

export default function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-jetBlack text-coolWhite">
        <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-coolWhite rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, show landing page or login page
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={EnhancedLoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route>
            <LandingPage />
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }

  // If authenticated, show the app routes
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/osint" component={OsintFrameworkPage} />
        <Route path="/osint/social-media-intel" component={SocialMediaIntelPage} />
        <Route path="/darkweb" component={DarkwebMonitoringPage} />
        <Route path="/malware" component={MalwareAnalysisPage} />
        <Route path="/threat-intel" component={ThreatIntelligencePage} />
        <Route path="/websecurity" component={WebSecurityScanningPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/settings/general" component={GeneralSettingsPage} />
        <Route path="/edit-profile" component={EditProfilePage} />
        <Route path="/edit-user" component={EditUserPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/account-changes" component={AccountChangesPage} />
        <Route path="/activity-logs" component={ActivityLogsPage} />
        <Route path="/osint-engine/new-scan" component={OsintNewScanPage} />
        <Route path="/osint-engine/scans" component={OsintScansPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </AnimatePresence>
  );
}