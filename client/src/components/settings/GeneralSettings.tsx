import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import moment from "moment-timezone";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GeneralSettings = () => {
  const { language, changeLanguage, timezone, changeTimezone, deleteTimezone } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentTimezone, setCurrentTimezone] = useState(timezone || "Asia/Beirut");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    setTimezones(moment.tz.names());
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const passwordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      const response = await apiRequest(
        "POST", 
        "/api/change-password", 
        passwordData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "French" ? "Succès" : "Success",
        description: language === "French" 
          ? "Mot de passe mis à jour avec succès." 
          : "Password updated successfully.",
        variant: "default"
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (err: any) => {
      toast({
        title: language === "French" ? "Erreur" : "Error",
        description: err.message || (language === "French" 
          ? "Échec de la modification du mot de passe." 
          : "Failed to change password."),
        variant: "destructive"
      });
    }
  });

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentTimezone(e.target.value);
  };

  const handleSaveTimezone = () => {
    changeTimezone(currentTimezone);
    toast({
      title: language === "French" ? "Fuseau horaire enregistré" : "Timezone saved",
      description: currentTimezone,
      variant: "default"
    });
  };

  const handleDeleteTimezone = () => {
    deleteTimezone();
    toast({
      title: language === "French" ? "Fuseau horaire supprimé" : "Timezone deleted",
      description: language === "French" 
        ? "Retour au fuseau horaire par défaut" 
        : "Reverted to default timezone",
      variant: "default"
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: language === "French" ? "Erreur" : "Error",
        description: language === "French" 
          ? "Les mots de passe ne correspondent pas." 
          : "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    passwordMutation.mutate({ 
      username, 
      currentPassword, 
      newPassword 
    });
  };

  const handleRestoreBackup = () => {
    toast({
      title: language === "French" ? "Information" : "Information",
      description: language === "French" 
        ? "Restauration de la sauvegarde... (Fonctionnalité à implémenter)" 
        : "Restoring backup... (Functionality to be implemented)",
      variant: "default"
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="general-settings-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1>{language === "French" ? "Paramètres généraux" : "General Settings"}</h1>
      <p>
        {language === "French"
          ? `Bienvenue, ${username}. Cette section vous permet de gérer les paramètres de l'application.`
          : `Welcome, ${username}. This section allows you to manage core application settings.`}
      </p>

      <motion.div 
        className="language-timezone-settings"
        variants={sectionVariants}
      >
        <h2 className="settings-title">{language === "French" ? "Langue et fuseau horaire" : "Language & Timezone"}</h2>
        <div className="setting-option">
          <label>{language === "French" ? "Langue d'affichage" : "Display Language"}</label>
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value as any)}
            className="form-select"
          >
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Fuseau horaire" : "Timezone"}</label>
          <select 
            value={currentTimezone} 
            onChange={handleTimezoneChange}
            className="form-select"
          >
            {timezones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <div className="timezone-buttons">
            <motion.button 
              className="restore-button" 
              onClick={handleSaveTimezone}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {language === "French" ? "Enregistrer" : "Save"}
            </motion.button>
            <motion.button 
              className="delete-button" 
              onClick={handleDeleteTimezone}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {language === "French" ? "Supprimer" : "Delete"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="edit-user-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">{language === "French" ? "Changer le mot de passe" : "Change Password"}</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="setting-option">
            <label>{language === "French" ? "Mot de passe actuel" : "Current Password"}</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Nouveau mot de passe" : "New Password"}</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Confirmer le nouveau mot de passe" : "Confirm New Password"}</label>
            <input 
              type="password" 
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
              required 
            />
          </div>

          <motion.button 
            type="submit" 
            className="save-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={passwordMutation.isPending}
          >
            {passwordMutation.isPending
              ? (language === "French" ? "Mise à jour..." : "Updating...")
              : (language === "French" ? "Mettre à jour le mot de passe" : "Update Password")}
          </motion.button>
        </form>
      </motion.div>

      <motion.div 
        className="backup-recovery"
        variants={sectionVariants}
      >
        <h2 className="settings-title">{language === "French" ? "Gestion des données" : "Data Management"}</h2>
        <p>
          {language === "French"
            ? "Exporter les journaux d'activité des utilisateurs, les journaux de sécurité et les métadonnées des fichiers téléchargés."
            : "Export user activity logs, security logs, uploaded files metadata."}
        </p>
        <motion.button 
          className="restore-button" 
          onClick={handleRestoreBackup}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === "French" ? "Restaurer la sauvegarde" : "Restore Backup"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default GeneralSettings;
