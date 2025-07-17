import { motion } from "framer-motion";
import { Shield, Search, Database, Globe, Zap } from "lucide-react";
import BackButton from "../ui/back-button";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] to-[#10151f] text-white relative overflow-hidden">
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
      <div className="relative z-10 px-0 pt-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <BackButton color="green" />
        {/* Header Section */}
        <motion.div className="mb-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center space-x-4 mb-4">
            <motion.div className="p-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 shadow-lg" animate={{ boxShadow: ["0 0 20px rgba(34,197,94,0.3)", "0 0 40px rgba(34,197,94,0.6)", "0 0 20px rgba(34,197,94,0.3)"] }} transition={{ duration: 2, repeat: Infinity }}>
              <Zap className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500 tracking-tight">OSINT ENGINE</h1>
              <p className="text-gray-400 font-mono text-xl mt-2">Automated Open Source Intelligence Collection & Analysis</p>
            </div>
          </div>
          {/* Accent Bar / Info Section - mimic Web Security Scanning */}
          <div className="flex flex-wrap items-center gap-6 bg-gradient-to-r from-green-900/30 to-green-700/10 border border-green-700/30 rounded-xl px-6 py-3 mb-6 shadow">
            <span className="font-mono text-green-400 text-lg"><b>SCANS:</b> 12 ACTIVE</span>
            <span className="font-mono text-blue-400 text-lg"><b>ENTITIES:</b> 34 DISCOVERED</span>
            <span className="font-mono text-yellow-400 text-lg"><b>RISKS:</b> 5 FOUND</span>
          </div>
          {/* Quick OSINT Scan Section */}
          <div className="mb-8 bg-darkGray border border-green-700 rounded-lg shadow p-6 flex flex-col gap-4">
            <div className="text-lg font-bold text-green-400 mb-2">Quick OSINT Scan</div>
            <form className="flex flex-col md:flex-row gap-4 items-center">
              <input type="text" placeholder="Enter target domain, IP, email, etc..." className="flex-1 p-3 rounded bg-gray-900 border border-green-700 text-coolWhite placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded font-bold flex items-center w-fit">
                <Search className="w-4 h-4 mr-2" /> Start Scan
              </button>
            </form>
          </div>
        </motion.div>
        {/* Cards Section */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
          {osintCards.map((card, index) => (
            <motion.div key={index} className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/90 border border-green-700/30 shadow-xl backdrop-blur-sm" whileHover={{ scale: 1.05, borderColor: "rgba(34,197,94,0.5)", boxShadow: "0 10px 30px rgba(34,197,94,0.2)" }} transition={{ duration: 0.3 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
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
