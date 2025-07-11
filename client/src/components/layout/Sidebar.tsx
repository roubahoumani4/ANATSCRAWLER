import { useState } from "react";
import { Link, useLocation } from "wouter";
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

const Sidebar = () => {
  const [location] = useLocation();
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

  const menuItems = [
    {
      path: "/",
      icon: <BarChart2 size={20} />,
      label: "Dashboard",
      color: "text-blue-400"
    },
    {
      path: "/osint",
      icon: <Terminal size={20} />,
      label: "OSINT Framework",
      color: "text-green-400",
      hasSubmenu: true,
      features: [
        { path: "/osint/research-tools", label: "Research Tools", icon: <Search size={16} /> },
        { path: "/osint/data-collection", label: "Data Collection", icon: <Globe size={16} /> },
        { path: "/osint/social-media-intel", label: "Social Media Intel", icon: <Users size={16} /> },
        { path: "/osint/domain-analysis", label: "Domain Analysis", icon: <Globe size={16} /> },
        { path: "/osint/image-analysis", label: "Image Analysis", icon: <Eye size={16} /> }
      ]
    },
    {
      path: "/darkweb",
      icon: <Skull size={20} />,
      label: "Darkweb Monitoring", 
      color: "text-purple-400",
      hasSubmenu: true,
      features: [
        { path: "/darkweb/threat-intel", label: "Threat Intelligence", icon: <Shield size={16} /> },
        { path: "/darkweb/credential-monitor", label: "Credential Monitoring", icon: <UserCog size={16} /> },
        { path: "/darkweb/market-analysis", label: "Market Analysis", icon: <BarChart2 size={16} /> },
        { path: "/darkweb/leaked-data", label: "Leaked Data Search", icon: <Search size={16} /> },
        { path: "/darkweb/alerts", label: "Security Alerts", icon: <Activity size={16} /> }
      ]
    },
    {
      path: "/malware",
      icon: <Bug size={20} />,
      label: "Malware Analysis",
      color: "text-red-400",
      hasSubmenu: true,
      features: [
        { path: "/malware/static-analysis", label: "Static Analysis", icon: <Terminal size={16} /> },
        { path: "/malware/dynamic-analysis", label: "Dynamic Analysis", icon: <Activity size={16} /> },
        { path: "/malware/sandbox", label: "Sandbox Environment", icon: <Shield size={16} /> },
        { path: "/malware/signature-scan", label: "Signature Scanning", icon: <Search size={16} /> },
        { path: "/malware/behavior-analysis", label: "Behavior Analysis", icon: <Eye size={16} /> }
      ]
    },
    {
      path: "/websecurity",
      icon: <Shield size={20} />,
      label: "Web Security Scanning",
      color: "text-cyan-400",
      hasSubmenu: true,
      features: [
        { path: "/websecurity/vulnerability-scan", label: "Vulnerability Assessment", icon: <Bug size={16} /> },
        { path: "/websecurity/port-scan", label: "Port Scanning", icon: <Terminal size={16} /> },
        { path: "/websecurity/ssl-analysis", label: "SSL/TLS Analysis", icon: <Lock size={16} /> },
        { path: "/websecurity/penetration-test", label: "Penetration Testing", icon: <Zap size={16} /> },
        { path: "/websecurity/compliance-check", label: "Compliance Check", icon: <Shield size={16} /> }
      ]
    },
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
          onClick={() => setCollapsed(!collapsed)}
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
              <Link href={item.path} className="no-underline">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors duration-200 
                  ${location === item.path ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/50 text-coolWhite' : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'}`}
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
                    <Link key={feature.path} href={item.path} className="no-underline">
                      <div className="flex items-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-darkGray hover:border hover:border-gray-700/50 rounded-lg transition-colors duration-200">
                        <span className="text-gray-400">
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
            {/* History Section */}
            <div className="mb-4">
              <Link href="/history">
                <div className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors duration-200 
                  ${location === '/history' 
                    ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                    : 'text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50'
                  }`}>
                  <span className="text-gray-400">
                    <Clock size={20} />
                  </span>
                  <motion.span
                    className="ml-3 text-sm font-medium whitespace-nowrap"
                    variants={labelVariants}
                    animate={collapsed ? "collapsed" : "expanded"}
                    transition={{ duration: 0.2 }}
                  >
                    History
                  </motion.span>
                </div>
              </Link>
              
              {/* History Submenu - Always Visible with proper alignment */}
              {!collapsed && (
                <div className="space-y-1 mb-2" style={{ marginLeft: '1.5rem' }}>
                  <Link href="/account-changes" className="no-underline">
                    <div className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-darkGray hover:border hover:border-gray-700/50 rounded-lg transition-colors duration-200
                      ${location === '/account-changes' 
                        ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                        : 'text-coolWhite hover:text-coolWhite'
                      }`}>
                      <span className="text-gray-400">
                        <User size={16} />
                      </span>
                      <span className="ml-3">Account Changes</span>
                    </div>
                  </Link>
                  <Link href="/activity-logs" className="no-underline">
                    <div className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-darkGray hover:border hover:border-gray-700/50 rounded-lg transition-colors duration-200
                      ${location === '/activity-logs' 
                        ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                        : 'text-coolWhite hover:text-coolWhite'
                      }`}>
                      <span className="text-gray-400">
                        <Activity size={16} />
                      </span>
                      <span className="ml-3">Activity Logs</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Settings Dropdown */}
            <div>
              <div
                className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors duration-200 
                text-coolWhite hover:bg-darkGray hover:border hover:border-gray-700/50`}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <div className="flex items-center w-full">
                  <span className="text-gray-400">
                    <Settings size={20} />
                  </span>
                  <motion.span
                    className="ml-3 text-sm font-medium whitespace-nowrap flex-1"
                    variants={labelVariants}
                    animate={collapsed ? "collapsed" : "expanded"}
                    transition={{ duration: 0.2 }}
                  >
                    Settings
                  </motion.span>
                  {!collapsed && (
                    <motion.div
                      animate={{ rotate: settingsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Settings Dropdown Menu */}
              <AnimatePresence>
                {settingsOpen && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1 mb-2"
                    style={{ marginLeft: '1.5rem' }}
                  >
                    <Link href="/edit-user" className="no-underline">
                      <div className="flex items-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-darkGray hover:border hover:border-gray-700/50 rounded-lg transition-colors duration-200">
                        <span className="text-gray-400">
                          <UserCog size={16} />
                        </span>
                        <span className="ml-3">Edit User</span>
                      </div>
                    </Link>
                    <Link href="/users" className="no-underline">
                      <div className="flex items-center px-3 py-2 text-sm text-coolWhite cursor-pointer hover:bg-darkGray hover:border hover:border-gray-700/50 rounded-lg transition-colors duration-200">
                        <span className="text-gray-400">
                          <Users size={16} />
                        </span>
                        <span className="ml-3">Users</span>
                      </div>
                    </Link>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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