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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          console.log('✅ SpiderFoot iframe loaded successfully');
          
          // Enhanced JavaScript fixes for SpiderFoot integration
          const enhancedFix = iframeDoc.createElement('script');
          enhancedFix.textContent = `
            // Fix for 'sf is not defined' error
            if (typeof window.sf === 'undefined') {
              window.sf = {
                replace_sfurltag: function(data) {
                  return data;
                },
                replace_sfurl: function(data) {
                  return data;
                }
              };
            }
            
            // Enhanced navigation fixes with active state handling
            function fixNavigation() {
              const links = document.querySelectorAll('a[href^="/"], .nav-link');
              links.forEach(link => {
                // Fix href if needed
                if (link.hasAttribute('href')) {
                  let href = link.getAttribute('href');
                  if (href && href.startsWith('/') && !href.startsWith('/osint')) {
                    link.setAttribute('href', '/osint' + href);
                  }
                }
                
                // Handle click for active state
                link.addEventListener('click', function(e) {
                  document.querySelectorAll('.nav-link.active').forEach(l => l.classList.remove('active'));
                  this.classList.add('active');
                });
              });
              
              // Fix form actions
              const forms = document.querySelectorAll('form');
              forms.forEach(form => {
                let action = form.getAttribute('action');
                if (action && action.startsWith('/') && !action.startsWith('/osint')) {
                  form.setAttribute('action', '/osint' + action);
                }
              });
              
              // Fix any JS-based navigation
              if (window.location.pathname && !window.location.pathname.startsWith('/osint')) {
                history.replaceState(null, '', '/osint' + window.location.pathname);
              }
            }
            
            // Remove unnecessary elements
            function cleanupUI() {
              const unwantedSelectors = [
                'a[href*="twitter"]',
                'a[href*="discord"]', 
                'a[href*="youtube"]',
                'a[href*="github"]',
                'a[href*="spiderfoot.net"]',
                'a[href*="support@spiderfoot"]',
                'footer',
                '.footer',
                '.copyright',
                '.powered-by'
              ];
              
              unwantedSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.remove());
              });
            }
            
            // Apply fixes when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                fixNavigation();
                cleanupUI();
              });
            } else {
              fixNavigation();
              cleanupUI();
            }
            
            // Mutation observer for dynamic content
            const observer = new MutationObserver(() => {
              fixNavigation();
              cleanupUI();
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Re-apply periodically as fallback
            setInterval(() => {
              fixNavigation();
              cleanupUI();
            }, 1000);
          `;
          
          iframeDoc.head.appendChild(enhancedFix);

          // Inject ANAT Security theme CSS
          const anatStyle = iframeDoc.createElement('style');
          anatStyle.textContent = `
            /* ANAT Security OSINT Platform - SpiderFoot Integration */
            * {
              box-sizing: border-box !important;
            }

            html, body {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
              color: #e2e8f0 !important;
              font-family: 'Inter', system-ui, sans-serif !important;
              height: auto !important;
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow-x: hidden !important;
            }

            /* Hide only specific unwanted elements, not all navigation */
            a[href*="twitter"], a[href*="discord"], a[href*="youtube"],
            a[href*="github"], a[href*="spiderfoot.net"], a[href*="support@spiderfoot"],
            footer .navbar-default, .footer .navbar-default {
              display: none !important;
            }

            /* Keep navigation functional but styled */
            .navbar-nav {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              gap: 15px !important;
            }

            .navbar-nav .nav-link {
              color: #60a5fa !important;
              font-weight: 600 !important;
              text-decoration: none !important;
              padding: 10px 16px !important;
              border-radius: 8px !important;
              transition: all 0.3s ease !important;
              background: rgba(59, 130, 246, 0.1) !important;
              border: 1px solid rgba(59, 130, 246, 0.2) !important;
              cursor: pointer !important;
            }

            .navbar-nav .nav-link:hover {
              color: #ffffff !important;
              background: rgba(59, 130, 246, 0.3) !important;
              border-color: #3b82f6 !important;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.4) !important;
              transform: translateY(-2px) !important;
            }

            .navbar-nav .nav-link.active {
              background: rgba(59, 130, 246, 0.4) !important;
              color: #ffffff !important;
              border-color: #3b82f6 !important;
            }

            /* Header styling */
            .navbar, .nav, .header, #header {
              background: rgba(15, 23, 42, 0.95) !important;
              border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
              backdrop-filter: blur(10px) !important;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
              padding: 15px 20px !important;
            }

            /* Main content styling */
            .container, .container-fluid, .main-content, .content {
              background: transparent !important;
              color: #e2e8f0 !important;
              padding: 20px !important;
            }

            /* Cards and panels */
            .card, .panel, .well, .box, .info-box {
              background: rgba(15, 23, 42, 0.8) !important;
              border: 2px solid rgba(59, 130, 246, 0.2) !important;
              border-radius: 16px !important;
              backdrop-filter: blur(10px) !important;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
              margin-bottom: 20px !important;
              color: #e2e8f0 !important;
            }

            .card-header, .panel-heading, .box-header {
              background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
              border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
              color: #60a5fa !important;
              font-weight: 700 !important;
              padding: 15px 20px !important;
              border-radius: 14px 14px 0 0 !important;
            }

            /* Form elements */
            .form-control, input, select, textarea {
              background: rgba(31, 41, 55, 0.9) !important;
              border: 2px solid rgba(59, 130, 246, 0.2) !important;
              border-radius: 12px !important;
              color: #e5e7eb !important;
              font-family: 'JetBrains Mono', monospace !important;
              padding: 12px 16px !important;
              transition: all 0.3s ease !important;
            }

            .form-control:focus, input:focus, select:focus, textarea:focus {
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
              background: rgba(31, 41, 55, 1) !important;
              outline: none !important;
            }

            /* Buttons */
            .btn, button, input[type="submit"], input[type="button"] {
              background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
              border: 2px solid rgba(59, 130, 246, 0.5) !important;
              border-radius: 12px !important;
              color: white !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              letter-spacing: 1px !important;
              transition: all 0.3s ease !important;
              padding: 12px 24px !important;
              cursor: pointer !important;
              box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
            }

            .btn:hover, button:hover, input[type="submit"]:hover, input[type="button"]:hover {
              background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
              border-color: #3b82f6 !important;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
              transform: translateY(-2px) !important;
              color: white !important;
            }

            /* Tables */
            .table, table {
              background: rgba(15, 23, 42, 0.8) !important;
              color: #e5e7eb !important;
              border-radius: 12px !important;
              overflow: hidden !important;
              border: 1px solid rgba(59, 130, 246, 0.2) !important;
            }

            .table th, table th, thead th {
              background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3)) !important;
              color: #60a5fa !important;
              font-weight: 700 !important;
              border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
              padding: 15px !important;
            }

            .table td, table td, tbody td {
              border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
              color: #d1d5db !important;
              padding: 12px 15px !important;
            }

            .table-striped tbody tr:nth-of-type(odd), tr:nth-child(odd) {
              background: rgba(31, 41, 55, 0.4) !important;
            }

            /* Progress bars */
            .progress {
              background: rgba(31, 41, 55, 0.6) !important;
              border-radius: 8px !important;
              overflow: hidden !important;
              height: 20px !important;
            }

            .progress-bar {
              background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
            }

            /* Alerts and messages */
            .alert {
              background: rgba(15, 23, 42, 0.9) !important;
              border: 2px solid rgba(59, 130, 246, 0.3) !important;
              border-radius: 12px !important;
              color: #e5e7eb !important;
              padding: 15px 20px !important;
            }

            .alert-info { border-color: rgba(59, 130, 246, 0.5) !important; }
            .alert-success { border-color: rgba(16, 185, 129, 0.5) !important; }
            .alert-warning { border-color: rgba(245, 158, 11, 0.5) !important; }
            .alert-danger { border-color: rgba(239, 68, 68, 0.5) !important; }

            /* Dropdown menus */
            .dropdown-menu {
              background: rgba(15, 23, 42, 0.95) !important;
              border: 2px solid rgba(59, 130, 246, 0.2) !important;
              border-radius: 12px !important;
              backdrop-filter: blur(10px) !important;
            }

            .dropdown-item {
              color: #e5e7eb !important;
              transition: all 0.3s ease !important;
              padding: 10px 15px !important;
            }

            .dropdown-item:hover {
              background: rgba(59, 130, 246, 0.2) !important;
              color: #60a5fa !important;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar {
              width: 12px !important;
            }

            ::-webkit-scrollbar-track {
              background: rgba(31, 41, 55, 0.5) !important;
            }

            ::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, #3b82f6, #6366f1) !important;
              border-radius: 6px !important;
            }

            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, #2563eb, #4f46e5) !important;
            }

            /* Custom ANAT Security header */
            body::before {
              content: "🕷️ ANAT SECURITY OSINT ENGINE - SPIDERFOOT INTEGRATION";
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

            /* Adjust body padding for custom header */
            body {
              padding-top: 35px !important;
            }

            /* Fix navigation issues - ensure links work */
            a[href^="/"] {
              position: relative;
              z-index: 1;
              text-decoration: none !important;
            }

            /* Ensure text is readable */
            h1, h2, h3, h4, h5, h6 {
              color: #ffffff !important;
              font-weight: 700 !important;
            }

            p, span, div {
              color: #e2e8f0 !important;
            }

            /* Loading states */
            .loading {
              background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1)) !important;
              animation: pulse 2s infinite;
            }

            @keyframes pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }

            /* Responsive improvements */
            @media (max-width: 768px) {
              .container, .container-fluid {
                padding: 10px !important;
              }
              
              .card, .panel, .well, .box {
                margin-bottom: 15px !important;
              }
              
              .btn, button {
                padding: 10px 20px !important;
                font-size: 14px !important;
              }
            }

            /* Fix z-index issues */
            .modal, .popup {
              z-index: 10001 !important;
            }

            /* Animation for smooth transitions */
            * {
              transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
            }

            /* Ensure iframe content is visible */
            iframe {
              background: transparent !important;
            }

            /* Fix modal and popup visibility */
            .modal-content {
              background: rgba(15, 23, 42, 0.95) !important;
              border: 2px solid rgba(59, 130, 246, 0.3) !important;
              border-radius: 16px !important;
              color: #e2e8f0 !important;
            }

            .modal-header {
              background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
              border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
              color: #60a5fa !important;
            }

            .modal-body {
              color: #e2e8f0 !important;
            }

            .modal-footer {
              border-top: 1px solid rgba(59, 130, 246, 0.3) !important;
            }
          `;
          iframeDoc.head.appendChild(anatStyle);
          console.log('✅ Enhanced fixes applied to SpiderFoot interface');
        }
      } catch (error) {
        console.warn('⚠️ Could not apply enhanced fixes to SpiderFoot iframe:', error);
        // This is expected due to CORS restrictions - the server-side theming will handle it
      }
    };

    // Try to apply fixes when iframe loads
    iframe.addEventListener('load', handleIframeLoad);

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
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
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-top-navigation"
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
            ANATSCRAWLER OSINT Platform v2.0 | {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpiderFootIntegrated;
