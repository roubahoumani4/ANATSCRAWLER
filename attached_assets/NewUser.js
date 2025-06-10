// NewUser.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../LanguageContext";
import "../Settings/Settings.css";

const NewUser = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (e) => {
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

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || (language === "French" ? "L'enregistrement a échoué." : "Registration failed."));
      } else {
        setSuccess(language === "French" ? "Utilisateur enregistré avec succès !" : "User registered successfully!");
        setTimeout(() => navigate("/users"), 2000);
      }
    } catch (err) {
      setError(language === "French" ? "Erreur du serveur." : "Server error.");
    }
  };

  return (
    <div className="edit-user-box">
      <h2>{language === "French" ? "Créer un nouvel utilisateur" : "Create New User"}</h2>
      <form onSubmit={handleSave}>
        <div className="setting-option">
          <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="setting-option">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Mot de passe" : "Password"}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="setting-option">
          <label>{language === "French" ? "Confirmer le mot de passe" : "Confirm Password"}</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        <button className="save-button" type="submit">
          {language === "French" ? "Créer un utilisateur" : "Create User"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default NewUser;
