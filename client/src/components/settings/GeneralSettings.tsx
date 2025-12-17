import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, Bell, Eye, EyeOff, QrCode, Check, X } from "lucide-react";

const GeneralSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 2FA setup states
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [disable2FAToken, setDisable2FAToken] = useState("");
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [scanCompletionAlerts, setScanCompletionAlerts] = useState(true);
  const [threatDetectionAlerts, setThreatDetectionAlerts] = useState(true);
  
  // Privacy settings
  const [activityLogging, setActivityLogging] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(false);

  // Fetch security settings
  const { data: securitySettings, refetch: refetchSecuritySettings } = useQuery({
    queryKey: ['securitySettings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/v1/security/settings");
      return response.json();
    },
  });

  useEffect(() => {
    if (securitySettings?.settings) {
      setTwoFactorEnabled(securitySettings.settings.mfaEnabled);
      setSessionTimeout(securitySettings.settings.sessionTimeout);
    }
  }, [securitySettings]);

  const passwordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      const response = await apiRequest(
        "PUT", 
        "/api/v1/user/change-password", 
        passwordData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully.",
        variant: "default"
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to change password.",
        variant: "destructive"
      });
    }
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/v1/2fa/setup");
      return response.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setTwoFactorSecret(data.secret);
      setShow2FASetup(true);
      toast({
        title: "2FA Setup",
        description: "Scan the QR code with your authenticator app.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to setup 2FA.",
        variant: "destructive"
      });
    }
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/v1/2fa/verify", { token });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "2FA enabled successfully!",
      });
      setShow2FASetup(false);
      setVerificationCode("");
      setTwoFactorEnabled(true);
      refetchSecuritySettings();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Invalid verification code.",
        variant: "destructive"
      });
    }
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (data: { password: string; token: string }) => {
      const response = await apiRequest("POST", "/api/v1/2fa/disable", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "2FA disabled successfully.",
      });
      setShowDisable2FA(false);
      setDisable2FAPassword("");
      setDisable2FAToken("");
      setTwoFactorEnabled(false);
      refetchSecuritySettings();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to disable 2FA.",
        variant: "destructive"
      });
    }
  });

  const sessionTimeoutMutation = useMutation({
    mutationFn: async (timeout: number) => {
      const response = await apiRequest("PUT", "/api/v1/security/session-timeout", { 
        sessionTimeout: timeout 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Session timeout updated. Will apply on next login.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update session timeout.",
        variant: "destructive"
      });
    }
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    passwordMutation.mutate({ 
      currentPassword, 
      newPassword 
    });
  };

  const handleSecuritySettingsSave = () => {
    // Save session timeout
    sessionTimeoutMutation.mutate(sessionTimeout);
  };

  const handle2FAToggle = () => {
    if (twoFactorEnabled) {
      // Disable 2FA
      setShowDisable2FA(true);
    } else {
      // Enable 2FA
      setup2FAMutation.mutate();
    }
  };

  const handleVerify2FA = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive"
      });
      return;
    }
    verify2FAMutation.mutate(verificationCode);
  };

  const handleDisable2FA = () => {
    if (!disable2FAPassword) {
      toast({
        title: "Error",
        description: "Password is required to disable 2FA.",
        variant: "destructive"
      });
      return;
    }
    if (!disable2FAToken || disable2FAToken.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit 2FA code.",
        variant: "destructive"
      });
      return;
    }
    disable2FAMutation.mutate({ 
      password: disable2FAPassword, 
      token: disable2FAToken 
    });
  };

  const handleNotificationSettingsSave = () => {
    // In a real implementation, this would save to backend
    toast({
      title: "Success",
      description: "Notification preferences updated successfully.",
      variant: "default"
    });
  };

  const handlePrivacySettingsSave = () => {
    // In a real implementation, this would save to backend
    toast({
      title: "Success",
      description: "Privacy settings updated successfully.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account security, notifications, and privacy preferences</p>
        </motion.div>

        <div className="space-y-6">
          {/* Change Password Section */}
          <motion.div
            className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-red-700/10 text-red-400">
                <Lock size={20} />
              </div>
              <h2 className="text-xl font-semibold">Change Password</h2>
            </div>

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
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition pr-12"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
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
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition pr-12"
                    placeholder="Enter new password (min 8 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={passwordMutation.isPending}
                className="px-6 py-3 bg-[hsl(var(--crimsonRed))] text-white rounded font-semibold hover:bg-[hsl(var(--crimsonRed),.85)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </motion.button>
            </form>
          </motion.div>

          {/* Security Settings Section */}
          <motion.div
            className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-purple-700/10 text-purple-400">
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400 mt-1">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={handle2FAToggle}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <div className="py-3">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Session Timeout (minutes)
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500 transition"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                </select>
                <p className="text-sm text-gray-400 mt-2">Automatically log out after period of inactivity</p>
              </div>

              <motion.button
                onClick={handleSecuritySettingsSave}
                className="px-6 py-2 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Security Settings
              </motion.button>
            </div>
          </motion.div>

          {/* Notification Preferences Section */}
          <motion.div
            className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-blue-700/10 text-blue-400">
                <Bell size={20} />
              </div>
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h3 className="font-medium text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-400 mt-1">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h3 className="font-medium text-white">Security Alerts</h3>
                  <p className="text-sm text-gray-400 mt-1">Get notified about security issues</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securityAlerts}
                    onChange={(e) => setSecurityAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h3 className="font-medium text-white">Scan Completion Alerts</h3>
                  <p className="text-sm text-gray-400 mt-1">Notify when OSINT scans complete</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scanCompletionAlerts}
                    onChange={(e) => setScanCompletionAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-white">Threat Detection Alerts</h3>
                  <p className="text-sm text-gray-400 mt-1">Critical alerts for detected threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={threatDetectionAlerts}
                    onChange={(e) => setThreatDetectionAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <motion.button
                onClick={handleNotificationSettingsSave}
                className="px-6 py-2 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Notification Preferences
              </motion.button>
            </div>
          </motion.div>

          {/* Privacy Settings Section */}
          <motion.div
            className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-green-700/10 text-green-400">
                <Eye size={20} />
              </div>
              <h2 className="text-xl font-semibold">Privacy Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <h3 className="font-medium text-white">Activity Logging</h3>
                  <p className="text-sm text-gray-400 mt-1">Track and log your platform activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityLogging}
                    onChange={(e) => setActivityLogging(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-white">Share Usage Analytics</h3>
                  <p className="text-sm text-gray-400 mt-1">Help improve the platform by sharing anonymous usage data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareAnalytics}
                    onChange={(e) => setShareAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--crimsonRed))]"></div>
                </label>
              </div>

              <motion.button
                onClick={handlePrivacySettingsSave}
                className="px-6 py-2 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Privacy Settings
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full border border-gray-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <QrCode className="text-purple-400" />
                  Setup 2FA
                </h2>
                <button
                  onClick={() => setShow2FASetup(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded flex justify-center">
                  {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />}
                </div>
                
                <p className="text-sm text-gray-400 text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShow2FASetup(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleVerify2FA}
                    disabled={verify2FAMutation.isPending || verificationCode.length !== 6}
                    className="flex-1 px-6 py-3 bg-[hsl(var(--crimsonRed))] text-white rounded font-semibold hover:bg-[hsl(var(--crimsonRed),.85)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {verify2FAMutation.isPending ? "Verifying..." : "Verify & Enable"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisable2FA && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full border border-gray-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Shield className="text-red-400" />
                  Disable 2FA
                </h2>
                <button
                  onClick={() => setShowDisable2FA(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                To disable two-factor authentication, please enter your password and current 2FA code.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={disable2FAPassword}
                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    value={disable2FAToken}
                    onChange={(e) => setDisable2FAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-[#232323] border border-gray-700 rounded text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowDisable2FA(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded font-semibold hover:bg-gray-600 transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDisable2FA}
                    disabled={disable2FAMutation.isPending}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {disable2FAMutation.isPending ? "Disabling..." : "Disable 2FA"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;
