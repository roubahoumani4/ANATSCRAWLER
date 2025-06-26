import React, { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PreferencesSettings = () => {
  const { toast } = useToast();
  
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showIndexedFiles, setShowIndexedFiles] = useState(true);
  const [showRecentSearches, setShowRecentSearches] = useState(true);

  const handleToggleMFA = () => {
    setIsMFAEnabled(!isMFAEnabled);
    toast({
      title: isMFAEnabled 
        ? "MFA disabled" 
        : "MFA enabled",
      description: isMFAEnabled 
        ? "Two-factor authentication has been disabled" 
        : "Two-factor authentication has been enabled",
      variant: "default"
    });
  };

  const handleSaveDashboardPreferences = () => {
    toast({
      title: "Preferences saved",
      description: "Dashboard preferences have been updated",
      variant: "default"
    });
  };

  const handleDeleteAccount = () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter your username and password",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Warning",
      description: "This action is irreversible. Please contact an administrator to delete your account.",
      variant: "destructive"
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="general-settings-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1>Preferences Settings</h1>
      <p>
        Customize your account preferences and security settings.
      </p>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          Multi-Factor Authentication (MFA) Setup
        </h2>
        <p>
          Enhance security by enabling MFA.
        </p>

        <div className="setting-option">
          <label>Enable MFA</label>
          <div className="toggle-switch" onClick={handleToggleMFA}>
            <input type="checkbox" checked={isMFAEnabled} onChange={handleToggleMFA} />
            <span className="toggle-slider"></span>
          </div>
        </div>

        {isMFAEnabled && (
          <motion.div 
            className="mfa-qr-container mt-4 flex flex-col items-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/ANAT:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ANAT" 
              alt="MFA QR Code" 
              className="border-2 border-coolWhite rounded-md" 
            />
            <p className="mt-2 text-sm">Scan this QR code with your authenticator app</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          Dashboard Preferences
        </h2>
        <p>
          Customize which sections appear on your dashboard.
        </p>

        <div className="dashboard-options">
          <label>
            <input 
              type="checkbox" 
              checked={showIndexedFiles} 
              onChange={() => setShowIndexedFiles(!showIndexedFiles)} 
            />
            Show Indexed Files
          </label>

          <label>
            <input 
              type="checkbox" 
              checked={showRecentSearches} 
              onChange={() => setShowRecentSearches(!showRecentSearches)} 
            />
            Show Recent Searches
          </label>
        </div>

        <motion.button 
          className="settings-button mt-4"
          onClick={handleSaveDashboardPreferences}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Save Preferences
        </motion.button>
      </motion.div>

      <motion.div 
        className="settings-box delete-account"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          Account Deletion
        </h2>
        <p>
          Enter your username and password to delete your account.
        </p>

        <div className="setting-option">
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>

        <div className="setting-option">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <motion.button 
          className="delete-button mt-4"
          onClick={handleDeleteAccount}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Delete Account
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default PreferencesSettings;
