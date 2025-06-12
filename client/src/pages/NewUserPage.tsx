import React from "react";
import { motion } from "framer-motion";
import NewUser from "../components/users/NewUser";
import { useLanguage } from "../context/LanguageContext";

const NewUserPage = () => {
  const { language } = useLanguage();
  
  return (
    <motion.div
      className="edit-user-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>{language === "French" ? "Créer un nouvel utilisateur" : "Create New User"}</h1>
      <p>
        {language === "French" 
          ? "Ajoutez un nouvel utilisateur au système." 
          : "Add a new user to the system."}
      </p>
      <NewUser />
    </motion.div>
  );
};

export default NewUserPage;
