/**
 * SpiderFoot Theme Injector for DARKSCRAWLER Integration
 * This script helps inject custom CSS and fix navigation issues
 */

const fs = require('fs');
const path = require('path');

const DARKSCRAWLER_CSS = `
<style id="darkscrawler-integration">
/* DARKSCRAWLER OSINT Platform - SpiderFoot Integration Theme */
/* Base theme - dark gradient background */
body {
  background: linear-gradient(135deg, #111827 0%, #000000 50%, #111827 100%) !important;
  color: #e5e7eb !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Header and navigation styling */
.navbar, .nav, .header, #header, .top-bar {
  background: rgba(17, 24, 39, 0.95) !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

/* Navigation links */
.nav-link, .navbar-nav .nav-link, a {
  color: #60a5fa !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  text-decoration: none !important;
}

.nav-link:hover, .navbar-nav .nav-link:hover, a:hover {
  color: #3b82f6 !important;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
}

/* SpiderFoot branding integration */
.navbar-brand, .logo, h1 {
  color: #3b82f6 !important;
  font-weight: 900 !important;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
}

/* Content containers */
.container, .container-fluid, .main-content, .content {
  background: transparent !important;
  color: #e5e7eb !important;
  padding: 20px !important;
}

/* Cards and panels */
.card, .panel, .well, .box, .info-box {
  background: rgba(17, 24, 39, 0.8) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  margin-bottom: 20px !important;
}

.card-header, .panel-heading, .box-header {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
  font-weight: 700 !important;
  padding: 15px 20px !important;
}

/* Form elements */
.form-control, input, select, textarea {
  background: rgba(31, 41, 55, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  font-family: 'JetBrains Mono', monospace !important;
  padding: 12px 16px !important;
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
  background: rgba(17, 24, 39, 0.8) !important;
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
  background: rgba(17, 24, 39, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  padding: 15px 20px !important;
}

.alert-info { border-color: rgba(59, 130, 246, 0.5) !important; }
.alert-success { border-color: rgba(16, 185, 129, 0.5) !important; }
.alert-warning { border-color: rgba(245, 158, 11, 0.5) !important; }
.alert-danger { border-color: rgba(239, 68, 68, 0.5) !important; }

/* Sidebar styling */
.sidebar, .nav-sidebar {
  background: rgba(17, 24, 39, 0.95) !important;
  border-right: 2px solid rgba(59, 130, 246, 0.2) !important;
}

/* Footer */
.footer, footer {
  background: rgba(17, 24, 39, 0.95) !important;
  border-top: 2px solid rgba(59, 130, 246, 0.2) !important;
  color: #9ca3af !important;
  padding: 20px !important;
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

/* Custom DARKSCRAWLER header */
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

/* Adjust body padding for custom header */
body {
  padding-top: 35px !important;
}

/* Fix navigation issues - ensure all links work properly */
a[href^="/"] {
  position: relative;
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

/* Ensure iframe content is visible */
html, body {
  height: auto !important;
  min-height: 100vh !important;
}

/* Fix z-index issues */
.modal, .popup {
  z-index: 10001 !important;
}

/* Animation for smooth transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}
</style>
`;

function injectThemeIntoSpiderFoot(spiderFootDir) {
  try {
    const templatesDir = path.join(spiderFootDir, 'spiderfoot', 'www', 'templates');
    const staticDir = path.join(spiderFootDir, 'spiderfoot', 'www', 'static');
    
    // Check if templates directory exists
    if (fs.existsSync(templatesDir)) {
      console.log('📁 Found SpiderFoot templates directory:', templatesDir);
      
      // Look for base template files
      const templateFiles = fs.readdirSync(templatesDir).filter(file => 
        file.endsWith('.html') || file.endsWith('.tmpl')
      );
      
      templateFiles.forEach(file => {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if our theme is already injected
        if (!content.includes('darkscrawler-integration')) {
          console.log(`🎨 Injecting DARKSCRAWLER theme into ${file}`);
          
          // Inject our CSS into the head section
          const modifiedContent = content.replace(
            /<\/head>/i,
            `${DARKSCRAWLER_CSS}\n</head>`
          );
          
          // Backup original file
          fs.writeFileSync(`${filePath}.backup`, content);
          
          // Write modified content
          fs.writeFileSync(filePath, modifiedContent);
          
          console.log(`✅ Theme injected into ${file}`);
        } else {
          console.log(`✅ Theme already present in ${file}`);
        }
      });
    }
    
    // Create custom CSS file in static directory
    if (fs.existsSync(staticDir)) {
      const customCssPath = path.join(staticDir, 'darkscrawler-theme.css');
      fs.writeFileSync(customCssPath, DARKSCRAWLER_CSS.replace(/<\/?style[^>]*>/g, ''));
      console.log('✅ Created standalone CSS file:', customCssPath);
    }
    
    console.log('🎉 DARKSCRAWLER theme injection completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to inject theme:', error.message);
  }
}

module.exports = {
  injectThemeIntoSpiderFoot,
  DARKSCRAWLER_CSS
};

// If run directly
if (require.main === module) {
  const spiderFootDir = process.argv[2] || path.resolve(__dirname, '..', 'spiderfoot-4.0');
  console.log('🕷️ DARKSCRAWLER SpiderFoot Theme Injector');
  console.log(`📂 Target directory: ${spiderFootDir}`);
  injectThemeIntoSpiderFoot(spiderFootDir);
}
