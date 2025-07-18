import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  color?: "purple" | "green" | "red" | "cyan" | "orange" | "grey" | "blue";
}

const BackButton = ({ to = "/dashboard", color = "blue" }: BackButtonProps) => {
  const [, setLocation] = useLocation();

  const colorStyles: Record<string, string> = {
    purple: "text-purple-400 hover:text-purple-300 border-purple-400/20 hover:border-purple-400/40",
    green: "text-green-400 hover:text-green-300 border-green-400/20 hover:border-green-400/40",
    red: "text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40",
    cyan: "text-cyan-400 hover:text-cyan-300 border-cyan-400/20 hover:border-cyan-400/40",
    orange: "text-orange-400 hover:text-orange-300 border-orange-400/20 hover:border-orange-400/40",
    grey: "text-gray-300 hover:text-white border-gray-500/20 hover:border-gray-400/40",
    blue: "text-blue-400 hover:text-blue-300 border-blue-400/20 hover:border-blue-400/40 bg-blue-900/60 hover:bg-blue-800/80"
  };

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <button
        onClick={() => setLocation(to)}
        className={`flex items-center space-x-2 transition-colors duration-200 px-5 py-2 rounded-lg border-none shadow font-bold text-lg ${colorStyles[color] || colorStyles.blue}`}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>
    </motion.div>
  );
};

export default BackButton;
