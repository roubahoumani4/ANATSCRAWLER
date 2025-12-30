import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import anatLogo from "@/assets/anatlogo.png";
import {
  Search,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  BarChart2,
  Globe,
  Eye,
  Bug,
  Skull,
  Terminal,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  UserCog,
  Lock,
  Clock,
  User,
  LogOut,
  AlertTriangle,
  FileText,
  History as HistoryIcon,
  Database,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<{[key: string]: boolean}>({});

  const toggleModule = (path: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Notify parent component when collapsed state changes
  useEffect(() => {
    onToggle?.(collapsed);
  }, [collapsed, onToggle]);

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin');

  const menuItems = [
    {
      path: "/dashboard",
      icon: <BarChart2 size={20} />,
      label: "Dashboard",
      color: "text-white"
    },
    {
      path: "/osint",
      icon: <Terminal size={20} />,
      label: "OSINT Platform",
      color: "text-white",
      hasSubmenu: true,
      features: [
          { path: "/osint/assessment", label: "Assessment", icon: <Zap size={16} />, color: "text-white" },
          { path: "/osint/assessment/output", label: "Output", icon: <FileText size={16} />, color: "text-white" },
          { path: "/osint/assessment/history", label: "History", icon: <HistoryIcon size={16} />, color: "text-white" }
      ]
    },
    {
      path: "/analytics",
      icon: <Activity size={20} />,
      label: "Dark Web Monitoring",
      color: "text-white",
      hasSubmenu: true,
      features: [
        { path: "/threat-intelligence", label: "Threat Intelligence", icon: <AlertTriangle size={16} />, color: "text-white" },
        { path: "/discovery", label: "Discovery", icon: <Search size={16} />, color: "text-white" },
        { path: "/domain-monitoring", label: "Domain Monitoring", icon: <Globe size={16} />, color: "text-white" },
        { path: "/search-history", label: "Search History", icon: <HistoryIcon size={16} />, color: "text-white" }
      ]
    },
    // User Management - Only visible for admin users
    ...(isAdmin ? [{
      path: "/users",
      icon: <Users size={20} />,
      label: "User Management",
      color: "text-white",
      hasSubmenu: true,
      features: [
        { path: "/users/management", label: "Manage Users", icon: <UserCog size={16} />, color: "text-white" },
        { path: "/users/activity-logs", label: "Activity Logs", icon: <Activity size={16} />, color: "text-white" },
        { path: "/users/sessions", label: "Session Management", icon: <Lock size={16} />, color: "text-white" }
      ]
    },
    // Index Management - Only visible for admin users
    {
      path: "/index",
      icon: <Database size={20} />,
      label: "Index Management",
      color: "text-white",
      hasSubmenu: true,
      features: [
        { path: "/index/management", label: "Manage Indices", icon: <Database size={16} />, color: "text-white" },
        { path: "/index/query", label: "Query & Search", icon: <Search size={16} />, color: "text-white" },
        { path: "/index/performance", label: "Performance & Optimization", icon: <Activity size={16} />, color: "text-white" },
        { path: "/index/data-management", label: "Data Management", icon: <Database size={16} />, color: "text-white" },
        { path: "/index/admin-logs", label: "Admin Activity Logs", icon: <ClipboardList size={16} />, color: "text-white" },
      ]
    }] : [])
  ];

  const sidebarVariants = {
    expanded: { width: "240px" },
    collapsed: { width: "70px" },
  };

  const logoVariants = {
    expanded: { opacity: 1, display: "block" },
    collapsed: { opacity: 0, display: "none", transition: { delay: 0 } },
  };

  const labelVariants = {
    expanded: { opacity: 1, display: "block" },
    collapsed: { opacity: 0, display: "none", transition: { delay: 0 } },
  };

  return (
    <motion.div
      className="flex flex-col h-screen bg-jetBlack border-r border-gray-800 shadow-lg fixed z-20"
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.3, type: "tween" }}
    >
      <div className="relative flex items-start justify-center h-32 border-b border-gray-800 overflow-hidden pt-2">
        <motion.div
          className="flex items-center justify-center"
          variants={logoVariants}
          animate={collapsed ? "collapsed" : "expanded"}
          transition={{ duration: 0.3 }}
        >
          <img 
            src={anatLogo} 
            alt="ANATSCRAWLER Logo" 
            className={collapsed ? "w-16 h-16" : "w-48 h-48"}
            style={{ objectFit: "contain" }}
          />
        </motion.div>
      </div>

      <div className="flex-1 py-6 flex flex-col justify-between overflow-y-auto">
        <div className="px-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.path}>
              {/* Main Menu Item */}
              <Link to={item.path} className="no-underline">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors duration-200 
                  ${location.pathname === item.path ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/50 text-coolWhite' : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'}`}
                >
                  <div className="flex items-center w-full">
                    <span className={item.color || 'text-coolWhite'}>
                      {item.icon}
                    </span>
                    <motion.span
                      className="ml-3 text-sm font-medium whitespace-nowrap flex-1"
                      variants={labelVariants}
                      animate={collapsed ? "collapsed" : "expanded"}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  </div>
                </div>
              </Link>

              {/* Submenu Items - Always Visible, Navigate to Parent Page */}
              {item.hasSubmenu && !collapsed && (
                <div className="space-y-1 mb-2" style={{ marginLeft: '1.5rem' }}>
                  {item.features?.map((feature: any) => (
                    <div key={feature.path}>
                      <Link to={feature.path} className="no-underline">
                        <div className={`flex items-center px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors duration-200 
                          ${location.pathname === feature.path 
                            ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/30 text-coolWhite' 
                            : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'
                          }`}>
                          <span className={feature.color || "text-gray-400"}>
                            {feature.icon}
                          </span>
                          <span className="ml-3">{feature.label}</span>
                        </div>
                      </Link>
                      
                      {/* Nested submenu for Discovery */}
                      {feature.hasSubmenu && feature.subFeatures && (
                        <div className="space-y-1 mt-1" style={{ marginLeft: '1.5rem' }}>
                          {feature.subFeatures.map((subFeature: any) => (
                            <Link key={subFeature.path} to={subFeature.path} className="no-underline">
                              <div className={`flex items-center px-3 py-2 text-xs cursor-pointer rounded-lg transition-colors duration-200 
                                ${location.pathname === subFeature.path 
                                  ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/30 text-coolWhite' 
                                  : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'
                                }`}>
                                <span className={subFeature.color || "text-gray-400"}>
                                  {subFeature.icon}
                                </span>
                                <span className="ml-3">{subFeature.label}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-2 mt-auto space-y-1">
          <div className="border-t border-gray-800 pt-4 pb-2">
            {/* Settings */}
            <Link to="/settings">
              <div className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors duration-200 
                ${location.pathname === '/settings' 
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                  : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'
                }`}>
                <span className="text-white">
                  <Settings size={20} />
                </span>
                <motion.span
                  className="ml-3 text-sm font-medium whitespace-nowrap"
                  variants={labelVariants}
                  animate={collapsed ? "collapsed" : "expanded"}
                  transition={{ duration: 0.2 }}
                >
                  Settings
                </motion.span>
              </div>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center px-3 py-2 mt-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-darkGray flex items-center justify-center text-coolWhite">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              {!collapsed && (
                <div className="ml-3">
                  <p className="text-xs font-medium text-coolWhite">{user.username}</p>
                  <p className="text-xs text-gray-400">
                    {isAdmin ? "Admin" : user.email || user.jobPosition || "User"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Logout Button under Settings */}
          {!collapsed && (
            <div
              className="flex items-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-crimsonRed rounded-lg mt-2"
              onClick={logout}
            >
              <LogOut size={20} />
              <span className="ml-3">Logout</span>
            </div>
          )}
          {collapsed && (
            <div
              className="flex items-center justify-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-crimsonRed rounded-lg mt-2"
              onClick={logout}
            >
              <LogOut size={20} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;