import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { fadeIn, slideUp } from "@/utils/animations";
import { Globe, Moon, Sun, Shield, Bell, Key, Database, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { language, changeLanguage, timezone, changeTimezone } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"general" | "security" | "connections">("general");
  const [newTimezone, setNewTimezone] = useState(timezone || "UTC");
  const [notifications, setNotifications] = useState(true);
  const [elasticUrl, setElasticUrl] = useState("http://192.168.1.110:9200");
  const [mongoUrl, setMongoUrl] = useState("mongodb://192.168.1.110:27017/anat_security");
  const [isSaving, setIsSaving] = useState(false);

  // Translation object
  const translations = {
    settings: {
      English: "Settings",
    },
    general: {
      English: "General",
    },
    security: {
      English: "Security",
    },
    connections: {
      English: "Connections",
    },
    language: {
      English: "Language",
    },
    theme: {
      English: "Theme",
    },
    timezone: {
      English: "Timezone",
    },
    darkMode: {
      English: "Dark Mode",
    },
    lightMode: {
      English: "Light Mode",
    },
    notifications: {
      English: "Enable Notifications",
    },
    elasticsearchUrl: {
      English: "Elasticsearch URL",
    },
    mongoDbUrl: {
      English: "MongoDB URL",
    },
    save: {
      English: "Save Changes",
    },
    saving: {
      English: "Saving...",
    },
    saved: {
      English: "Settings saved successfully",
    }
  };

  const handleSave = () => {
    setIsSaving(true);

    // Simulate settings save
    setTimeout(() => {
      // Update language
      changeLanguage(language);

      // Update timezone
      changeTimezone(newTimezone);

      // Show success message
      toast({
        title: translations.saved[language as keyof typeof translations.saved],
        variant: "default"
      });

      setIsSaving(false);
    }, 1000);
  };

  return (
    <motion.div 
      className="w-full"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-8">
        <motion.h1 
          className="text-3xl font-bold text-coolWhite"
          variants={slideUp}
        >
          {translations.settings[language as keyof typeof translations.settings]}
        </motion.h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800 mb-8">
        <button
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "general" 
              ? "text-coolWhite" 
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("general")}
        >
          {translations.general[language as keyof typeof translations.general]}
          {activeTab === "general" && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimsonRed"
              layoutId="activeSettingsTab"
            />
          )}
        </button>
        <button
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "security" 
              ? "text-coolWhite" 
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("security")}
        >
          {translations.security[language as keyof typeof translations.security]}
          {activeTab === "security" && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimsonRed"
              layoutId="activeSettingsTab"
            />
          )}
        </button>
        <button
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${
            activeTab === "connections" 
              ? "text-coolWhite" 
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("connections")}
        >
          {translations.connections[language as keyof typeof translations.connections]}
          {activeTab === "connections" && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimsonRed"
              layoutId="activeSettingsTab"
            />
          )}
        </button>
      </div>

      {/* Settings Content */}
      <div className="bg-darkGray rounded-lg p-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.language[language as keyof typeof translations.language]}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => changeLanguage("English")}
                  className={`flex items-center justify-center py-2 px-4 rounded-lg ${
                    language === "English"
                      ? "bg-crimsonRed text-coolWhite"
                      : "bg-midGray text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  <span>English</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.theme[language as keyof typeof translations.theme]}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={toggleTheme}
                  className={`flex items-center justify-center py-2 px-4 rounded-lg ${
                    theme === "dark"
                      ? "bg-crimsonRed text-coolWhite"
                      : "bg-midGray text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  <span>{translations.darkMode[language as keyof typeof translations.darkMode]}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className={`flex items-center justify-center py-2 px-4 rounded-lg ${
                    theme === "light"
                      ? "bg-crimsonRed text-coolWhite"
                      : "bg-midGray text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  <span>{translations.lightMode[language as keyof typeof translations.lightMode]}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.timezone[language as keyof typeof translations.timezone]}
              </label>
              <select
                value={newTimezone}
                onChange={e => setNewTimezone(e.target.value)}
                className="w-full py-2 px-3 bg-midGray border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:ring-2 focus:ring-crimsonRed"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {translations.notifications[language as keyof typeof translations.notifications]}
                </label>
                <div
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                    notifications ? "bg-crimsonRed" : "bg-gray-600"
                  }`}
                  onClick={() => setNotifications(!notifications)}
                >
                  <div
                    className={`absolute left-1 top-1 bg-coolWhite w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                      notifications ? "transform translate-x-6" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-midGray rounded-lg flex items-start mb-6">
              <Shield className="h-6 w-6 text-crimsonRed mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-coolWhite mb-1">
                  Enhanced Security
                </h3>
                <p className="text-xs text-gray-400">
                  All connections are encrypted and secured to industry standards. Your data is protected.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connection Settings */}
        {activeTab === "connections" && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="p-4 bg-midGray rounded-lg flex items-start mb-6 border border-gray-700">
              <Database className="h-6 w-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="w-full">
                <h3 className="text-sm font-medium text-coolWhite mb-2">
                  Connection Status
                </h3>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-400">Elasticsearch</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                    Connected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">MongoDB</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.elasticsearchUrl[language as keyof typeof translations.elasticsearchUrl]}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={elasticUrl}
                  onChange={e => setElasticUrl(e.target.value)}
                  className="w-full py-2 pl-10 pr-3 bg-midGray border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:ring-2 focus:ring-crimsonRed"
                />
                <div className="absolute left-3 top-2.5">
                  <Database className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Current Elasticsearch URL used for searches
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.mongoDbUrl[language as keyof typeof translations.mongoDbUrl]}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mongoUrl}
                  onChange={e => setMongoUrl(e.target.value)}
                  className="w-full py-2 pl-10 pr-3 bg-midGray border border-gray-700 rounded-lg text-coolWhite focus:outline-none focus:ring-2 focus:ring-crimsonRed"
                />
                <div className="absolute left-3 top-2.5">
                  <Database className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Current MongoDB URL used for data storage
              </p>
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start mb-6">
              <RefreshCw className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-200">
                Changing connection URLs will require a server restart to take effect.
              </p>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <motion.button
            onClick={handleSave}
            className="px-6 py-2 bg-crimsonRed text-coolWhite rounded-lg font-medium transition-colors hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-crimsonRed focus:ring-offset-2 focus:ring-offset-darkGray disabled:bg-opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {translations.saving[language as keyof typeof translations.saving]}
              </span>
            ) : (
              translations.save[language as keyof typeof translations.save]
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;