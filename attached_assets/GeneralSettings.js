import React, { useState, useEffect } from "react";
import { useLanguage } from "../../LanguageContext";
import moment from "moment-timezone";
import "./Settings.css";

const GeneralSettings = () => {
  const { language, changeLanguage, timezone, changeTimezone, deleteTimezone } = useLanguage();
  const [currentTimezone, setCurrentTimezone] = useState(timezone || "Asia/Beirut");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timezones, setTimezones] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    setTimezones(moment.tz.names());
    const storedUsername = localStorage.getItem("authUsername");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleTimezoneChange = (e) => {
    setCurrentTimezone(e.target.value);
  };

  const handleSaveTimezone = () => {
    changeTimezone(currentTimezone);
    alert(language === "French" ? `Fuseau horaire enregistré: ${currentTimezone}` : `Timezone saved: ${currentTimezone}`);
  };

  const handleDeleteTimezone = () => {
    deleteTimezone();
    alert(language === "French" ? "Fuseau horaire supprimé" : "Timezone deleted");
  };

  const handleThemeToggle = () => {
    setIsDarkMode((prevState) => !prevState);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert(language === "French" ? "Les mots de passe ne correspondent pas." : "New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(language === "French" ? "Mot de passe mis à jour avec succès." : "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        alert(result.error || (language === "French" ? "Échec de la modification du mot de passe." : "Failed to change password."));
      }
    } catch (error) {
      alert(language === "French" ? "Une erreur s'est produite lors de la mise à jour du mot de passe." : "An error occurred while updating the password.");
    }
  };

  const handleRestoreBackup = () => {
    alert(language === "French" ? "Restauration de la sauvegarde... (Fonctionnalité à implémenter)" : "Restoring backup... (Functionality to be implemented)");
  };

  return (
    <div className="general-settings-container">
      <h1>{language === "French" ? "Paramètres généraux" : "General Settings"}</h1>
      <p>
        {language === "French"
          ? `Bienvenue, ${username}. Cette section vous permet de gérer les paramètres de l'application.`
          : `Welcome, ${username}. This section allows you to manage core application settings.`}
      </p>

      {/* Language and Timezone Settings */}
      <div className="language-timezone-settings">
        <h2 className="settings-title">{language === "French" ? "Langue et fuseau horaire" : "Language & Timezone"}</h2>
        <div className="setting-option">
          <label>{language === "French" ? "Langue d'affichage" : "Display Language"}</label>
          <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="French">French</option>
          </select>
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Fuseau horaire" : "Timezone"}</label>
          <select value={currentTimezone} onChange={handleTimezoneChange}>
            {timezones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <div className="timezone-buttons">
            <button className="restore-button" onClick={handleSaveTimezone}>
              {language === "French" ? "Enregistrer" : "Save"}
            </button>
            <button className="delete-button" onClick={handleDeleteTimezone}>
              {language === "French" ? "Supprimer" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="edit-user-box">
        <h2 className="settings-title">{language === "French" ? "Changer le mot de passe" : "Change Password"}</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="setting-option">
            <label>{language === "French" ? "Mot de passe actuel" : "Current Password"}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Nouveau mot de passe" : "New Password"}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Confirmer le nouveau mot de passe" : "Confirm New Password"}</label>
            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
          </div>

          <button type="submit" className="save-button">
            {language === "French" ? "Mettre à jour le mot de passe" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Backup & Recovery Section */}
      <div className="backup-recovery">
        <h2 className="settings-title">{language === "French" ? "Gestion des données" : "Data Management"}</h2>
        <p>
          {language === "French"
            ? "Exporter les journaux d'activité des utilisateurs, les journaux de sécurité et les métadonnées des fichiers téléchargés."
            : "Export user activity logs, security logs, uploaded files metadata."}
        </p>
        <button className="restore-button" onClick={handleRestoreBackup}>
          {language === "French" ? "Restaurer la sauvegarde" : "Restore Backup"}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;
