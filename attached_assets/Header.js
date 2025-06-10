// Header.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../LanguageContext";
import moment from "moment-timezone";
import "./Header.css";

const Header = ({ setActiveComponent, handleLogout }) => {
  const { language, timezone, showTimezone } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("authUsername");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const updateTime = () => {
      if (timezone && showTimezone) {
        const now = moment().tz(timezone).format("HH:mm:ss");
        setCurrentTime(now);
      }
    };

    const interval = setInterval(updateTime, 1000); // Update every second
    return () => clearInterval(interval);
  }, [timezone, showTimezone]);

  return (
    <header className="header">
      <div className="logo">
        <img src="/anat security logo.png" alt="ANAT Security Logo" />
      </div>

      {/* Display Timezone in the Middle of the Header */}
      {timezone && showTimezone && (
        <div className="timezone-display">
          {currentTime} - {timezone}
        </div>
      )}

      {username && (
        <div className="user-menu">
          <button className="user-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <FontAwesomeIcon icon={faUser} className="user-icon" />
            {username}
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item settings-dropdown"
                onMouseEnter={() => setSettingsOpen(true)}
                onMouseLeave={() => setSettingsOpen(false)}
              >
                {language === 'French' ? 'Paramètres' : 'Settings'}
                {settingsOpen && (
                  <div className="settings-submenu">
                    <button onClick={() => setActiveComponent("GeneralSettings")}>
                      {language === 'French' ? 'Général' : 'General'}
                    </button>
                    <button onClick={() => setActiveComponent("History")}>
                      {language === 'French' ? 'Historique' : 'History'}
                    </button>
                    <button onClick={() => navigate("/users")}>
                      {language === 'French' ? 'Utilisateurs' : 'Users'}
                    </button>
                    <button onClick={() => setActiveComponent("Preferences")}>
                      {language === 'French' ? 'Préférences' : 'Preferences'}
                    </button>
                  </div>
                )}
              </div>

              <button className="dropdown-item" onClick={() => navigate("/edit-user")}>
                {language === 'French' ? 'Modifier l’utilisateur' : 'Edit User'}
              </button>

              <button onClick={handleLogout} className="dropdown-item">
                {language === 'French' ? 'Se déconnecter' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
