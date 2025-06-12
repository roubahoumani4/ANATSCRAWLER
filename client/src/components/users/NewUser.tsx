import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NewUser = () => {
  const { language } = useLanguage();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/register-user", userData);
      return response.json();
    },
    onSuccess: () => {
      setSuccess(language === "French" ? "Utilisateur enregistré avec succès !" : "User registered successfully!");
      toast({
        title: language === "French" ? "Succès" : "Success",
        description: language === "French" ? "Utilisateur créé avec succès" : "User created successfully",
        variant: "default"
      });
      setTimeout(() => navigate("/users"), 2000);
    },
    onError: (err: any) => {
      setError(err.message || (language === "French" ? "L'enregistrement a échoué." : "Registration failed."));
      toast({
        title: language === "French" ? "Erreur" : "Error",
        description: err.message || (language === "French" ? "L'enregistrement a échoué." : "Registration failed."),
        variant: "destructive"
      });
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !email || !password || !confirmPassword) {
      setError(language === "French" ? "Tous les champs sont requis." : "All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError(language === "French" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
      return;
    }

    registerMutation.mutate({ username, email, password });
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
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
      className="edit-user-box"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <h2>{language === "French" ? "Créer un nouvel utilisateur" : "Create New User"}</h2>
      <form onSubmit={handleSave}>
        <motion.div 
          className="setting-option"
          variants={inputVariants}
          custom={0}
        >
          <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </motion.div>

        <motion.div 
          className="setting-option"
          variants={inputVariants}
          custom={1}
        >
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </motion.div>

        <motion.div 
          className="setting-option"
          variants={inputVariants}
          custom={2}
        >
          <label>{language === "French" ? "Mot de passe" : "Password"}</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </motion.div>

        <motion.div 
          className="setting-option"
          variants={inputVariants}
          custom={3}
        >
          <label>{language === "French" ? "Confirmer le mot de passe" : "Confirm Password"}</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </motion.div>

        <motion.button 
          className="save-button" 
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending 
            ? (language === "French" ? "Création en cours..." : "Creating...") 
            : (language === "French" ? "Créer un utilisateur" : "Create User")}
        </motion.button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </motion.div>
  );
};

export default NewUser;
