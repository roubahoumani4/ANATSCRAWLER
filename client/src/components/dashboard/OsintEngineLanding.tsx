import { motion } from "framer-motion";
import { Shield, Search, Database, Globe, Zap, Plus, List } from "lucide-react";
import BackButton from "../ui/back-button";
import { useNavigate } from "react-router-dom";

const osintCards = [
  {
    title: "Entity Discovery",
    description: "Identify domains, IPs, emails, usernames, and other entities related to your target using advanced open-source intelligence techniques.",
    icon: <Search className="w-8 h-8" />, color: "from-blue-500 to-indigo-600"
  },
  {
    title: "Relationship Mapping",
    description: "Visualize connections between discovered entities, revealing hidden links and potential risks in your digital footprint.",
    icon: <Globe className="w-8 h-8" />, color: "from-indigo-500 to-purple-600"
  },
  {
    title: "Risk & Threat Analysis",
    description: "Analyze and correlate findings to highlight high-risk exposures, suspicious activity, and actionable intelligence.",
    icon: <Shield className="w-8 h-8" />, color: "from-cyan-500 to-blue-600"
  },
  {
    title: "Comprehensive Reporting",
    description: "Generate detailed, professional reports with summaries, graphs, and evidence for further investigation or compliance.",
    icon: <Database className="w-8 h-8" />, color: "from-purple-500 to-pink-600"
  }
];

const OsintEngineLanding = () => {
  // Animated background letters/numbers
  const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full fixed inset-0 bg-[#0a0f1c] text-white overflow-auto">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute font-mono text-xs select-none"
            style={{ left: `${(i * 8) + 5}%`, top: `-5%` }}
            animate={{ y: ["0vh", "100vh"] }}
            transition={{ duration: Math.random() * 6 + 8, repeat: Infinity, delay: Math.random() * 3, ease: "linear" }}
          >
            {matrixChars.slice(0, 10).map((_, idx) => (
              <div key={idx} className="mb-1" style={{ color: '#22c55e' }}>{matrixChars[Math.floor(Math.random() * matrixChars.length)]}</div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className="relative z-10 pt-8 w-full px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton color="green" className="!static" />
        </div>
        {/* Header Section */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 shadow-lg flex items-center justify-center">
              <Zap className="w-12 h-12 text-white" style={{ filter: 'brightness(1.3)' }} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-green-400">
                OSINT ENGINE
              </h1>
              <p className="text-gray-400 font-mono text-lg">
                Automated Open Source Intelligence Collection & Analysis
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scan Animation Section */}
        <motion.div className="flex flex-col items-center mb-10" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
          {/* Spiderfoot-style scan map animation */}
          <div className="relative w-full max-w-2xl h-64 mb-6">
            {/* Central Target Node */}
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-700 rounded-full w-20 h-20 flex items-center justify-center shadow-lg border-4 border-green-500">
              <Search className="w-10 h-10 text-white" />
            </motion.div>
            {/* Outward Nodes and Animated Lines */}
            {[
              { icon: <Globe className="w-7 h-7 text-blue-400" />, label: "Domains", x: '70%', y: '20%' },
              { icon: <Database className="w-7 h-7 text-purple-400" />, label: "Data", x: '80%', y: '70%' },
              { icon: <Shield className="w-7 h-7 text-cyan-400" />, label: "Threats", x: '20%', y: '70%' },
              { icon: <Zap className="w-7 h-7 text-yellow-400" />, label: "Activity", x: '15%', y: '25%' },
            ].map((node, idx) => (
              <motion.div key={idx} className="absolute flex flex-col items-center" style={{ left: node.x, top: node.y }}
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: [1, 1.1, 1] }} transition={{ delay: 0.5 + idx * 0.2, duration: 1.2, repeat: Infinity }}>
                <div className="bg-[#10151f] border border-green-700/40 rounded-full p-3 shadow-lg mb-1">
                  {node.icon}
                </div>
                <span className="text-xs text-gray-400 font-mono">{node.label}</span>
              </motion.div>
            ))}
            {/* Animated lines (SVG) */}
            <svg className="absolute left-0 top-0 w-full h-full pointer-events-none" width="100%" height="100%">
              <motion.line x1="50%" y1="50%" x2="70%" y2="20%" stroke="#22c55e" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }} />
              <motion.line x1="50%" y1="50%" x2="80%" y2="70%" stroke="#a78bfa" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.2 }} />
              <motion.line x1="50%" y1="50%" x2="20%" y2="70%" stroke="#22d3ee" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.4 }} />
              <motion.line x1="50%" y1="50%" x2="15%" y2="25%" stroke="#fde047" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.6 }} />
            </svg>
          </div>
          {/* Animation Caption */}
          <div className="text-gray-400 font-mono text-sm mb-4">Visualizing OSINT scan: discovering domains, data, threats, and activity...</div>
          {/* Action Buttons */}
          <div className="flex gap-6 mt-2">
            <button
              onClick={() => navigate('/osint/new')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-lg shadow-lg hover:from-green-500 hover:to-green-400 transition-all"
            >
              <Plus className="w-5 h-5" />
              Start New OSINT Scan
            </button>
            <button
              onClick={() => navigate('/osint/scans')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-green-400 font-bold text-lg shadow-lg border border-green-700 hover:bg-gray-600 transition-all"
            >
              <List className="w-5 h-5" />
              View All Scans
            </button>
          </div>
        </motion.div>
        {/* Cards Section */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
          {osintCards.map((card, index) => (
            <motion.div key={index} className="relative p-8 rounded-2xl bg-[#10151f] border border-green-700/30 shadow-xl" whileHover={{ scale: 1.05, borderColor: 'rgba(34,197,94,0.5)', boxShadow: '0 10px 30px rgba(34,197,94,0.2)' }} transition={{ duration: 0.3 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
              <motion.div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${card.color} inline-block shadow-lg`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
                {card.icon}
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-base mb-2">{card.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default OsintEngineLanding;
