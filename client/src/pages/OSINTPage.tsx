import React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/utils/animations";
import SpiderFootIntegrated from "@/components/osint/SpiderFootIntegrated";

const OSINTPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      className="w-full h-screen"
    >
      <SpiderFootIntegrated />
    </motion.div>
  );
};

export default OSINTPage;
