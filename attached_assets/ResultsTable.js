import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./ResultsTable.css";

const ResultsTable = ({ results, isImported }) => {
  const [isExported, setIsExported] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleExport = () => {
    if (results.length === 0) return;

    // Process results to extract username, email, and password
    const processedResults = results.map((result) => {
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

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(processedResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    try {
      // Convert workbook to binary string
      const excelBlob = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Create a Blob URL for download
      const blob = new Blob([excelBlob], { type: "application/octet-stream" });
      const excelUrl = URL.createObjectURL(blob);
      setDownloadUrl(excelUrl);
      setIsExported(true);

      alert("Results exported successfully!");
    } catch (error) {
      console.error("Error exporting Excel file:", error);
    }
  };

  return (
    <section className="results-section">
      <h2>{isImported ? "" : ""}</h2>
      {results.length === 0 ? (
        <p className="no-results"></p>
      ) : (
        <div>
          <div className="results-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Collection</th>
                  <th>Folder</th>
                  <th>File Name</th>
                  <th>Content</th>
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
          <div className="export-buttons">
            <button className="black-button" onClick={handleExport}>
              Export to Excel
            </button>
            {isExported && (
              <a
                href={downloadUrl}
                download="results.xlsx"
                className="black-button"
              >
                Download Excel
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ResultsTable;
