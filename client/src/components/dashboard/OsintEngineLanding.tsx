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
  return (
    <div className="min-h-screen bg-darkGray text-white relative">
      <div className="relative z-10 p-8">
        {/* Back Button */}
        <BackButton color="cyan" />
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center space-x-4 mb-6">
            <motion.div className="p-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700" animate={{ boxShadow: ["0 0 20px rgba(6, 182, 212, 0.3)", "0 0 40px rgba(6, 182, 212, 0.6)", "0 0 20px rgba(6, 182, 212, 0.3)"] }} transition={{ duration: 2, repeat: Infinity }}>
              <Zap className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">OSINT ENGINE</h1>
              <p className="text-gray-400 font-mono text-lg">Automated Open Source Intelligence Collection & Analysis</p>
            </div>
          </div>
        </motion.div>
        {/* Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
          {osintCards.map((card, index) => (
            <motion.div key={index} className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/80 border border-gray-700/50 backdrop-blur-sm" whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)", boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)" }} transition={{ duration: 0.3 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
              <motion.div className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${card.color} inline-block`} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
                {card.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm mb-2">{card.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default OsintEngineLanding;
