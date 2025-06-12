import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

import BackButton from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  UserCog, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  Shield
} from "lucide-react";

const EditUserPage = () => {
  const { user } = useAuth();
  const { formatDate } = useLanguage();
  const { toast } = useToast();

  // Profile Information State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    organization: user?.organization || "",
    department: user?.department || "",
    jobPosition: user?.jobPosition || ""
  });

  // Username Change State
  const [usernameData, setUsernameData] = useState({
    currentUsername: user?.username || "",
    newUsername: ""
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Show/Hide Password States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading States
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      // API call to update profile
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated.",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameData.newUsername) {
      toast({
        title: "Error",
        description: "Please enter a new username.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingUsername(true);

    try {
      // API call to update username
      const response = await fetch("/api/user/username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUsername: usernameData.currentUsername,
          newUsername: usernameData.newUsername,
        }),
      });

      if (response.ok) {
        toast({
          title: "Username Updated",
          description: "Your username has been successfully changed.",
        });
        setUsernameData(prev => ({
          ...prev,
          currentUsername: prev.newUsername,
          newUsername: ""
        }));
      } else {
        throw new Error("Failed to update username");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // API call to update password
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully changed.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        throw new Error("Failed to update password");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite">
      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <div className="mb-8">
          <BackButton to="/dashboard" color="grey" />
          <div className="flex items-center mt-6 mb-4">
            <UserCog className="mr-3 text-gray-300" size={32} />
            <h1 className="text-3xl font-bold text-white">
              Edit User Profile
            </h1>
          </div>
          <p className="text-gray-400">
            Manage your account information, username, and security settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Information Section */}
          <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="mr-2" size={20} />
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal and professional information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-coolWhite">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-coolWhite">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-coolWhite">Organization Name</Label>
                  <Input
                    id="organization"
                    value={profileData.organization}
                    onChange={(e) => setProfileData(prev => ({ ...prev, organization: e.target.value }))}
                    className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                    placeholder="Enter your organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-coolWhite">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                    placeholder="Enter your department"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobPosition" className="text-coolWhite">Job Description/Position</Label>
                  <Input
                    id="jobPosition"
                    value={profileData.jobPosition}
                    onChange={(e) => setProfileData(prev => ({ ...prev, jobPosition: e.target.value }))}
                    className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                    placeholder="Enter your job position"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white border border-gray-500"
                >
                  {isUpdatingProfile ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2" size={16} />
                      Update Profile
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Username & Security Section */}
          <div className="space-y-8">
            {/* Username Change */}
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <UserCog className="mr-2" size={20} />
                  Change Username
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your login username
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUsernameUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentUsername" className="text-coolWhite">Current Username</Label>
                    <Input
                      id="currentUsername"
                      value={usernameData.currentUsername}
                      disabled
                      className="bg-darkGray border-gray-600 text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newUsername" className="text-coolWhite">New Username</Label>
                    <Input
                      id="newUsername"
                      value={usernameData.newUsername}
                      onChange={(e) => setUsernameData(prev => ({ ...prev, newUsername: e.target.value }))}
                      className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400"
                      placeholder="Enter new username"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingUsername}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white border border-gray-500"
                  >
                    {isUpdatingUsername ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="mr-2" size={16} />
                        Update Username
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="bg-jetBlack/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Shield className="mr-2" size={20} />
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-coolWhite">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-coolWhite"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-coolWhite">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-coolWhite"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-coolWhite">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-darkGray border-gray-600 text-coolWhite focus:border-gray-400 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-coolWhite"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white border border-gray-500"
                  >
                    {isUpdatingPassword ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="mr-2" size={16} />
                        Update Password
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditUserPage;