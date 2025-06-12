import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
}

const Users = () => {
  const { language, translate } = useLanguage();
  const [, navigate] = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const tableVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch users. Please try again.",
      variant: "destructive"
    });
  }

  return (
    <motion.div 
      className="users-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1>{translate("users.title")}</h1>

      <div className="users-actions">
        <motion.button 
          className="new-user-btn"
          onClick={() => navigate("/new-user")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FontAwesomeIcon icon={faUserPlus} className="btn-icon" />
          {translate("users.newUser")}
        </motion.button>

        <div className="search-filter">
          <FontAwesomeIcon icon={faSearch} className="filter-icon" />
          <input
            type="text"
            placeholder={translate("users.filter")}
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="spinner w-8 h-8 border-4 border-coolWhite/10 border-t-coolWhite rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <p className="error-message">{error instanceof Error ? error.message : "An error occurred"}</p>
      ) : (
        <motion.table 
          className="users-table"
          variants={tableVariants}
          initial="hidden"
          animate="visible"
        >
          <thead>
            <tr>
              <th>{language === "French" ? "Nom d'utilisateur" : "Username"}</th>
              <th>{language === "French" ? "Nom complet" : "Full Name"}</th>
              <th>Email</th>
              <th>{language === "French" ? "Organisation" : "Organization"}</th>
              <th>{language === "French" ? "Département" : "Department"}</th>
              <th>{language === "French" ? "Poste" : "Job Position"}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user.id || index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layoutId={`user-${user.id}`}
                  >
                    <td className="username-cell">
                      <FontAwesomeIcon icon={faUser} className="user-icon" />
                      {user.username}
                    </td>
                    <td>{user.fullName || "N/A"}</td>
                    <td>{user.email}</td>
                    <td>{user.organization || "N/A"}</td>
                    <td>{user.department || "N/A"}</td>
                    <td>{user.jobPosition || "N/A"}</td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr variants={rowVariants}>
                  <td colSpan={6}>
                    {language === "French"
                      ? "Aucun utilisateur trouvé."
                      : "No users found."}
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </motion.table>
      )}
    </motion.div>
  );
};

export default Users;
