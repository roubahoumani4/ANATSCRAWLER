import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { fadeIn, itemVariants } from "@/utils/animations";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const SignupPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const translations = {
    title: "SYSTEM ACCESS",
    subtitle: "DARKSCRAWLER SECURITY FRAMEWORK",
    operatorId: "OPERATOR ID",
    accessCode: "ACCESS CODE",
    confirmAccessCode: "CONFIRM ACCESS CODE",
    authenticate: "AUTHENTICATE",
    signup: "SIGN UP",
    loading: "Creating account...",
    footer: "Advanced Data Discovery & Security Platform",
    loginLink: "Already have an account? Login",
    signupLink: "Need an account? Sign up"
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password, confirmPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }
      toast({
        title: "Success",
        description: "Account created successfully. Please login.",
        variant: "default"
      });
      setLocation("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101726] to-[#181f2c] flex flex-col justify-center items-center px-4">
      <motion.div
        className="max-w-md w-full p-8 bg-[#192132] rounded-xl shadow-xl"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center h-14 w-14 rounded-lg bg-[#3b47fa] mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1
            className="text-2xl font-bold text-white mb-2 uppercase tracking-wide"
            variants={itemVariants}
          >
            {translations.title}
          </motion.h1>
          <motion.p className="text-[#b0b8c9] text-sm tracking-wide mb-2" variants={itemVariants}>
            {translations.subtitle}
          </motion.p>
        </div>
        {error && (
          <motion.div
            className="bg-red-900/30 border border-red-700 text-white p-4 rounded-lg mb-6 flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        <motion.form onSubmit={handleSubmit} variants={fadeIn}>
          <div className="mb-4">
            <label className="block text-[#b0b8c9] mb-2 text-xs font-semibold tracking-wide uppercase">
              {translations.operatorId}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[#b0b8c9]" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 w-full py-3 bg-[#232b3b] border border-[#232b3b] rounded-lg text-white placeholder-[#b0b8c9] focus:outline-none focus:ring-2 focus:ring-[#3b47fa]"
                placeholder="Enter your operator ID"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[#b0b8c9] mb-2 text-xs font-semibold tracking-wide uppercase">
              {translations.accessCode}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#b0b8c9]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full py-3 bg-[#232b3b] border border-[#232b3b] rounded-lg text-white placeholder-[#b0b8c9] focus:outline-none focus:ring-2 focus:ring-[#3b47fa]"
                placeholder="Enter your access code"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b0b8c9] hover:text-white"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-[#b0b8c9] mb-2 text-xs font-semibold tracking-wide uppercase">
              {translations.confirmAccessCode}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#b0b8c9]" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 w-full py-3 bg-[#232b3b] border border-[#232b3b] rounded-lg text-white placeholder-[#b0b8c9] focus:outline-none focus:ring-2 focus:ring-[#3b47fa]"
                placeholder="Confirm your access code"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b0b8c9] hover:text-white"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full py-3 bg-[#3b47fa] text-white rounded-lg font-semibold text-base tracking-wide transition-colors hover:bg-[#2d379c] focus:outline-none focus:ring-2 focus:ring-[#3b47fa] focus:ring-offset-2 focus:ring-offset-[#192132] disabled:bg-opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {translations.loading}
              </span>
            ) : (
              translations.signup
            )}
          </motion.button>
        </motion.form>
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="text-[#3b47fa] hover:text-white text-sm font-medium"
          >
            {translations.loginLink}
          </button>
        </div>
      </motion.div>
      <motion.div
        className="mt-8 text-center text-[#b0b8c9] text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>{translations.footer}</p>
        <p className="mt-2">© {new Date().getFullYear()} ANAT Security</p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
