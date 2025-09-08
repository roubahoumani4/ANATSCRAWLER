import React from "react";
import { motion } from "framer-motion";
import GeneralSettings from "../components/settings/GeneralSettings";
import BackButton from "@/components/ui/back-button";

const GeneralSettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4">
        <BackButton color="orange" />
      </div>
      <GeneralSettings />
    </motion.div>
  );
};

export default GeneralSettingsPage;
