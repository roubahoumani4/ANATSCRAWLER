import { motion } from "framer-motion";

const MatrixBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
      {/* Matrix rain effect */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-blue-400 font-mono text-xs opacity-10 select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
          }}
          animate={{
            y: ["0vh", "110vh"],
          }}
          transition={{
            duration: Math.random() * 6 + 8,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "linear"
          }}
        >
          {Array.from({ length: 15 }, (_, idx) => (
            <div key={idx} className="mb-1">
              {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export default MatrixBackground;
