// EditUser.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../LanguageContext"; 
import "./EditUser.css";

const EditUser = () => {
  const { language } = useLanguage(); 
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/edit-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, fullName, email, organization, department, jobPosition }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(
          language === "French"
            ? "Informations utilisateur mises à jour avec succès !"
            : "User information updated successfully!"
        );
        navigate("/");
      } else {
        setError(
          result.error ||
            (language === "French"
              ? "La mise à jour a échoué. Veuillez réessayer."
              : "Update failed. Please try again.")
        );
      }
    } catch (err) {
      setError(
        language === "French"
          ? "Une erreur s'est produite. Veuillez réessayer."
          : "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="edit-user-container">
      <h1>{language === "French" ? "Modifier l'utilisateur" : "Edit User"}</h1>
      <p>{language === "French" ? "Ajoutez plus d'informations sur vous-même." : "Add more information about yourself."}</p>

      {error && <p className="error-message">{error}</p>}

      <div className="edit-user-box">
        <form onSubmit={handleSave}>
          <div className="setting-option">
            <label>{language === "French" ? "Nom d'utilisateur" : "Username"}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Mot de passe" : "Password"}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Nom complet" : "Full Name"}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="setting-option">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Nom de l'organisation" : "Organization Name"}</label>
            <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Département" : "Department"}</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          <div className="setting-option">
            <label>{language === "French" ? "Poste" : "Job Position"}</label>
            <input type="text" value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} />
          </div>

          <button className="save-button">
            {language === "French" ? "Enregistrer" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
