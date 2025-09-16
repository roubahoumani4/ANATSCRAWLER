import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Terminal, Search, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SpiderFootIntegratedProps {
  className?: string;
}

const SpiderFootIntegrated: React.FC<SpiderFootIntegratedProps> = ({ className = '' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Custom CSS to inject into SpiderFoot to match our theme
  const spiderFootCustomCSS = `
    <style>
      /* Dark theme matching DARKSCRAWLER aesthetic */
      body {
        background: linear-gradient(135deg, #111827 0%, #000000 50%, #111827 100%) !important;
        color: #e5e7eb !important;
        font-family: 'Inter', system-ui, sans-serif !important;
      }
      
      /* Header styling */
      .navbar, .nav, .header, #header {
        background: rgba(17, 24, 39, 0.9) !important;
        border-bottom: 2px solid rgba(59, 130, 246, 0.2) !important;
        backdrop-filter: blur(10px) !important;
      }
      
      /* Navigation items */
      .nav-link, .navbar-nav .nav-link, a {
        color: #60a5fa !important;
        font-weight: 600 !important;
        transition: all 0.3s ease !important;
      }
      
      .nav-link:hover, .navbar-nav .nav-link:hover, a:hover {
        color: #3b82f6 !important;
        text-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
      }
      
      /* SpiderFoot logo and branding */
      .navbar-brand, .logo {
        color: #3b82f6 !important;
        font-weight: 900 !important;
        text-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
      }
      
      /* Main content areas */
      .container, .container-fluid, .main-content {
        background: transparent !important;
        color: #e5e7eb !important;
      }
      
      /* Cards and panels */
      .card, .panel, .well, .box {
        background: rgba(17, 24, 39, 0.6) !important;
        border: 2px solid rgba(59, 130, 246, 0.2) !important;
        border-radius: 16px !important;
        backdrop-filter: blur(10px) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      }
      
      .card-header, .panel-heading {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
        border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
        color: #60a5fa !important;
        font-weight: 700 !important;
      }
      
      /* Form elements */
      .form-control, input, select, textarea {
        background: rgba(31, 41, 55, 0.8) !important;
        border: 2px solid rgba(59, 130, 246, 0.2) !important;
        border-radius: 12px !important;
        color: #e5e7eb !important;
        font-family: 'JetBrains Mono', monospace !important;
      }
      
      .form-control:focus, input:focus, select:focus, textarea:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        background: rgba(31, 41, 55, 0.9) !important;
      }
      
      /* Buttons */
      .btn, button {
        background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
        border: 2px solid rgba(59, 130, 246, 0.5) !important;
        border-radius: 12px !important;
        color: white !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        transition: all 0.3s ease !important;
      }
      
      .btn:hover, button:hover {
        background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
        transform: translateY(-2px) !important;
      }
      
      .btn-primary { background: linear-gradient(90deg, #3b82f6, #6366f1) !important; }
      .btn-success { background: linear-gradient(90deg, #10b981, #059669) !important; }
      .btn-warning { background: linear-gradient(90deg, #f59e0b, #d97706) !important; }
      .btn-danger { background: linear-gradient(90deg, #ef4444, #dc2626) !important; }
      
      /* Tables */
      .table, table {
        background: rgba(17, 24, 39, 0.6) !important;
        color: #e5e7eb !important;
        border-radius: 12px !important;
        overflow: hidden !important;
      }
      
      .table th, table th {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
        color: #60a5fa !important;
        font-weight: 700 !important;
        border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
      }
      
      .table td, table td {
        border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
        color: #d1d5db !important;
      }
      
      .table-striped tbody tr:nth-of-type(odd) {
        background: rgba(31, 41, 55, 0.3) !important;
      }
      
      /* Progress bars */
      .progress {
        background: rgba(31, 41, 55, 0.6) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }
      
      .progress-bar {
        background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
      }
      
      /* Alerts and messages */
      .alert {
        background: rgba(17, 24, 39, 0.8) !important;
        border: 2px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 12px !important;
        color: #e5e7eb !important;
      }
      
      .alert-info { border-color: rgba(59, 130, 246, 0.5) !important; }
      .alert-success { border-color: rgba(16, 185, 129, 0.5) !important; }
      .alert-warning { border-color: rgba(245, 158, 11, 0.5) !important; }
      .alert-danger { border-color: rgba(239, 68, 68, 0.5) !important; }
      
      /* Sidebar */
      .sidebar, .nav-sidebar {
        background: rgba(17, 24, 39, 0.9) !important;
        border-right: 2px solid rgba(59, 130, 246, 0.2) !important;
      }
      
      /* Footer */
      .footer, footer {
        background: rgba(17, 24, 39, 0.9) !important;
        border-top: 2px solid rgba(59, 130, 246, 0.2) !important;
        color: #9ca3af !important;
      }
      
      /* Dropdown menus */
      .dropdown-menu {
        background: rgba(17, 24, 39, 0.95) !important;
        border: 2px solid rgba(59, 130, 246, 0.2) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(10px) !important;
      }
      
      .dropdown-item {
        color: #e5e7eb !important;
        transition: all 0.3s ease !important;
      }
      
      .dropdown-item:hover {
        background: rgba(59, 130, 246, 0.2) !important;
        color: #60a5fa !important;
      }
      
      /* Badges and labels */
      .badge, .label {
        background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
        color: white !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
      }
      
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px !important;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.5) !important;
      }
      
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6, #6366f1) !important;
        border-radius: 4px !important;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #2563eb, #4f46e5) !important;
      }
      
      /* Animation effects */
      * {
        transition: all 0.3s ease !important;
      }
      
      /* Matrix-like effects for text inputs */
      input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus {
        text-shadow: 0 0 5px rgba(59, 130, 246, 0.5) !important;
      }
      
      /* Glowing borders for important elements */
      .btn-primary:hover, .form-control:focus {
        animation: glow 2s infinite alternate !important;
      }
      
      @keyframes glow {
        from {
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.5) !important;
        }
        to {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8) !important;
        }
      }
      
      /* Hide or modify SpiderFoot branding to integrate with DARKSCRAWLER */
      .spiderfoot-logo, #spiderfoot-logo {
        filter: hue-rotate(200deg) brightness(1.2) !important;
      }
      
      /* Custom header integration */
      body::before {
        content: "🕷️ DARKSCRAWLER OSINT ENGINE - SPIDERFOOT INTEGRATION";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #1f2937, #111827, #1f2937);
        color: #60a5fa;
        text-align: center;
        padding: 8px;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 2px;
        z-index: 10000;
        border-bottom: 2px solid rgba(59, 130, 246, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      
      /* Adjust body padding to account for custom header */
      body {
        padding-top: 35px !important;
      }
    </style>
  `;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const injectCustomStyling = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Remove existing custom styles
          const existingStyles = iframeDoc.querySelector('#darkscrawler-custom-styles');
          if (existingStyles) {
            existingStyles.remove();
          }

          // Inject new styles
          const styleElement = iframeDoc.createElement('div');
          styleElement.id = 'darkscrawler-custom-styles';
          styleElement.innerHTML = spiderFootCustomCSS;
          iframeDoc.head.appendChild(styleElement);

          console.log('✅ DARKSCRAWLER theme applied to SpiderFoot interface');
        }
      } catch (error) {
        console.warn('⚠️ Could not inject custom styles into SpiderFoot iframe:', error);
      }
    };

    // Try to inject styles when iframe loads
    iframe.addEventListener('load', injectCustomStyling);

    // Also try to inject styles periodically in case of dynamic content
    const styleInterval = setInterval(injectCustomStyling, 3000);

    return () => {
      iframe.removeEventListener('load', injectCustomStyling);
      clearInterval(styleInterval);
    };
  }, []);

  const translations = {
    title: {
      English: "OSINT Intelligence Platform",
      French: "Plateforme de Renseignement OSINT", 
      Spanish: "Plataforma de Inteligencia OSINT"
    },
    subtitle: {
      English: "Powered by SpiderFoot Engine",
      French: "Alimenté par le Moteur SpiderFoot",
      Spanish: "Impulsado por el Motor SpiderFoot"
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 ${className}`}>
      {/* Custom Header */}
      <motion.div
        className="bg-gray-900/80 border-b-2 border-cyan-400/20 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </motion.button>

            <motion.div
              className="flex items-center space-x-3"
              animate={{
                textShadow: [
                  "0 0 10px rgba(59, 130, 246, 0.3)",
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 10px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                  {translations.title[language as keyof typeof translations.title]}
                </h1>
                <p className="text-sm text-gray-400">
                  {translations.subtitle[language as keyof typeof translations.subtitle]}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">OSINT ENGINE ACTIVE</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-medium">SPIDERFOOT v4.0</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SpiderFoot Integration */}
      <motion.div
        className="relative h-[calc(100vh-80px)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Loading overlay */}
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10 transition-opacity duration-1000">
          <motion.div
            className="text-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Search className="w-full h-full text-blue-400" />
            </motion.div>
            <p className="text-blue-400 font-medium">Loading OSINT Engine...</p>
          </motion.div>
        </div>

        {/* SpiderFoot iframe */}
        <iframe
          ref={iframeRef}
          src="/osint/"
          className="w-full h-full border-0 rounded-lg"
          title="SpiderFoot OSINT Engine"
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          onLoad={() => {
            // Hide loading overlay
            const overlay = document.querySelector('.absolute.inset-0.bg-gray-900\\/90');
            if (overlay) {
              (overlay as HTMLElement).style.opacity = '0';
              setTimeout(() => {
                (overlay as HTMLElement).style.display = 'none';
              }, 1000);
            }
          }}
        />
      </motion.div>

      {/* Status Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/90 border-t border-cyan-400/20 backdrop-blur-md px-6 py-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-green-400">ENGINE: ACTIVE</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400">SCANNING: READY</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400">SECURITY: ENABLED</span>
            </div>
          </div>
          <div className="text-gray-400">
            DARKSCRAWLER OSINT Platform v2.0 | {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpiderFootIntegrated;
