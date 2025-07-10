import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import moment from "moment-timezone";

type Language = "English";

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => void;
  timezone: string;
  changeTimezone: (tz: string) => void;
  deleteTimezone: () => void;
  formatDate: (date: Date | string | number) => string;
  translate: (key: string) => string;
}

// Simple English-only translations
const translations: Record<string, string> = {
  // Dashboard
  "dashboard.title": "Dark Web Credential Search",
  "dashboard.search": "Search",
  "dashboard.searching": "Searching...",
  "dashboard.exportExcel": "Export to Excel",
  "dashboard.downloadExcel": "Download Excel",
  "dashboard.searchPlaceholder": "Enter search terms...",
  "dashboard.noResults": "No results found",
  "dashboard.results": "Results",
  "dashboard.overview": "Overview",
  "dashboard.darkweb": "Darkweb Monitoring",
  "dashboard.threatintel": "Threat Intelligence",
  
  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.osint": "OSINT Framework",
  "nav.darkweb": "Darkweb Monitoring",
  "nav.malware": "Malware Analysis",
  "nav.websecurity": "Web Security Scanning",
  "nav.users": "Users",
  "nav.settings": "Settings",
  
  // OSINT Framework
  "osint.title": "OSINT Framework",
  "osint.description": "Open Source Intelligence gathering and analysis tools",
  "osint.searchDomains": "Search Domains",
  "osint.peopleSearch": "People Search",
  "osint.emailAnalysis": "Email Analysis",
  "osint.socialMedia": "Social Media Intel",
  "osint.backButton": "Back to Dashboard",
  
  // Darkweb Monitoring
  "darkweb.title": "Darkweb Monitoring",
  "darkweb.description": "Monitor dark web activities and threat intelligence",
  "darkweb.crawlers": "CRAWLERS",
  "darkweb.sources": "SOURCES",
  "darkweb.alerts": "ALERTS",
  "darkweb.searchPlaceholder": "Search dark web intelligence...",
  "darkweb.backButton": "Back to Dashboard",
  
  // Malware Analysis
  "malware.title": "Malware Analysis",
  "malware.description": "Advanced malware detection and analysis capabilities",
  "malware.fileAnalysis": "File Analysis",
  "malware.behaviorAnalysis": "Behavior Analysis",
  "malware.threatIntel": "Threat Intelligence",
  "malware.sandboxAnalysis": "Sandbox Analysis",
  "malware.backButton": "Back to Dashboard",
  
  // Web Security Scanning
  "websecurity.title": "Web Security Scanning",
  "websecurity.description": "Comprehensive web application security assessment",
  "websecurity.vulnScanning": "Vulnerability Scanning",
  "websecurity.portScanner": "Port Scanner",
  "websecurity.sslAnalysis": "SSL/TLS Analysis",
  "websecurity.webCrawler": "Web Crawler",
  "websecurity.backButton": "Back to Dashboard",
  
  // Settings
  "settings.general": "General Settings",
  "settings.preferences": "Preferences",
  "settings.language": "Language",
  "settings.timezone": "Timezone",
  "settings.notifications": "Notifications",
  "settings.save": "Save Changes",
  "settings.cancel": "Cancel",
  
  // Dashboard Stats
  "dashboard.totalSearches": "Total Searches",
  "dashboard.resultsFound": "Results Found",
  "dashboard.collectionsAnalyzed": "Collections Analyzed",
  "dashboard.threatsDetected": "Threats Detected",
  
  // Common UI Elements
  "common.active": "ACTIVE",
  "common.running": "RUNNING",
  "common.encrypted": "ENCRYPTED",
  "common.monitored": "MONITORED",
  "common.pending": "PENDING",
  "common.found": "FOUND",
  "common.queued": "QUEUED",
  "common.operational": "OPERATIONAL",
  "common.updated": "UPDATED",
  "common.secure": "SECURE",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.success": "Success",
  "common.warning": "Warning",
  "common.info": "Information",
  "common.close": "Close",
  "common.submit": "Submit",
  "common.reset": "Reset",
  "common.confirm": "Confirm",
  "common.yes": "Yes",
  "common.no": "No",

  // Users Page
  "users.title": "Users",
  "users.newUser": "New User",
  "users.filter": "Filter users...",
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language] = useState<Language>("English");
  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem("timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  useEffect(() => {
    localStorage.setItem("timezone", timezone);
  }, [timezone]);

  const changeLanguage = (lang: Language) => {
    // Language is fixed to English, so this does nothing
  };

  const changeTimezone = (tz: string) => {
    setTimezone(tz);
  };

  const deleteTimezone = () => {
    localStorage.removeItem("timezone");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  const formatDate = (date: Date | string | number) => {
    return moment.tz(date, timezone).format("MMM DD, YYYY HH:mm:ss");
  };

  const translate = (key: string) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        timezone,
        changeTimezone,
        deleteTimezone,
        formatDate,
        translate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}