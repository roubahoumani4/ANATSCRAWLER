import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader, List, CheckCircle, XCircle, PlusCircle, FolderSearch } from "lucide-react";

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
      {/* Header Section */}
      <div className="flex items-center gap-8 mb-10">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-blue-500" />
          <h2 className="text-2xl font-bold text-coolWhite">New Scan</h2>
        </div>
        <div className="flex items-center gap-2">
          <FolderSearch className="w-7 h-7 text-green-500" />
          <h2 className="text-2xl font-bold text-coolWhite">Scans</h2>
        </div>
      </div>

      {/* New Scan Page Main Content (SpiderFoot style) */}
      <div className="bg-white rounded-lg shadow p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <label className="block mb-2 text-gray-700 font-semibold">Scan Name</label>
            <input
              type="text"
              value={scanName}
              onChange={e => setScanName(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 mb-4 text-black"
              placeholder="The name of this scan."
            />
            <label className="block mb-2 text-gray-700 font-semibold">Scan Target</label>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 mb-4 text-black"
              placeholder="The target of your scan."
              required
            />
          </div>
          <div className="flex-1 bg-gray-50 rounded p-4 text-xs text-gray-700 border border-gray-200">
            <div className="mb-2 font-semibold flex items-center gap-1">
              <span className="text-yellow-600">&#9888;</span> Your scan target may be one of the following. SpiderFoot will automatically detect the target type based on the format of your input:
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <div><b>Domain Name:</b> <span className="italic">e.g. example.com</span></div>
                <div><b>IPv4 Address:</b> <span className="italic">e.g. 1.2.3.4</span></div>
                <div><b>IPv6 Address:</b> <span className="italic">e.g. 2606:4700:4700::1111</span></div>
                <div><b>Hostname/Sub-domain:</b> <span className="italic">e.g. abc.example.com</span></div>
                <div><b>Subnet:</b> <span className="italic">e.g. 1.2.3.0/24</span></div>
                <div><b>Bitcoin Address:</b> <span className="italic">e.g. 1HesYJSP1QqcyPEjnQ9vZBL1wujruNGe7R</span></div>
              </div>
              <div>
                <div><b>E-mail address:</b> <span className="italic">e.g. bob@example.com</span></div>
                <div><b>Phone Number:</b> <span className="italic">e.g. +12345678901 (E.164 format)</span></div>
                <div><b>Human Name:</b> <span className="italic">e.g. "John Smith" (must be in quotes)</span></div>
                <div><b>Username:</b> <span className="italic">e.g. "jsmith2000" (must be in quotes)</span></div>
                <div><b>Network ASN:</b> <span className="italic">e.g. 1234</span></div>
              </div>
            </div>
          </div>
        </div>
        {/* Scan Type Section */}
        <div className="mt-8">
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-8">
              <button type="button" className="py-2 px-4 border-b-2 border-blue-500 font-semibold text-blue-700 bg-white">By Use Case</button>
              <button type="button" className="py-2 px-4 text-gray-400 cursor-not-allowed" disabled>By Required Data</button>
              <button type="button" className="py-2 px-4 text-gray-400 cursor-not-allowed" disabled>By Module</button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { value: "all", label: "All", desc: <><b>Get anything and everything about the target.</b><br />All SpiderFoot modules will be enabled (slow) but every possible piece of information about the target will be obtained and analysed.</> },
              { value: "footprint", label: "Footprint", desc: <><b>Understand what information this target exposes to the Internet.</b><br />Gain an understanding about the target's network perimeter, associated identities and other information that is obtained through a lot of web crawling and search engine use.</> },
              { value: "investigate", label: "Investigate", desc: <><b>Best for when you suspect the target to be malicious but need more information.</b><br />Some basic footprinting will be performed in addition to querying of blacklists and other sources that may have information about your target's maliciousness.</> },
              { value: "passive", label: "Passive", desc: <><b>When you don't want the target to even suspect they are being investigated.</b><br />As much information will be gathered without touching the target or their affiliates, therefore only modules that do not touch the target will be enabled.</> }
            ].map(opt => (
              <label key={opt.value} className={`flex items-start gap-3 px-4 py-3 rounded cursor-pointer border-2 ${scanType === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} transition-all`}>
                <input
                  type="radio"
                  name="scanType"
                  value={opt.value}
                  checked={scanType === opt.value}
                  onChange={() => setScanType(opt.value)}
                  className="mt-1 mr-2"
                />
                <div>
                  <span className="font-bold mr-2 text-black">{opt.label}</span>
                  <span className="text-xs text-gray-700">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold flex items-center" disabled={loading}>
          <Search className="w-4 h-4 mr-2" /> Run Scan Now
        </button>
        {error && <div className="text-red-400 mt-2">{error}</div>}
      </div>

      {/* The rest of the page (scans table, results, etc.) can be added below as a separate section if needed */}
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
