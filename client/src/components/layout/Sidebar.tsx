import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Search,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  BarChart2,
  Shield,
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

  const menuItems = [
    {
      path: "/dashboard",
      icon: <BarChart2 size={20} />,
      label: "Dashboard",
      color: "text-blue-400"
    },
    {
      path: "/osint",
      icon: <Terminal size={20} />,
      label: "OSINT Platform",
      color: "text-green-400",
      hasSubmenu: true,
      features: [
        { path: "/dashboard/search", label: "SpiderFoot OSINT", icon: <Search size={16} />, color: "text-purple-400" },
          { path: "/osint", label: "Advanced Search", icon: <Eye size={16} />, color: "text-indigo-400" },
          { path: "/osint/assessment", label: "Assessment", icon: <Zap size={16} />, color: "text-emerald-400" },
          { path: "/darkweb", label: "Dark Web Monitor", icon: <Skull size={16} />, color: "text-red-400" }
      ]
    },
    {
      path: "/analytics",
      icon: <Activity size={20} />,
      label: "Threat Analytics",
      color: "text-cyan-400",
      hasSubmenu: true,
      features: [
        { path: "/analytics/threats", label: "Threat Intelligence", icon: <Shield size={16} />, color: "text-red-400" },
        { path: "/analytics/network", label: "Network Analysis", icon: <Globe size={16} />, color: "text-blue-400" },
        { path: "/analytics/vulnerabilities", label: "Vulnerabilities", icon: <Bug size={16} />, color: "text-orange-400" }
      ]
    },
    {
      path: "/users",
      icon: <Users size={20} />,
      label: "User Management",
      color: "text-yellow-400",
      hasSubmenu: true,
      features: [
        { path: "/users/management", label: "Manage Users", icon: <UserCog size={16} />, color: "text-blue-400" },
        { path: "/users/permissions", label: "Permissions", icon: <Lock size={16} />, color: "text-green-400" },
        { path: "/users/activity", label: "Activity Logs", icon: <Clock size={16} />, color: "text-purple-400" }
      ]
    }
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
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <motion.div
          className="flex items-center"
          variants={logoVariants}
          animate={collapsed ? "collapsed" : "expanded"}
          transition={{ duration: 0.3 }}
        >
          <Shield className="text-crimsonRed mr-2" size={24} />
          <span className="text-lg font-bold text-coolWhite">ANAT Security</span>
        </motion.div>
        
        <button
          onClick={handleCollapseToggle}
          className="p-1 rounded-full hover:bg-darkGray text-coolWhite"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
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
                  {item.features?.map((feature) => (
                    <Link key={feature.path} to={feature.path} className="no-underline">
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
                <span className="text-gray-400">
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
              <div className="ml-3">
                <p className="text-xs font-medium text-coolWhite">{user.username}</p>
                <p className="text-xs text-gray-400">{user.email || user.jobPosition || "User"}</p>
              </div>
            </div>
          )}

          {/* Logout Button under Settings */}
          <div
            className="flex items-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-crimsonRed rounded-lg mt-2"
            onClick={logout}
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;