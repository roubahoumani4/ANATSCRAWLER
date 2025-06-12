import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const PreferencesSettings = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [autoLogoutTime, setAutoLogoutTime] = useState("30 min");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showIndexedFiles, setShowIndexedFiles] = useState(true);
  const [showRecentSearches, setShowRecentSearches] = useState(true);

  const handleToggleMFA = () => {
    setIsMFAEnabled(!isMFAEnabled);
    toast({
      title: isMFAEnabled 
        ? (language === "French" ? "MFA désactivé" : "MFA disabled") 
        : (language === "French" ? "MFA activé" : "MFA enabled"),
      description: isMFAEnabled 
        ? (language === "French" ? "L'authentification à deux facteurs a été désactivée" : "Two-factor authentication has been disabled") 
        : (language === "French" ? "L'authentification à deux facteurs a été activée" : "Two-factor authentication has been enabled"),
      variant: "default"
    });
  };

  const handleLogoutTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoLogoutTime(e.target.value);
  };

  const handleSaveDashboardPreferences = () => {
    toast({
      title: language === "French" ? "Préférences enregistrées" : "Preferences saved",
      description: language === "French" 
        ? "Les préférences du tableau de bord ont été mises à jour" 
        : "Dashboard preferences have been updated",
      variant: "default"
    });
  };

  const handleDeleteAccount = () => {
    if (!username || !password) {
      toast({
        title: language === "French" ? "Erreur" : "Error",
        description: language === "French" 
          ? "Veuillez saisir votre nom d'utilisateur et votre mot de passe" 
          : "Please enter your username and password",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: language === "French" ? "Attention" : "Warning",
      description: language === "French" 
        ? "Cette action est irréversible. Contactez un administrateur pour supprimer votre compte." 
        : "This action is irreversible. Please contact an administrator to delete your account.",
      variant: "destructive"
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
      <h1>{language === "French" ? "Paramètres de préférences" : "Preferences Settings"}</h1>
      <p>
        {language === "French"
          ? "Personnalisez les préférences de votre compte et les paramètres de sécurité."
          : "Customize your account preferences and security settings."}
      </p>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          {language === "French" ? "Configuration de l'authentification multifacteur (MFA)" : "Multi-Factor Authentication (MFA) Setup"}
        </h2>
        <p>
          {language === "French" ? "Améliorez la sécurité en activant le MFA." : "Enhance security by enabling MFA."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Activer le MFA" : "Enable MFA"}</label>
          <div className="toggle-switch" onClick={handleToggleMFA}>
            <input type="checkbox" checked={isMFAEnabled} onChange={handleToggleMFA} />
            <span className="toggle-slider"></span>
          </div>
        </div>

        {isMFAEnabled && (
          <motion.div 
            className="mfa-qr-container mt-4 flex flex-col items-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/ANAT:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ANAT" 
              alt="MFA QR Code" 
              className="border-2 border-coolWhite rounded-md" 
            />
            <p className="mt-2 text-sm">Scan this QR code with your authenticator app</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          {language === "French" ? "Gestion des sessions et déconnexion des autres appareils" : "Session Management & Logout from Other Devices"}
        </h2>
        <p>
          {language === "French"
            ? "Liste de toutes les sessions de connexion actives, cliquez sur le bouton pour vous déconnecter de tous les autres appareils."
            : "List of all active login sessions, click the button to logout from all other devices."}
        </p>

        <div className="session-list">
          <div className="session-item">
            <span>
              {language === "French" ? "Appareil :" : "Device:"} <strong>Chrome - Windows 10</strong> | IP: 192.168.1.5 |{" "}
              {language === "French" ? "Dernière connexion :" : "Last Login:"} 1 hour ago
            </span>
          </div>
          <div className="session-item">
            <span>
              {language === "French" ? "Appareil :" : "Device:"} <strong>Firefox - Ubuntu</strong> | IP: 10.2.0.1 |{" "}
              {language === "French" ? "Dernière connexion :" : "Last Login:"} 3 hours ago
            </span>
          </div>
        </div>

        <motion.button 
          className="settings-button mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === "French" ? "Se déconnecter des autres appareils" : "Log Out from Other Devices"}
        </motion.button>
      </motion.div>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          {language === "French" ? "Déconnexion automatique et expiration de session" : "Auto-Logout & Session Timeout"}
        </h2>
        <p>
          {language === "French" ? "Améliorez la sécurité en déconnectant automatiquement les utilisateurs inactifs." : "Enhance security by automatically logging out inactive users."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Déconnexion après inactivité" : "Logout after inactivity"}</label>
          <select value={autoLogoutTime} onChange={handleLogoutTimeChange} className="form-select">
            <option value="15 min">15 min</option>
            <option value="30 min">30 min</option>
            <option value="1 hour">1 hour</option>
            <option value="Never">{language === "French" ? "Jamais" : "Never"}</option>
          </select>
        </div>

        <motion.button 
          className="settings-button mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === "French" ? "Enregistrer" : "Save"}
        </motion.button>
      </motion.div>

      <motion.div 
        className="settings-box"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          {language === "French" ? "Préférences du tableau de bord" : "Dashboard Preferences"}
        </h2>
        <p>
          {language === "French" ? "Personnalisez les sections qui apparaissent sur votre tableau de bord." : "Customize which sections appear on your dashboard."}
        </p>

        <div className="dashboard-options">
          <label>
            <input 
              type="checkbox" 
              checked={showIndexedFiles} 
              onChange={() => setShowIndexedFiles(!showIndexedFiles)} 
            />
            {language === "French" ? "Afficher les fichiers indexés" : "Show Indexed Files"}
          </label>

          <label>
            <input 
              type="checkbox" 
              checked={showRecentSearches} 
              onChange={() => setShowRecentSearches(!showRecentSearches)} 
            />
            {language === "French" ? "Afficher les recherches récentes" : "Show Recent Searches"}
          </label>
        </div>

        <motion.button 
          className="settings-button mt-4"
          onClick={handleSaveDashboardPreferences}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === "French" ? "Enregistrer les préférences" : "Save Preferences"}
        </motion.button>
      </motion.div>

      <motion.div 
        className="settings-box delete-account"
        variants={sectionVariants}
      >
        <h2 className="settings-title">
          {language === "French" ? "Suppression du compte" : "Account Deletion"}
        </h2>
        <p>
          {language === "French" ? "Saisissez votre nom d'utilisateur et votre mot de passe pour supprimer votre compte." : "Enter your username and password to delete your account."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Mot de passe" : "Password"}</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <motion.button 
          className="delete-button mt-4"
          onClick={handleDeleteAccount}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {language === "French" ? "Supprimer le compte" : "Delete Account"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default PreferencesSettings;
