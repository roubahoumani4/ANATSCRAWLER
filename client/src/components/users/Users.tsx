import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  _id?: string;
  username: string;
  fullName?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
}

const Users = () => {
  const { language, translate } = useLanguage();
  const [, navigate] = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Fetch user profiles from new endpoint
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ["/api/user-profiles"],
    queryFn: async () => {
      const res = await fetch("/api/user-profiles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user profiles");
      return res.json();
    },
  });
  
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
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
              <th>Username</th>
              <th>Full Name</th>
              <th>Organization</th>
              <th>Department</th>
              <th>Job Position</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user._id || user.username || index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layoutId={`user-${user._id || user.username}`}
                  >
                    <td className="username-cell">
                      <FontAwesomeIcon icon={faUser} className="user-icon" />
                      {user.username}
                    </td>
                    <td>{user.fullName || "-"}</td>
                    <td>{user.organization || "-"}</td>
                    <td>{user.department || "-"}</td>
                    <td>{user.jobPosition || "-"}</td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr variants={rowVariants}>
                  <td colSpan={5}>
                    No users found.
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
