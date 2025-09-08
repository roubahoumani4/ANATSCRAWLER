import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  color?: "blue" | "green" | "red" | "purple" | "orange";
}

const BackButton = ({ to = "/dashboard", color = "blue" }: BackButtonProps) => {
  const navigate = useNavigate();

  const colorStyles: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    orange: "bg-orange-600 hover:bg-orange-700 text-white"
  };

  const handleClick = () => {
    navigate(to);
  };

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <button
        onClick={handleClick}
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
