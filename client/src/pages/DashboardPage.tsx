import { motion } from "framer-motion";
import { pageVariants } from "@/utils/animations";
import SimpleDashboard from "@/components/dashboard/SimpleDashboard";
import Layout from "@/components/layout/Layout";

const DashboardPage = () => {
  return (
    <Layout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        <SimpleDashboard />
      </motion.div>
    </Layout>
  );
};

export default DashboardPage;