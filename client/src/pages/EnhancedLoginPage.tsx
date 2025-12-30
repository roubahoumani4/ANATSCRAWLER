import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import anatLogo from "@/assets/anatlogo.png";

const EnhancedLoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated) {
      navigate("/dashboard");
    }
    // Set visible after component mounts
    setIsVisible(true);
  }, [isAuthenticated, navigate]);

  const translations = {
    title: {
      English: "SYSTEM ACCESS",
      French: "ACCÈS SYSTÈME"
    },
    subtitle: {
      English: "DARKSCRAWLER SECURITY FRAMEWORK",
      French: "CADRE DE SÉCURITÉ DARKSCRAWLER"
    },
    usernameLabel: {
      English: "OPERATOR ID",
      French: "ID OPÉRATEUR"
    },
    passwordLabel: {
      English: "ACCESS CODE",
      French: "CODE D'ACCÈS"
    },
    loginButton: {
      English: "AUTHENTICATE",
      French: "AUTHENTIFIER"
    },
    backButton: {
      English: "BACK TO HOME",
      French: "RETOUR À L'ACCUEIL"
    },
    errorMessage: {
      English: "Authentication failed. Please verify your credentials.",
      French: "Échec de l'authentification. Veuillez vérifier vos identifiants."
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!identifier.trim() || !password.trim()) {
      setError(translations.errorMessage[language]);
      setIsLoading(false);
      return;
    }

    if (requires2FA && !twoFactorCode.trim()) {
      setError("Please enter your 2FA code");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const result = await login(identifier, password, requires2FA ? twoFactorCode : undefined);
      
      if (result.requiresTwoFactor) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || translations.errorMessage[language]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-white relative overflow-hidden">
      {/* Matrix Rain Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-400 font-mono text-xs opacity-20 select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
            }}
            animate={{
              y: ["0vh", "110vh"],
            }}
            transition={{
              duration: Math.random() * 4 + 6,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "linear"
            }}
          >
            {Array(20).fill(0).map((_, idx) => (
              <div key={idx} className="mb-1">
                {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating Cyber Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 1, 0.3],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Back Button */}
      <motion.button
        onClick={() => navigate("/")}
        className="fixed top-8 left-8 z-50 flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all duration-300 font-medium text-sm group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>{translations.backButton[language]}</span>
      </motion.button>

      {/* Main Container */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Branding */}
          <motion.div
            className="hidden lg:flex flex-col items-center justify-center space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            >
              {/* Glowing Ring Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              
              {/* Logo Container */}
              <div className="relative w-64 h-64 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
                <img 
                  src={anatLogo} 
                  alt="ANATSCRAWLER Logo" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>
            
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ANATSCRAWLER
              </h1>
              <p className="text-lg text-gray-300 max-w-md">
                Advanced Data Discovery & Security Intelligence Platform
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>System Online & Secure</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            className="relative z-10 w-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden flex flex-col items-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-32 h-32 mb-4 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-4">
                <img 
                  src={anatLogo} 
                  alt="ANATSCRAWLER Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ANATSCRAWLER
              </h1>
            </motion.div>

            {/* Login Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/10">
              
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-gray-400">{translations.subtitle[language]}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <motion.div
                    className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center space-x-3 backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-300">{error}</span>
                  </motion.div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    {translations.usernameLabel[language]}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500 hover:bg-white/10"
                      placeholder="Enter your operator ID"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    {translations.passwordLabel[language]}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500 hover:bg-white/10"
                      placeholder="Enter your access code"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 2FA Field - Only shown when required */}
                {requires2FA && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-white">
                      Two-Factor Authentication
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500 text-center text-2xl tracking-widest hover:bg-white/10"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter the 6-digit code from your authenticator app</p>
                  </motion.div>
                )}

                {/* Login Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 mt-6"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{translations.loginButton[language]}</span>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="text-gray-400 text-sm space-y-1">
          <p className="font-medium">© {new Date().getFullYear()} ANATSCRAWLER</p>
          <p className="text-xs text-gray-500">Advanced Data Discovery & Security Platform</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;