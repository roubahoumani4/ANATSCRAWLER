import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <motion.div 
      className="feature-card p-4 border border-coolWhite rounded-md hover:border-crimsonRed transition-colors"
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="feature-icon mb-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <i className={`fas fa-${icon} text-3xl text-crimsonRed`}></i>
      </motion.div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
