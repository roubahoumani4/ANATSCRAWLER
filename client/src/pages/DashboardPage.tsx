import { motion } from "framer-motion";
import { pageVariants } from "@/utils/animations";
import EnhancedDashboard from "@/components/dashboard/EnhancedDashboard";

const DashboardPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
    >
      <EnhancedDashboard />
    </motion.div>
  );
};

export default DashboardPage;