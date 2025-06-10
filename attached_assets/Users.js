// Users.j:
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../LanguageContext";
import "./Users.css";

const Users = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
        if (!response.ok) {
          throw new Error(
            language === "French"
              ? "Échec de la récupération des utilisateurs."
              : language === "Spanish"
              ? "Error al obtener usuarios."
              : "Failed to fetch users."
          );
        }
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [language]);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="users-container">
      <h1>
        {language === "French"
          ? "Utilisateurs enregistrés"
          : language === "Spanish"
          ? "Usuarios registrados"
          : "Registered Users"}
      </h1>

      <div className="users-actions">
        <button className="new-user-btn" onClick={() => navigate("/new-user")}>
          <FontAwesomeIcon icon={faUserPlus} className="btn-icon" />
          {language === "French"
            ? "Nouvel utilisateur"
            : language === "Spanish"
            ? "Nuevo usuario"
            : "New User"}
        </button>

        <div className="search-filter">
          <FontAwesomeIcon icon={faSearch} className="filter-icon" />
          <input
            type="text"
            placeholder={
              language === "French"
                ? "Filtrer"
                : language === "Spanish"
                ? "Filtrar"
                : "Filter"
            }
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>
          {language === "French"
            ? "Chargement des utilisateurs..."
            : language === "Spanish"
            ? "Cargando usuarios..."
            : "Loading users..."}
        </p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>
                {language === "French"
                  ? "Nom d'utilisateur"
                  : language === "Spanish"
                  ? "Nombre de usuario"
                  : "Username"}
              </th>
              <th>
                {language === "French"
                  ? "Nom complet"
                  : language === "Spanish"
                  ? "Nombre completo"
                  : "Full Name"}
              </th>
              <th>Email</th>
              <th>
                {language === "French"
                  ? "Organisation"
                  : language === "Spanish"
                  ? "Organización"
                  : "Organization"}
              </th>
              <th>
                {language === "French"
                  ? "Département"
                  : language === "Spanish"
                  ? "Departamento"
                  : "Department"}
              </th>
              <th>
                {language === "French"
                  ? "Poste"
                  : language === "Spanish"
                  ? "Puesto"
                  : "Job Position"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={index}>
                  <td className="username-cell">
                    <FontAwesomeIcon icon={faUser} className="user-icon" />
                    {user.username}
                  </td>
                  <td>{user.fullName || "N/A"}</td>
                  <td>{user.email}</td>
                  <td>{user.organization || "N/A"}</td>
                  <td>{user.department || "N/A"}</td>
                  <td>{user.jobPosition || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  {language === "French"
                    ? "Aucun utilisateur trouvé."
                    : language === "Spanish"
                    ? "No se encontraron usuarios."
                    : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Users;
