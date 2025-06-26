import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";
import { Shield, Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";

const EnhancedLoginPage = () => {
  const { login } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    setIsVisible(true);
    // Fetch CSRF token on mount
    fetch("/api/csrf-token", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);

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

    try {
      await login(identifier, password, csrfToken);
      setLocation("/dashboard");
    } catch (err) {
      setError(translations.errorMessage[language]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden flex flex-col items-center justify-center">
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

      {/* Centered Card and Footer */}
      <div className="flex flex-col items-center justify-center w-full">
        {/* Main Content */}
        <motion.div
          className="relative z-10 w-full max-w-lg mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Login Form Container */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-gray-700">
            
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-indigo-900 rounded-xl flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Shield className="w-8 h-8 text-indigo-400" />
              </motion.div>
              
              <motion.h1
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {translations.title[language]}
              </motion.h1>
              
              <motion.p
                className="text-sm text-gray-400 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {translations.subtitle[language]}
              </motion.p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
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

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {translations.usernameLabel[language]}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {translations.passwordLabel[language]}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

              {/* Signup Link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setLocation("/signup")}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  {language === "English" ? "Need an account? Sign up" : "Besoin d'un compte? S'inscrire"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Advanced Data Discovery & Security Platform</p>
          <p className="mt-2">© {new Date().getFullYear()} ANAT Security</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;