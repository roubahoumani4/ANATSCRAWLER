import React, { useState } from "react";
import { useLanguage } from "../../LanguageContext";
import "./Settings.css";

const PreferencesSettings = () => {
  const { language } = useLanguage();
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [autoLogoutTime, setAutoLogoutTime] = useState("30 min");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showIndexedFiles, setShowIndexedFiles] = useState(true);
  const [showRecentSearches, setShowRecentSearches] = useState(true);

  const handleToggleMFA = () => {
    setIsMFAEnabled(!isMFAEnabled);
  };

  const handleLogoutTimeChange = (e) => {
    setAutoLogoutTime(e.target.value);
  };

  const handleSaveDashboardPreferences = () => {
    alert(
      language === "French"
        ? "Préférences du tableau de bord enregistrées !"
        : "Dashboard preferences saved!"
    );
  };

  return (
    <div className="general-settings-container">
      <h1>{language === "French" ? "Paramètres de préférences" : "Preferences Settings"}</h1>
      <p>
        {language === "French"
          ? "Personnalisez les préférences de votre compte et les paramètres de sécurité."
          : "Customize your account preferences and security settings."}
      </p>

      {/* MFA Setup Container */}
      <div className="settings-box">
        <h2 className="settings-title">
          {language === "French" ? "Configuration de l'authentification multifacteur (MFA)" : "Multi-Factor Authentication (MFA) Setup"}
        </h2>
        <p>
          {language === "French" ? "Améliorez la sécurité en activant le MFA." : "Enhance security by enabling MFA."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Activer le MFA" : "Enable MFA"}</label>
          <div className="toggle-container" onClick={handleToggleMFA}>
            <div className={`toggle-switch ${isMFAEnabled ? "active" : ""}`}>
              <div className="toggle-thumb"></div>
            </div>
          </div>
        </div>

        {isMFAEnabled && (
          <div className="mfa-qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MFA" alt="QR Code" />
          </div>
        )}
      </div>

      {/* Session Management Container */}
      <div className="settings-box">
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

        <button className="settings-button">
          {language === "French" ? "Se déconnecter" : "Log Out"}
        </button>
      </div>

      {/* Auto-Logout & Session Timeout */}
      <div className="settings-box">
        <h2 className="settings-title">
          {language === "French" ? "Déconnexion automatique et expiration de session" : "Auto-Logout & Session Timeout"}
        </h2>
        <p>
          {language === "French" ? "Améliorez la sécurité en déconnectant automatiquement les utilisateurs inactifs." : "Enhance security by automatically logging out inactive users."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Déconnexion après inactivité" : "Logout after inactivity"}</label>
          <select value={autoLogoutTime} onChange={handleLogoutTimeChange}>
            <option value="15 min">15 min</option>
            <option value="30 min">30 min</option>
            <option value="1 hour">1 hour</option>
            <option value="Never">{language === "French" ? "Jamais" : "Never"}</option>
          </select>
        </div>

        <button className="settings-button">
          {language === "French" ? "Enregistrer" : "Save"}
        </button>
      </div>

      {/* Dashboard Preferences */}
      <div className="settings-box">
        <h2 className="settings-title">
          {language === "French" ? "Préférences du tableau de bord" : "Dashboard Preferences"}
        </h2>
        <p>
          {language === "French" ? "Personnalisez les sections qui apparaissent sur votre tableau de bord." : "Customize which sections appear on your dashboard."}
        </p>

        <div className="dashboard-options">
          <label>
            <input type="checkbox" checked={showIndexedFiles} onChange={() => setShowIndexedFiles(!showIndexedFiles)} />
            {language === "French" ? "Afficher les fichiers indexés" : "Show Indexed Files"}
          </label>

          <label>
            <input type="checkbox" checked={showRecentSearches} onChange={() => setShowRecentSearches(!showRecentSearches)} />
            {language === "French" ? "Afficher les recherches récentes" : "Show Recent Searches"}
          </label>
        </div>

        <button className="settings-button" onClick={handleSaveDashboardPreferences}>
          {language === "French" ? "Enregistrer les préférences" : "Save Preferences"}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="settings-box delete-account">
        <h2 className="settings-title">
          {language === "French" ? "Suppression du compte" : "Account Deletion"}
        </h2>
        <p>
          {language === "French" ? "Saisissez votre nom d'utilisateur et votre mot de passe pour supprimer votre compte." : "Enter your username and password to delete your account."}
        </p>

        <div className="setting-option">
          <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Mot de passe" : "Password"}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="delete-button">
          {language === "French" ? "Supprimer le compte" : "Delete Account"}
        </button>
      </div>
    </div>
  );
};

export default PreferencesSettings;
