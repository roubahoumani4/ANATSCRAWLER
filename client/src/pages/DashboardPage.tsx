import { motion } from "framer-motion";
import { pageVariants } from "@/utils/animations";
import SimpleDashboard from "@/components/dashboard/SimpleDashboard";

const DashboardPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
    >
      <SimpleDashboard />
    </motion.div>
  );
};

export default DashboardPage;