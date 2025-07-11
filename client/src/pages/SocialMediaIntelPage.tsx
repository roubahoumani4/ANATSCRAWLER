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
    document.title = "Social Media Intel | Maigrait";
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-black py-12 px-4 flex flex-col items-center justify-start">
      <div className="max-w-3xl w-full">
        {/* Page Header */}
        <div className="flex items-center mb-10 space-x-4">
          <UserPlus className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Social Media Intelligence</h1>
        </div>

        {/* Maigrait Setup Section */}
        <MaigraitSetup />

        {/* Maigrait Integration Panel */}
        <div className="bg-black/70 border border-blue-900 rounded-xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">Maigrait Intelligence Engine</h2>
          <p className="text-gray-300 mb-4">Integrate Maigrait to automate social media data collection, analysis, and reporting. Configure your Maigrait API keys, select platforms, and set up intelligence workflows.</p>
          <div className="flex space-x-6 mt-6">
            <Twitter className="w-8 h-8 text-sky-400" />
            <Facebook className="w-8 h-8 text-blue-600" />
            <Linkedin className="w-8 h-8 text-blue-700" />
            <Share2 className="w-8 h-8 text-purple-400" />
          </div>
          <div className="mt-8">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition">Connect Maigrait</button>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700 rounded-xl p-6 shadow text-center">
          <h3 className="text-xl font-bold text-purple-400 mb-2">Coming Soon</h3>
          <p className="text-gray-300">Advanced social media search, analytics, and Maigrait state integration will be available in future updates. Stay tuned for powerful OSINT capabilities tailored for social platforms.</p>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaIntelPage;
