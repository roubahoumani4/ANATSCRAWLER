import React, { useState } from "react";
import axios from "axios";
import "./SearchForm.css";

const SearchForm = ({ setResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      setPopupMessage("Please enter at least 3 characters.");
      setTimeout(() => setPopupMessage(null), 3000);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search`, {
        params: { query },
      });

      if (response.data.results && response.data.results.length > 0) {
        setResults(response.data.results);
        setPopupMessage(null); // Clear any previous error messages
      } else {
        setResults([]); // Clear the table when no results are found
        setPopupMessage("No results found.");
      }
    } catch {
      setResults([]); // Clear the table on search failure
      setPopupMessage("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="search-section">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="username,email,password"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading} className="black-button">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {popupMessage && <div className={`popup ${popupMessage.includes("failed") ? "error" : "success"}`}>{popupMessage}</div>}
    </section>
  );
};

export default SearchForm;
