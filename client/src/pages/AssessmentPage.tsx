import React from 'react';
import { Zap } from 'lucide-react';

const AssessmentPage = () => {
  return (
    <div className="min-h-screen p-6 bg-jetBlack text-coolWhite">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center space-x-4 mb-6">
          <Zap className="text-emerald-400" size={28} />
          <div>
            <h1 className="text-2xl font-semibold">Assessment</h1>
            <p className="text-sm text-gray-400">Run and review assessments across targets.</p>
          </div>
        </header>

        <section className="bg-cardBg rounded-lg p-4 border border-gray-800">
          <p className="text-gray-300">This is the placeholder for the Assessment page. Add assessment tools, scan summaries, and controls here.</p>
        </section>
      </div>
    </div>
  );
};

export default AssessmentPage;
