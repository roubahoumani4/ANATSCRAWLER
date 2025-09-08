import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp } from 'lucide-react';

const ThreatIntelligencePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-jetBlack text-coolWhite p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <TrendingUp className="w-10 h-10 mr-3 text-crimsonRed" />
          <h1 className="text-4xl font-bold">Threat Intelligence</h1>
        </div>
        
        <div className="bg-darkGray rounded-xl p-8 border border-coolWhite/10">
          <div className="text-center">
            <Shield className="w-16 h-16 text-crimsonRed mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Threat Intelligence Platform</h2>
            <p className="text-gray-400 mb-6">
              Comprehensive threat intelligence gathering, analysis, and correlation platform.
            </p>
            <div className="text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
              <p>This feature is under development and will be available soon.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ThreatIntelligencePage;
