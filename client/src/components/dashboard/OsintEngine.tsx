import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader, List, CheckCircle, XCircle } from "lucide-react";

const API_BASE = "/api/spiderfoot";

const OsintEngine = () => {
  const [target, setTarget] = useState("");
  const [scanName, setScanName] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available modules on mount
  useEffect(() => {
    fetch(`${API_BASE}/modules`)
      .then(res => res.json())
      .then(data => setModules(data.modules || []))
      .catch(() => setModules([]));
    fetchScans();
  }, []);

  // Fetch all scans
  const fetchScans = () => {
    fetch(`${API_BASE}/scans`)
      .then(res => res.json())
      .then(data => setScans(data.scans || []));
  };

  // Start a new scan
  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, modules: selectedModules, name: scanName })
      });
      const data = await res.json();
      if (data.scan_id) {
        setActiveScanId(data.scan_id);
        fetchScans();
      } else {
        setError("Failed to start scan");
      }
    } catch {
      setError("Failed to start scan");
    }
    setLoading(false);
  };

  // Fetch scan results
  const fetchResults = async (scanId: string) => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scan/${scanId}/results`);
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Failed to fetch results");
    }
    setLoading(false);
  };

  return (
    <motion.div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-coolWhite">OSINT Engine (SpiderFoot)</h2>
      <form onSubmit={startScan} className="mb-8 bg-darkGray p-6 rounded-lg shadow-md">
        <label className="block mb-2 text-coolWhite font-semibold">Scan Name</label>
        <input
          type="text"
          value={scanName}
          onChange={e => setScanName(e.target.value)}
          className="w-full p-2 rounded bg-midGray text-coolWhite mb-4"
          placeholder="Enter a name for this scan (optional)"
        />
        <label className="block mb-2 text-coolWhite font-semibold">Target</label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="w-full p-2 rounded bg-midGray text-coolWhite mb-4"
          placeholder="Enter domain, IP, or username"
          required
        />
        <label className="block mb-2 text-coolWhite font-semibold">Modules (optional)</label>
        <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
          {modules.length === 0 && <span className="text-gray-400">Loading modules...</span>}
          {modules.map((mod: string) => (
            <label key={mod} className="inline-flex items-center text-xs bg-gray-700 text-white px-2 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                value={mod}
                checked={selectedModules.includes(mod)}
                onChange={e => {
                  if (e.target.checked) setSelectedModules([...selectedModules, mod]);
                  else setSelectedModules(selectedModules.filter(m => m !== mod));
                }}
                className="mr-1"
              />
              {mod}
            </label>
          ))}
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold flex items-center" disabled={loading}>
          <Search className="w-4 h-4 mr-2" /> Start Scan
        </button>
        {error && <div className="text-red-400 mt-2">{error}</div>}
      </form>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-coolWhite mb-2">Your Scans</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-darkGray rounded-lg">
            <thead>
              <tr className="text-gray-400">
                <th className="p-2">Name</th>
                <th className="p-2">Target</th>
                <th className="p-2">Started</th>
                <th className="p-2">Finished</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 p-4">No scans yet.</td></tr>
              )}
              {scans.map((scan: any) => (
                <tr key={scan.scan_id} className="border-b border-gray-700">
                  <td className="p-2 text-coolWhite">{scan.name || scan.scan_id}</td>
                  <td className="p-2 text-coolWhite">{scan.target}</td>
                  <td className="p-2 text-coolWhite">{scan.started ? new Date(scan.started).toLocaleString() : "-"}</td>
                  <td className="p-2 text-coolWhite">{scan.finished ? new Date(scan.finished).toLocaleString() : "Not yet"}</td>
                  <td className="p-2">
                    {scan.status === "finished" ? (
                      <span className="text-green-400 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Finished</span>
                    ) : scan.status === "error" ? (
                      <span className="text-red-400 flex items-center"><XCircle className="w-4 h-4 mr-1" />Error</span>
                    ) : (
                      <span className="text-yellow-400 flex items-center"><Loader className="w-4 h-4 mr-1 animate-spin" />{scan.status}</span>
                    )}
                  </td>
                  <td className="p-2">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs mr-2"
                      onClick={() => fetchResults(scan.scan_id)}
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <div className="text-coolWhite flex items-center"><Loader className="w-5 h-5 mr-2 animate-spin" />Loading...</div>}
      {results && (
        <div className="bg-darkGray p-6 rounded-lg shadow-md mt-8">
          <h3 className="text-lg font-semibold text-coolWhite mb-2">Scan Results</h3>
          <pre className="text-xs text-gray-200 bg-gray-900 rounded p-4 overflow-x-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

export default OsintEngine;
