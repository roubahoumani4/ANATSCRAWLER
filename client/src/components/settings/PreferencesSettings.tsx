import React, { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Lock, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import MatrixBackground from "@/components/ui/MatrixBackground";

const PreferencesSettings = () => {
  const { toast } = useToast();
  
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showIndexedFiles, setShowIndexedFiles] = useState(true);
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success",
      description: "Password changed successfully",
      variant: "default"
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded bg-blue-700/10 text-white">
              <Settings className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Preferences Settings</h1>
              <p className="text-sm text-gray-400 mt-1">
                Customize your account preferences and security settings
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Change Password Section */}
          <motion.div 
            className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="text-blue-400" size={20} />
              Change Password
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Update your password to keep your account secure
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Update Password
              </button>
            </form>
          </motion.div>

          {/* Security Settings Section */}
          <motion.div 
            className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="text-blue-400" size={20} />
              Security Settings
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Enhance security by enabling multi-factor authentication
            </p>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-4">
              <div>
                <h3 className="font-medium text-white">Multi-Factor Authentication (MFA)</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <button
                onClick={handleToggleMFA}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isMFAEnabled ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMFAEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isMFAEnabled && (
              <motion.div 
                className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/ANAT:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ANAT" 
                    alt="MFA QR Code" 
                    className="border-2 border-gray-600 rounded-md mb-3" 
                  />
                  <p className="text-sm text-gray-400 text-center">
                    Scan this QR code with your authenticator app
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Privacy Settings Section */}
          <motion.div 
            className="bg-gray-900/60 border border-gray-800 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="text-blue-400" size={20} />
              Privacy Settings
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Customize which sections appear on your dashboard
            </p>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/70 transition-colors">
                <div>
                  <h3 className="font-medium text-white">Show Indexed Files</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Display indexed files on your dashboard
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={showIndexedFiles} 
                  onChange={() => setShowIndexedFiles(!showIndexedFiles)}
                  className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/70 transition-colors">
                <div>
                  <h3 className="font-medium text-white">Show Recent Searches</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Display your recent search history
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={showRecentSearches} 
                  onChange={() => setShowRecentSearches(!showRecentSearches)}
                  className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
              </label>
            </div>

            <button
              onClick={handleSaveDashboardPreferences}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Save Preferences
            </button>
          </motion.div>

          {/* Account Deletion Section */}
          <motion.div 
            className="bg-gray-900/60 border border-red-900/50 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={20} />
              Danger Zone
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Enter your username"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Enter your password"
                  required 
                />
              </div>

              <button 
                onClick={handleDeleteAccount}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettings;
