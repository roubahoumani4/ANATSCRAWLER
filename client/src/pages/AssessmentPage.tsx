import React from 'react';
import { Zap } from 'lucide-react';

const AssessmentPage: React.FC = () => {
  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 rounded bg-emerald-700/10 text-emerald-400">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Assessment</h1>
            <p className="text-sm text-gray-400">Run and review assessments for targets and assets.</p>
          </div>
        </div>

        <div className="mt-6 bg-gray-850 rounded-lg p-6 border border-gray-800">
          <p className="text-sm text-gray-300">This is a placeholder for the Assessment workflow. You can add scans, configure modules, and review results here.</p>

          <div className="mt-4 text-sm text-gray-400">
            <ul className="list-disc pl-5 space-y-2">
              <li>Start a new assessment for a domain or IP.</li>
              <li>Pick modules and configure scan options.</li>
              <li>View and export results.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
