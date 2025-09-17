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
            
            // Enhanced navigation fixes
            function fixNavigation() {
              const links = document.querySelectorAll('a[href^="/"]');
              links.forEach(link => {
                if (!link.href.includes('/osint/')) {
                  const originalHref = link.getAttribute('href');
                  if (originalHref && !originalHref.startsWith('/osint')) {
                    link.setAttribute('href', '/osint' + originalHref);
                  }
                }
              });
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
            
            // Re-apply fixes periodically for dynamic content
            setInterval(function() {
              fixNavigation();
              cleanupUI();
            }, 2000);
          `;
          
          iframeDoc.head.appendChild(enhancedFix);
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
            DARKSCRAWLER OSINT Platform v2.0 | {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpiderFootIntegrated;
