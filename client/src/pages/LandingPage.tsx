import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Shield, Terminal, Zap, Globe, AlertTriangle, Eye, Lock, ChevronRight, Skull, Wifi, Code2, Search } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

const LandingPage = () => {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [showLoginSignup, setShowLoginSignup] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Generate matrix-style characters for rain effect
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`".split("");
    setMatrixChars(chars);
  }, []);

  const translations = {
    title: {
      English: "DARKSCRAWLER SECURITY FRAMEWORK",
      French: "CADRE DE SÉCURITÉ DARKSCRAWLER",
      Spanish: "MARCO DE SEGURIDAD DARKSCRAWLER"
    },
    subtitle: {
      English: "Advanced Network Analysis & Deep Web Intelligence",
      French: "Analyse de Réseau Avancée et Intelligence du Web Profond",
      Spanish: "Análisis de Red Avanzado e Inteligencia de la Web Profunda"
    },
    description: {
      English: "Professional cybersecurity reconnaissance tool for penetration testing, threat intelligence, and dark web monitoring operations. Subscription required for full system access.",
      French: "Outil professionnel de reconnaissance cybersécuritaire pour les tests de pénétration, l'intelligence des menaces et les opérations de surveillance du web profond. Abonnement requis pour l'accès complet au système.",
      Spanish: "Herramienta profesional de reconocimiento de ciberseguridad para pruebas de penetración, inteligencia de amenazas y operaciones de monitoreo de la web oscura. Se requiere suscripción para el acceso completo al sistema."
    }
  };

  const handleAccessTerminal = () => {
    setShowAuthOptions(!showAuthOptions);
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  const handleSignup = () => {
    setLocation("/signup");
  };

  const handleSubscribe = () => {
    // Add subscription logic here
    alert("Subscription feature coming soon!");
  };

  const handleDarkWebSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(false);

    try {
      const response = await fetch('/api/darkweb-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } else {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData && errorData.errors && errorData.errors[0] && errorData.errors[0].msg) {
            errorMsg = errorData.errors[0].msg;
          } else if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {}
        console.error('Search failed:', errorMsg);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDarkWebSearch();
    }
  };

  const features = [
    {
      icon: <Terminal className="w-8 h-8" />,
      title: "Deep Web Crawling",
      description: "Advanced reconnaissance and data extraction from hidden network infrastructures"
    },
    {
      icon: <Skull className="w-8 h-8" />,
      title: "Threat Intelligence",
      description: "Real-time threat detection with AI-powered analysis and automated response"
    },
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Network Mapping",
      description: "Comprehensive network topology discovery and vulnerability assessment"
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: "Exploit Analysis",
      description: "Automated vulnerability analysis with detailed penetration testing reports"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative overflow-hidden">
      {/* Matrix Rain Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
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
            {matrixChars.slice(0, 20).map((_, idx) => (
              <div key={idx} className="mb-1">
                {matrixChars[Math.floor(Math.random() * matrixChars.length)]}
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
        {[...Array(20)].map((_, i) => (
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

      {/* Glitch Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"
            style={{ top: `${20 + i * 30}%` }}
            animate={{
              x: ["-100%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <motion.nav 
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-600/30"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 mr-3"
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(79, 70, 229, 0.2)",
                    "0 0 25px rgba(79, 70, 229, 0.4)",
                    "0 0 15px rgba(79, 70, 229, 0.2)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                DARKSCRAWLER
              </span>
            </motion.div>

            <div className="flex items-center space-x-4">
              <motion.button 
                onClick={handleSubscribe}
                className="px-4 py-2 text-sm font-bold border-2 border-green-500/50 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                SUBSCRIBE
              </motion.button>

              <div className="relative">
                <motion.button 
                  onClick={handleAccessTerminal}
                  className="px-6 py-2 text-sm font-bold border-2 border-blue-400/50 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ACCESS TERMINAL
                </motion.button>

                {showAuthOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-900/90 border border-gray-600/50 rounded-lg shadow-xl backdrop-blur-md"
                  >
                    <button
                      onClick={handleLogin}
                      className="w-full px-4 py-3 text-left text-blue-400 hover:bg-blue-600/20 transition-colors rounded-t-lg"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleSignup}
                      className="w-full px-4 py-3 text-left text-green-400 hover:bg-green-600/20 transition-colors rounded-b-lg"
                    >
                      Sign Up
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Main Logo */}
            <motion.div 
              className="mb-8 relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <motion.div
                className="inline-flex items-center justify-center p-8 rounded-full bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border-2 border-blue-400/20"
                animate={{
                  borderColor: [
                    "rgba(59, 130, 246, 0.2)",
                    "rgba(99, 102, 241, 0.3)",
                    "rgba(147, 51, 234, 0.2)",
                    "rgba(59, 130, 246, 0.2)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Shield className="w-24 h-24 text-blue-400" />
              </motion.div>
            </motion.div>

            {/* Title with Glitch Effect */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">
                <motion.span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  DARKSCRAWLER
                </motion.span>
              </h1>

              <motion.p 
                className="text-2xl md:text-3xl font-light text-gray-400 tracking-widest"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(59, 130, 246, 0.3)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 10px rgba(59, 130, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                SECURITY FRAMEWORK
              </motion.p>
            </motion.div>

            {/* Description */}
            <motion.p 
              className="text-xl md:text-2xl text-gray-400 mb-8 max-w-4xl mx-auto font-medium leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              {translations.description[language as keyof typeof translations.description]}
            </motion.p>

            {/* Dark Web Search Bar */}
            <motion.div
              className="max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              <div className="relative">
                <motion.div 
                  className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-900/15 via-indigo-900/15 to-gray-900/30 border-2 border-blue-400/20 backdrop-blur-md"
                  animate={{
                    borderColor: [
                      "rgba(59, 130, 246, 0.2)",
                      "rgba(99, 102, 241, 0.3)",
                      "rgba(59, 130, 246, 0.2)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.h3 
                    className="text-2xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(59, 130, 246, 0.3)",
                        "0 0 20px rgba(59, 130, 246, 0.5)",
                        "0 0 10px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔍 DARK WEB INTELLIGENCE SEARCH
                  </motion.h3>

                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        placeholder="Enter search terms for dark web reconnaissance..."
                        className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border-2 border-blue-400/20 rounded-xl text-white placeholder-gray-400 font-mono text-lg focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                        disabled={isSearching}
                      />
                      {isSearching && (
                        <motion.div
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Terminal className="w-5 h-5 text-blue-400" />
                        </motion.div>
                      )}
                    </div>

                    <motion.button
                      onClick={handleDarkWebSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-xl border-2 border-blue-400/50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSearching ? "SEARCHING..." : "SEARCH"}
                    </motion.button>
                  </div>

                  <div className="mt-4 flex items-center justify-center space-x-6 text-sm font-mono">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400">ELASTICSEARCH CONNECTED</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span className="text-indigo-400">TOR NETWORK READY</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Search Results */}
            {showResults && (
              <motion.div
                className="max-w-6xl mx-auto mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-2 border-blue-400/20 backdrop-blur-md">
                  <h4 className="text-xl font-black text-blue-400 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    RECONNAISSANCE RESULTS ({searchResults.length})
                  </h4>

                  {searchResults.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <motion.div
                          key={index}
                          className="p-4 rounded-lg bg-black/30 border border-gray-700 hover:border-cyan-400/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-white font-mono text-sm">{result.source || 'Unknown Source'}</div>
                              <div className="text-gray-400 text-xs mt-1">{result.timestamp || 'No timestamp'}</div>
                              <div className="text-gray-300 text-sm mt-2">{result.content || result.title || 'No content available'}</div>
                            </div>
                            <div className="text-xs text-cyan-400 font-mono">{result.score || 'N/A'}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-400">No results found for "{searchQuery}"</p>
                      <p className="text-gray-500 text-sm mt-2">Try different search terms or check network connectivity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Status Indicators */}
            <motion.div
              className="flex items-center justify-center space-x-8 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {[
                { icon: Terminal, label: "TERMINAL ACTIVE", color: "text-green-400" },
                { icon: Wifi, label: "NETWORK ONLINE", color: "text-blue-400" },
                { icon: Eye, label: "SURVEILLANCE MODE", color: "text-indigo-400" }
              ].map((status, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center space-x-2 text-sm font-mono"
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    delay: idx * 0.3,
                    repeat: Infinity,
                  }}
                >
                  <status.icon className={`w-4 h-4 ${status.color}`} />
                  <span className={status.color}>{status.label}</span>
                </motion.div>
              ))}
            </motion.div>


          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div 
          className="py-20 px-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              className="text-4xl font-black text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              ADVANCED CAPABILITIES
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-2 border-blue-400/15 backdrop-blur-sm hover:border-blue-400/30 transition-all duration-300"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)" 
                  }}
                >
                  <motion.div 
                    className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-600/15 text-blue-400 inline-block"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Security Warning */}
        <motion.div 
          className="py-12 px-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="p-8 rounded-2xl bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/20 backdrop-blur-sm"
              animate={{
                borderColor: [
                  "rgba(234, 179, 8, 0.2)",
                  "rgba(234, 179, 8, 0.4)",
                  "rgba(234, 179, 8, 0.2)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <AlertTriangle className="w-12 h-12 mr-4 text-yellow-400" />
                </motion.div>
                <Lock className="w-8 h-8 mr-3 text-yellow-400" />
                <Eye className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-yellow-300">
                CLASSIFIED SYSTEM - AUTHORIZED ACCESS ONLY
              </h3>
              <p className="text-center text-gray-400 text-lg leading-relaxed">
                This system contains sensitive security information and is restricted to authorized personnel only. 
                All network activity is monitored, logged, and subject to real-time security analysis. 
                Unauthorized access attempts will be prosecuted to the full extent of the law.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;