import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader, List, CheckCircle, XCircle } from "lucide-react";

const API_BASE = "/api/spiderfoot";

const OsintEngine = () => {
  const [target, setTarget] = useState("");
  const [scanName, setScanName] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [scanType, setScanType] = useState<string>("all");

  // Predefined module sets for scan types (example, adjust as needed)
  const moduleSets: Record<string, string[]> = {
    all: [], // All modules (empty means all)
    footprint: ["sfp_dnsresolve", "sfp_whois", "sfp_ipinfo", "sfp_shodan"],
    investigate: ["sfp_abuseipdb", "sfp_riskiq", "sfp_spamhaus", "sfp_alienvault"],
    passive: ["sfp_dnsresolve", "sfp_whois", "sfp_socialprofiles"]
  };
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

  // Update selected modules when scan type changes (unless custom)
  useEffect(() => {
    setSelectedModules(moduleSets[scanType] || []);
  }, [scanType]);

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
        body: JSON.stringify({ target, modules: selectedModules, name: scanName, scan_type: scanType })
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
        <label className="block mb-2 text-coolWhite font-semibold">Scan Type</label>
        <div className="flex flex-wrap gap-4 mb-4">
          {[
            { value: "all", label: "All", desc: "Get anything and everything about the target." },
            { value: "footprint", label: "Footprint", desc: "Understand what information this target exposes to the Internet." },
            { value: "investigate", label: "Investigate", desc: "Best for when you suspect the target to be malicious but need more information." },
            { value: "passive", label: "Passive", desc: "When you don't want the target to even suspect they are being investigated." }
          ].map(opt => (
            <label key={opt.value} className={`flex items-center px-3 py-2 rounded cursor-pointer border-2 ${scanType === opt.value ? 'border-blue-500 bg-blue-100' : 'border-gray-600 bg-gray-800'} transition-all`}>
              <input
                type="radio"
                name="scanType"
                value={opt.value}
                checked={scanType === opt.value}
                onChange={() => setScanType(opt.value)}
                className="mr-2"
              />
              <span className="font-bold mr-2 text-black">{opt.label}</span>
              <span className="text-xs text-gray-700">{opt.desc}</span>
            </label>
          ))}
        </div>
        <label className="block mb-2 text-coolWhite font-semibold">Scan Name</label>
        <input
          type="text"
          value={scanName}
          onChange={e => setScanName(e.target.value)}
          className="w-full p-2 rounded bg-midGray text-black mb-4"
          placeholder="Enter a name for this scan (optional)"
        />
        <label className="block mb-2 text-coolWhite font-semibold">Target</label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="w-full p-2 rounded bg-midGray text-black mb-4"
          placeholder="Enter domain, IP, or username"
          required
        />
        {/* No custom module selection, only scan type controls modules */}
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
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                      onClick={() => fetchResults(scan.scan_id)}
                    >
                      View Results
                    </button>
                    {scan.status === "running" && (
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                        onClick={async () => {
                          setLoading(true);
                          setError(null);
                          try {
                            await fetch(`${API_BASE}/scan/${scan.scan_id}/abort`, { method: "POST" });
                            fetchScans();
                          } catch {
                            setError("Failed to abort scan");
                          }
                          setLoading(false);
                        }}
                      >
                        Stop
                      </button>
                    )}
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
