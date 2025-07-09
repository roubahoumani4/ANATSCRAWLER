import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  const navigate = useNavigate();
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
      <div className="flex items-center gap-4 mb-6">
        <FontAwesomeIcon icon={faUser} className="text-[2rem] text-[hsl(var(--crimsonRed))] drop-shadow" />
        <h1
          style={{
            fontWeight: 800,
            fontSize: '2.2rem',
            letterSpacing: '0.04em',
            color: 'hsl(var(--crimsonRed))',
            textShadow: '0 2px 8px rgba(0,0,0,0.18)'
          }}
        >
          {translate("users.title")}
        </h1>
      </div>

      <div className="users-actions flex items-center gap-4 mb-4">
        <motion.button
          className="new-user-btn px-4 py-2 rounded font-semibold bg-[hsl(var(--crimsonRed))] text-white shadow hover:bg-[hsl(var(--crimsonRed),.85)] transition"
        onClick={() => navigate("/signup")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FontAwesomeIcon icon={faUserPlus} className="btn-icon mr-2" />
          {translate("users.newUser")}
        </motion.button>

        <div className="search-filter flex items-center bg-[#232323] rounded px-2 py-1 shadow-inner">
          <FontAwesomeIcon icon={faSearch} className="filter-icon text-[hsl(var(--crimsonRed))] mr-2" />
          <input
            type="text"
            placeholder={translate("users.filter")}
            className="filter-input bg-transparent outline-none text-white placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: 180 }}
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
                      <span className="font-bold">{user.username}</span>
                    </td>
                    <td>{user.fullName || "-"}</td>
                    <td>{user.organization || "-"}</td>
                    <td>{user.department || "-"}</td>
                    <td>{user.jobPosition || "-"}</td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr variants={rowVariants}>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
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
