import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EditUser = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setOrganization(user.organization || "");
      setDepartment(user.department || "");
      setJobPosition(user.jobPosition || "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/edit-user", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "French" ? "Succès" : "Success",
        description: language === "French" 
          ? "Informations utilisateur mises à jour avec succès !" 
          : "User information updated successfully!",
        variant: "default"
      });
      navigate("/");
    },
    onError: (err: any) => {
      setError(err.message || (language === "French" 
        ? "La mise à jour a échoué. Veuillez réessayer." 
        : "Update failed. Please try again."));
      toast({
        title: language === "French" ? "Erreur" : "Error",
        description: err.message || (language === "French" 
          ? "La mise à jour a échoué. Veuillez réessayer." 
          : "Update failed. Please try again."),
        variant: "destructive"
      });
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    updateMutation.mutate({ 
      username, 
      password, 
      fullName, 
      email, 
      organization, 
      department, 
      jobPosition 
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="edit-user-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1>{language === "French" ? "Modifier l'utilisateur" : "Edit User"}</h1>
      <p>{language === "French" ? "Ajoutez plus d'informations sur vous-même." : "Add more information about yourself."}</p>

      {error && <p className="error-message">{error}</p>}

      <motion.div 
        className="edit-user-box"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <form onSubmit={handleSave}>
          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Mot de passe" : "Password"}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={language === "French" ? "Laissez vide pour conserver" : "Leave empty to keep current"} />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Nom complet" : "Full Name"}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Nom de l'organisation" : "Organization Name"}</label>
            <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Département" : "Department"}</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </motion.div>

          <motion.div 
            className="setting-option"
            variants={inputVariants}
          >
            <label>{language === "French" ? "Poste" : "Job Position"}</label>
            <input type="text" value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} />
          </motion.div>

          <motion.button 
            className="save-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? (language === "French" ? "Enregistrement..." : "Saving...")
              : (language === "French" ? "Enregistrer" : "Save")}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditUser;
