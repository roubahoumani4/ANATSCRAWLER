import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { pageVariants, fadeIn } from "@/utils/animations";
import { Eye, EyeOff, User, Lock, Settings, Save, RefreshCw } from "lucide-react";

const EditProfilePage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    organization: user?.organization || "",
    department: user?.department || "",
    jobPosition: user?.jobPosition || ""
  });
  
  const [accountInfo, setAccountInfo] = useState({
    username: user?.username || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccountInfoChange = (field: string, value: string) => {
    setAccountInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePersonalInfo = async () => {
    setIsLoading(true);
    try {
      // API call to update personal information
      const response = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(personalInfo)
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Personal information updated successfully.",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!accountInfo.username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update-username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ username: accountInfo.username })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Username updated successfully.",
        });
      } else {
        throw new Error("Failed to update username");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. It may already be taken.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!accountInfo.currentPassword || !accountInfo.newPassword || !accountInfo.confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required.",
        variant: "destructive",
      });
      return;
    }

    if (accountInfo.newPassword !== accountInfo.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (accountInfo.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          currentPassword: accountInfo.currentPassword,
          newPassword: accountInfo.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Password changed successfully.",
        });
        setAccountInfo(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        throw new Error("Failed to change password");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white p-4"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
    >
      <div className="max-w-4xl mx-auto">
        <BackButton to="/dashboard" color="cyan" />
        
        <motion.div variants={fadeIn} className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Edit Profile
              </h1>
              <p className="text-gray-400 text-lg">
                Manage your account settings and personal information
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800 border border-gray-700">
            <TabsTrigger value="personal" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Lock className="w-4 h-4 mr-2" />
              Account Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="bg-slate-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Personal Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal details and organizational information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-cyan-400">Full Name</Label>
                    <Input
                      id="fullName"
                      value={personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-cyan-400">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-cyan-400">Organization</Label>
                    <Input
                      id="organization"
                      value={personalInfo.organization}
                      onChange={(e) => handlePersonalInfoChange("organization", e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white"
                      placeholder="Enter your organization"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-cyan-400">Department</Label>
                    <Input
                      id="department"
                      value={personalInfo.department}
                      onChange={(e) => handlePersonalInfoChange("department", e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white"
                      placeholder="Enter your department"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobPosition" className="text-cyan-400">Job Position</Label>
                  <Input
                    id="jobPosition"
                    value={personalInfo.jobPosition}
                    onChange={(e) => handlePersonalInfoChange("jobPosition", e.target.value)}
                    className="bg-slate-700 border-gray-600 text-white"
                    placeholder="Enter your job position"
                  />
                </div>

                <Button
                  onClick={handleUpdatePersonalInfo}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Personal Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              {/* Username Update */}
              <Card className="bg-slate-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Change Username</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your login username
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-cyan-400">New Username</Label>
                    <Input
                      id="username"
                      value={accountInfo.username}
                      onChange={(e) => handleAccountInfoChange("username", e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white"
                      placeholder="Enter new username"
                    />
                  </div>
                  
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Update Username
                  </Button>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card className="bg-slate-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Change Password</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your account password for enhanced security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-cyan-400">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={accountInfo.currentPassword}
                        onChange={(e) => handleAccountInfoChange("currentPassword", e.target.value)}
                        className="bg-slate-700 border-gray-600 text-white pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-cyan-400">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={accountInfo.newPassword}
                        onChange={(e) => handleAccountInfoChange("newPassword", e.target.value)}
                        className="bg-slate-700 border-gray-600 text-white pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-cyan-400">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={accountInfo.confirmPassword}
                        onChange={(e) => handleAccountInfoChange("confirmPassword", e.target.value)}
                        className="bg-slate-700 border-gray-600 text-white pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default EditProfilePage;