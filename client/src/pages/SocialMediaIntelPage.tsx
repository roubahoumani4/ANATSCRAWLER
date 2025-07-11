import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Share2, Twitter, Facebook, Linkedin, Globe2, Settings2 } from "lucide-react";

// Placeholder for Maigrait setup
const MaigraitSetup = () => (
  <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-100 dark:from-blue-900 dark:via-purple-900 dark:to-blue-900 border border-blue-400/30 rounded-xl p-6 mb-8 shadow-lg">
    <h2 className="text-xl font-bold text-blue-500 mb-2">Maigrait Integration</h2>
    <p className="text-gray-700 dark:text-gray-300 mb-2">Maigrait setup and integration will be available here. Configure your social media intelligence workflows and connect Maigrait for advanced analysis.</p>
    <div className="flex items-center space-x-4 mt-4">
      <Settings2 className="w-6 h-6 text-purple-400" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Integration status: <span className="font-bold text-green-500">Pending</span></span>
    </div>
  </div>
);

const SocialMediaIntelPage = () => {
  useEffect(() => {
    document.title = "Social Media Intel | OSINT Framework";
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4">
      {/* OSINT Framework Dependency Notice */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <Globe2 className="w-6 h-6 text-green-400" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">This section is part of the <Link to="/osint-framework" className="text-blue-500 underline">OSINT Framework</Link></span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Social Media Intel tools and analysis are dependent on the OSINT Framework. Please configure your framework settings before proceeding.</p>
      </div>

      {/* Professional, Unique Design */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center mb-6 space-x-4">
          <UserPlus className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Social Media Intelligence</h1>
        </div>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">Leverage advanced OSINT tools to analyze, monitor, and report on social media activity across multiple platforms. Integrate Maigrait for automated intelligence gathering and reporting.</p>
        <div className="flex space-x-6 mt-6">
          <Twitter className="w-7 h-7 text-sky-400" />
          <Facebook className="w-7 h-7 text-blue-600" />
          <Linkedin className="w-7 h-7 text-blue-700" />
          <Share2 className="w-7 h-7 text-purple-400" />
        </div>
      </div>

      {/* Maigrait Setup Section */}
      <MaigraitSetup />

      {/* No mock data, only placeholders for future integration */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border border-purple-400/20 rounded-xl p-6 shadow">
        <h3 className="text-lg font-bold text-purple-500 mb-2">Coming Soon</h3>
        <p className="text-gray-600 dark:text-gray-300">Social media search, analytics, and Maigrait state integration will be available in future updates. Stay tuned for powerful OSINT capabilities tailored for social platforms.</p>
      </div>
    </div>
  );
};

export default SocialMediaIntelPage;
