import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";
import { Shield, Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SignupPage = () => {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const translations = {
    title: {
      English: "SYSTEM REGISTRATION",
      French: "INSCRIPTION AU SYSTÈME"
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
    confirmPasswordLabel: {
      English: "CONFIRM ACCESS CODE",
      French: "CONFIRMER CODE D'ACCÈS"
    },
    signupButton: {
      English: "CREATE ACCOUNT",
      French: "CRÉER UN COMPTE"
    },
    backButton: {
      English: "BACK TO HOME",
      French: "RETOUR À L'ACCUEIL"
    },
    loginLink: {
      English: "Already have an account? Login",
      French: "Déjà un compte? Connexion"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      toast({
        title: "Success",
        description: "Account created successfully. Please login.",
        variant: "default",
      });

      setLocation("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden flex items-center justify-center">
      {/* Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Back Button */}
      <motion.button
        onClick={() => setLocation("/")}
        className="fixed top-6 left-6 z-50 flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium text-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{translations.backButton[language]}</span>
      </motion.button>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.95
        }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-8 bg-darkGray rounded-xl shadow-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Shield className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
            <h1 className="text-2xl font-bold tracking-wider mb-2">{translations.title[language]}</h1>
            <p className="text-indigo-400 text-sm">{translations.subtitle[language]}</p>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center space-x-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </motion.div>
        )}

        {/* Form Container */}
        <div className="bg-gray-900/60 rounded-lg p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.usernameLabel[language]}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-indigo-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#FFFBE6] border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Enter your operator ID"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.passwordLabel[language]}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-indigo-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-[#FFFBE6] border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Enter your access code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-indigo-400 hover:text-indigo-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.confirmPasswordLabel[language]}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-indigo-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-[#FFFBE6] border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-indigo-400 hover:text-indigo-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "CREATE ACCOUNT"
              )}
            </motion.button>

            {/* Login Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                {translations.loginLink[language]}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
