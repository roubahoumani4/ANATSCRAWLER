import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const ThreatIntelligencePage = () => {
  const { translate } = useLanguage();
  return (
    <motion.div
      className="threat-intel-container min-h-screen flex flex-col items-center justify-center bg-jetBlack text-coolWhite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-[hsl(var(--crimsonRed))] mb-4 drop-shadow">
        Threat Intelligence
      </h1>
      <p className="mb-8 text-lg text-gray-300 max-w-xl text-center">
        Search for a person across social media platforms (Facebook, Instagram, Twitter/X, LinkedIn) and generate a professional intelligence report. Start by entering a name or username below.
      </p>
      {/* Step 1: Search form with state, validation, and results placeholder */}
      <ThreatIntelSearch />
      {/* Results and reporting UI will be developed step by step */}
// --- Threat Intelligence Search Form Component ---
import { useState } from "react";

const ThreatIntelSearch = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    if (!name && !username && !email) {
      setError("Please enter at least one field.");
      return;
    }
    setLoading(true);
    // Simulate search (replace with API call in next step)
    setTimeout(() => {
      setResults({
        facebook: null,
        instagram: null,
        twitter: null,
        linkedin: null,
        summary: "(Results will appear here in the next step)"
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md bg-[#181818] rounded-lg shadow-lg p-6 flex flex-col gap-4 mt-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Full Name (optional)"
          className="px-4 py-2 rounded bg-[#232323] text-white placeholder-gray-400"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username (optional)"
          className="px-4 py-2 rounded bg-[#232323] text-white placeholder-gray-400"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          className="px-4 py-2 rounded bg-[#232323] text-white placeholder-gray-400"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="py-2 rounded bg-[hsl(var(--crimsonRed))] text-white font-bold hover:bg-[hsl(var(--crimsonRed),.85)] transition"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div className="text-red-400 text-center mt-2">{error}</div>}
      {results && (
        <div className="bg-[#232323] rounded p-4 mt-4 text-gray-200 text-sm">
          <div className="font-bold mb-2">Results Preview</div>
          <div>{results.summary}</div>
        </div>
      )}
    </div>
  );
};
    </motion.div>
  );
};

export default ThreatIntelligencePage;
