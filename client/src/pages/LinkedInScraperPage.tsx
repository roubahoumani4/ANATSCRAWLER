import React from 'react';
import { Linkedin } from 'lucide-react';

const LinkedInScraperPage: React.FC = () => {
  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Linkedin size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-coolWhite">LinkedIn Scraper</h1>
              <p className="text-gray-400 mt-1">Extract and analyze LinkedIn profiles and company data</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-8">
          <div className="text-center py-12">
            <Linkedin size={64} className="mx-auto mb-4 text-blue-400 opacity-50" />
            <h2 className="text-xl font-semibold mb-2 text-gray-300">LinkedIn Scraper Module</h2>
            <p className="text-gray-500">This page is under construction. Features will be added soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInScraperPage;
