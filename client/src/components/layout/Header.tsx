import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

const Header = () => {
  const { user } = useAuth();
  const { formatDate, timezone } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Current time state with auto-update
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update the time every second
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  });

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      setSettingsOpen(false);
    }
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };



  const handleMouseEnter = () => {
    setSettingsOpen(true);
  };

  const handleMouseLeave = () => {
    setSettingsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setDropdownOpen(false);
    setSettingsOpen(false);
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <header className="bg-jetBlack text-coolWhite py-2 px-4 flex justify-between items-center border-b-2 border-coolWhite h-20">
      <div className="logo relative">
        <div 
          className="cursor-pointer inline-block"
          onClick={toggleProfileDropdown}
        >
          <img src="/anat-security-logo.svg" alt="ANAT Security Logo" className="max-h-16 w-auto hover:opacity-80 transition-opacity" />
        </div>

        <AnimatePresence>
          {profileDropdownOpen && (
            <motion.div 
              className="profile-dropdown absolute top-20 left-0 bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-400 rounded-lg p-4 shadow-2xl z-50 min-w-[320px]"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="profile-header mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-cyan-400 font-bold text-lg">{user?.fullName || user?.username}</h3>
                  </div>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><span className="text-cyan-400">Organization:</span> {user?.organization || "Not specified"}</p>
                    <p><span className="text-cyan-400">Department:</span> {user?.department || "Not specified"}</p>
                    <p><span className="text-cyan-400">Position:</span> {user?.jobPosition || "Not specified"}</p>
                  </div>
                </div>
              </div>
              
              <div className="profile-actions space-y-2">
                <button 
                  className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                  onClick={() => {
                    handleNavigate("/edit-profile");
                    setProfileDropdownOpen(false);
                  }}
                >
                  <i className="fas fa-edit"></i>
                  <span>Edit Profile</span>
                </button>
                
                <button 
                  className="w-full py-2 px-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-md transition-all duration-200 flex items-center justify-center space-x-2"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                  }}
                >
                  <i className="fas fa-times"></i>
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        className="timezone-display text-lg font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {formatDate(currentTime)}
      </motion.div>

      <div className="user-menu relative">
        <button 
          className="user-button flex items-center gap-2 text-coolWhite bg-transparent border-none cursor-pointer font-bold"
          onClick={toggleDropdown}
        >
          <i className="fas fa-user text-xl"></i>
          <span>{user?.username}</span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div 
              className="dropdown-menu absolute top-12 right-0 bg-jetBlack border border-coolWhite rounded-md p-3 shadow-lg z-50 min-w-[160px]"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div 
                className="settings-dropdown relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button className="dropdown-item w-full text-left py-2 px-3 hover:bg-crimsonRed hover:text-coolWhite text-coolWhite">
                  Settings
                </button>
                
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div 
                      className="settings-submenu absolute left-[-120px] top-0 bg-jetBlack border border-coolWhite rounded-md p-2 min-w-[160px] flex flex-col"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <button 
                        className="w-full py-2 px-3 text-left text-coolWhite hover:bg-crimsonRed transition-colors"
                        onClick={() => handleNavigate("/settings/general")}
                      >
                        General
                      </button>
                      <button 
                        className="w-full py-2 px-3 text-left text-coolWhite hover:bg-crimsonRed transition-colors"
                        onClick={() => handleNavigate("/history")}
                      >
                        History
                      </button>
                      <button 
                        className="w-full py-2 px-3 text-left text-coolWhite hover:bg-crimsonRed transition-colors"
                        onClick={() => handleNavigate("/users")}
                      >
                        Users
                      </button>
                      <button 
                        className="w-full py-2 px-3 text-left text-coolWhite hover:bg-crimsonRed transition-colors"
                        onClick={() => handleNavigate("/settings/preferences")}
                      >
                        Preferences
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                className="dropdown-item w-full text-left py-2 px-3 hover:bg-crimsonRed hover:text-coolWhite text-coolWhite"
                onClick={() => handleNavigate("/edit-user")}
              >
                Edit User
              </button>
              
              <div className="dropdown-item w-full text-left py-2 px-3 flex items-center justify-between">
                <span className="text-coolWhite">Dark Mode</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
