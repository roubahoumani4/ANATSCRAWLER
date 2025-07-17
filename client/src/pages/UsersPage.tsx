import React from "react";
import { motion } from "framer-motion";
import Users from "../components/users/Users";
import BackButton from "@/components/ui/back-button";

const UsersPage = () => {
  return (
    <div className="min-h-screen bg-jetBlack text-coolWhite">
      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BackButton color="grey" />
        <Users />
      </motion.div>
    </div>
  );
};

export default UsersPage;
