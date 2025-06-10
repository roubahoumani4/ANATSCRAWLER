import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useLanguage } from "../LanguageContext"; // Added for multi-language support
import "./Dashboard.css";

const Dashboard = ({ totalFiles }) => {
  const { language } = useLanguage(); // Use language context to get selected language
  const [uploadedData, setUploadedData] = useState([]);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [results, setResults] = useState([]);
  const [uploadedResults, setUploadedResults] = useState([]);
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const [fileUploadSpinner, setFileUploadSpinner] = useState(false);
  const [currentTotalFiles, setCurrentTotalFiles] = useState(totalFiles);
  const [scanCommandVisible, setScanCommandVisible] = useState(false);

  useEffect(() => {
    const fetchTotalFiles = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/total-indexed`);
        if (!response.ok) throw new Error("Failed to fetch total indexed files.");
        const data = await response.json();
        setCurrentTotalFiles(data.total);
      } catch (error) {
        console.error("Error fetching total indexed files:", error);
      }
    };

    fetchTotalFiles();
  }, []);

  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setPopupVisible(true);
    setTimeout(() => {
      setPopupVisible(false);
    }, 3000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      showPopupMessage(
        language === "French"
          ? "Erreur : Veuillez télécharger un fichier Excel valide (.xlsx ou .xls)."
          : "Error: Please upload a valid Excel file (.xlsx or .xls)."
      );
      return;
    }

    setFileUploadSpinner(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const extractedData = parsedData.map((row) => row[0]).filter(Boolean);
      setUploadedData(extractedData);
      setSearchEnabled(true);
      showPopupMessage(
        language === "French" ? "Fichier téléchargé avec succès !" : "File uploaded successfully!"
      );
    };
    reader.readAsArrayBuffer(file);
    setFileUploadSpinner(false);
  };

  const handleBatchSearch = async () => {
    if (uploadedData.length === 0) {
      showPopupMessage(
        language === "French" ? "Aucune donnée trouvée pour la recherche." : "No data found to search."
      );
      return;
    }

    setSpinnerVisible(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/batch-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: uploadedData }),
      });
      const result = await response.json();

      if (result.found) {
        setUploadedResults(result.data);
        showPopupMessage(language === "French" ? "Résultats trouvés" : "Results found");
      } else {
        showPopupMessage(
          language === "French" ? "Aucun résultat trouvé." : "No results found."
        );
      }
    } catch (error) {
      console.error("Error during batch search:", error);
      showPopupMessage(
        language === "French"
          ? "La recherche par lots a échoué. Veuillez réessayer."
          : "Batch search failed. Please try again."
      );
    } finally {
      setSpinnerVisible(false);
    }
  };

  const handleExport = (data, filename) => {
    if (data.length === 0) return;

    const processedResults = data.map((result) => {
      let email = "";
      let password = "";
      let username = "";

      if (result.content.includes(":")) {
        const [part1, part2] = result.content.split(":");
        if (part1.includes("@")) {
          email = part1.trim();
          password = part2.trim();
        } else {
          username = part1.trim();
          password = part2.trim();
        }
      }

      return {
        Username: username || "N/A",
        Email: email || "N/A",
        Password: password || "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(processedResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    try {
      XLSX.writeFile(workbook, filename);
      showPopupMessage(
        language === "French"
          ? `${filename} exporté avec succès !`
          : `${filename} exported successfully!`
      );
    } catch (error) {
      console.error("Error exporting Excel file:", error);
    }
  };

  return (
    <section className="dashboard">
      <div className="dashboard-cards">
        <div className="card">
          <h3>
            {language === "French" ? "Fichiers indexés totaux" : "Total Indexed Files"}
          </h3>
          <p>{currentTotalFiles}</p>
        </div>

        <div className="card file-upload-card">
          <h3>
            {language === "French" ? "Importer un fichier Excel" : "Import Excel File"}
          </h3>
          <div className="file-search-container">
            <label htmlFor="file-input" className="custom-file-label">
              {language === "French" ? "Choisir le fichier" : "Choose File"}
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
            <button
              className="black-button"
              disabled={!searchEnabled}
              onClick={handleBatchSearch}
            >
              {language === "French" ? "Rechercher les données téléchargées" : "Search Uploaded Data"}
            </button>
            {fileUploadSpinner && <div className="spinner small-spinner" />}
          </div>
        </div>

        <div className={`card ${scanCommandVisible ? "show-command" : ""}`}>
          <h3>
            {language === "French" ? "Analyse des vulnérabilités" : "Vulnerability Scanning"}
          </h3>
          <button className="black-button" onClick={() => setScanCommandVisible(true)}>
            {language === "French" ? "Scanner" : "Scan"}
          </button>
        </div>
      </div>

      {popupVisible && (
        <div className={`popup ${popupMessage.includes("Error") ? "error" : ""}`}>
          {popupMessage}
        </div>
      )}

      {uploadedResults.length > 0 && (
        <div className="results-section">
          <h2>{language === "French" ? "Résultats du fichier importé" : "Imported File Results"}</h2>
          <div className="results-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{language === "French" ? "Collection" : "Collection"}</th>
                  <th>{language === "French" ? "Dossier" : "Folder"}</th>
                  <th>{language === "French" ? "Nom du fichier" : "File Name"}</th>
                  <th>{language === "French" ? "Contenu" : "Content"}</th>
                </tr>
              </thead>
              <tbody>
                {uploadedResults.map((result, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{result.collection}</td>
                    <td>{result.folderName}</td>
                    <td>{result.fileName}</td>
                    <td>{result.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="black-button"
            onClick={() => handleExport(uploadedResults, "uploaded_results.xlsx")}
          >
            {language === "French" ? "Exporter en Excel" : "Export to Excel"}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-section">
          <h2>{language === "French" ? "Résultats de la recherche" : "Search Results"}</h2>
          <div className="results-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{language === "French" ? "Collection" : "Collection"}</th>
                  <th>{language === "French" ? "Dossier" : "Folder"}</th>
                  <th>{language === "French" ? "Nom du fichier" : "File Name"}</th>
                  <th>{language === "French" ? "Contenu" : "Content"}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{result.collection}</td>
                    <td>{result.folderName}</td>
                    <td>{result.fileName}</td>
                    <td>{result.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="black-button"
            onClick={() => handleExport(results, "search_results.xlsx")}
          >
            {language === "French" ? "Exporter en Excel" : "Export to Excel"}
          </button>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
