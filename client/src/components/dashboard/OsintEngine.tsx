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

  // Tab state: "new" or "scans"
  const [activeTab, setActiveTab] = useState<'new' | 'scans'>('new');

  return (
    <motion.div
      className="p-8 max-w-5xl mx-auto min-h-screen"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Tabs Header */}
      <motion.div
        className="flex items-center gap-2 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <button
          className={`flex items-center gap-2 px-5 py-2 rounded-t-lg font-bold text-lg border-b-4 transition-all ${activeTab === 'new' ? 'border-blue-500 text-blue-400 bg-darkGray' : 'border-transparent text-gray-400 bg-transparent hover:text-blue-300'}`}
          onClick={() => setActiveTab('new')}
        >
          <PlusCircle className="w-6 h-6" /> New Scan
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-2 rounded-t-lg font-bold text-lg border-b-4 transition-all ${activeTab === 'scans' ? 'border-green-500 text-green-400 bg-darkGray' : 'border-transparent text-gray-400 bg-transparent hover:text-green-300'}`}
          onClick={() => setActiveTab('scans')}
        >
          <FolderSearch className="w-6 h-6" /> Scans
        </button>
      </motion.div>

      {/* New Scan Tab */}
      {activeTab === 'new' && (
        <motion.form
          onSubmit={startScan}
          className="w-full flex flex-col gap-8"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div className="flex flex-col md:flex-row gap-8 w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="flex-1">
              <label className="block mb-2 text-coolWhite font-semibold">Scan Name</label>
              <input
                type="text"
                value={scanName}
                onChange={e => setScanName(e.target.value)}
                className="w-full p-3 rounded bg-darkGray border border-gray-700 mb-4 text-coolWhite placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="The name of this scan."
              />
              <label className="block mb-2 text-coolWhite font-semibold">Scan Target</label>
              <input
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full p-3 rounded bg-darkGray border border-gray-700 mb-4 text-coolWhite placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="The target of your scan."
                required
              />
            </div>
            <motion.div className="flex-1 text-sm text-coolWhite bg-darkGray border border-gray-700 rounded p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="mb-2 font-semibold flex items-center gap-1 text-blue-400">
                <span className="text-yellow-400">&#9888;</span> Your scan target may be a domain, IP, email, phone, username, subnet, or bitcoin address. Format will be auto-detected.
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs">
                <div>
                  <div><b>Domain Name:</b> <span className="italic">example.com</span></div>
                  <div><b>IPv4:</b> <span className="italic">1.2.3.4</span></div>
                  <div><b>IPv6:</b> <span className="italic">2606:4700:4700::1111</span></div>
                  <div><b>Hostname:</b> <span className="italic">abc.example.com</span></div>
                  <div><b>Subnet:</b> <span className="italic">1.2.3.0/24</span></div>
                  <div><b>Bitcoin:</b> <span className="italic">1HesYJSP1QqcyPEjnQ9vZBL1wujruNGe7R</span></div>
                </div>
                <div>
                  <div><b>Email:</b> <span className="italic">bob@example.com</span></div>
                  <div><b>Phone:</b> <span className="italic">+12345678901</span></div>
                  <div><b>Name:</b> <span className="italic">"John Smith"</span></div>
                  <div><b>Username:</b> <span className="italic">"jsmith2000"</span></div>
                  <div><b>ASN:</b> <span className="italic">1234</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          {/* Scan Type Section */}
          <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div className="flex flex-col gap-4">
              {[
                {
                  value: "all",
                  label: "All",
                  title: "Get anything and everything about the target.",
                  desc: "All modules will be enabled (slow) and every possible piece of information about the target will be obtained and analysed."
                },
                {
                  value: "footprint",
                  label: "Footprint",
                  title: "Understand what information this target exposes to the Internet.",
                  desc: "Gain an understanding about the target's network perimeter, associated identities and other information that is obtained through a lot of web crawling and search engine use."
                },
                {
                  value: "investigate",
                  label: "Investigate",
                  title: "Best for when you suspect the target to be malicious but need more information.",
                  desc: "Some basic footprinting will be performed in addition to querying of blacklists and other sources that may have information about your target's maliciousness."
                },
                {
                  value: "passive",
                  label: "Passive",
                  title: "When you don't want the target to even suspect they are being investigated.",
                  desc: "As much information will be gathered without touching the target or their affiliates, therefore only modules that do not touch the target will be enabled."
                }
              ].map((opt, idx) => (
                <motion.label
                  key={opt.value}
                  className={`flex items-start gap-3 px-4 py-3 rounded cursor-pointer border-2 ${scanType === opt.value ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-darkGray'} transition-all`}
                  initial={{ opacity: 0, x: 30 * (idx + 1) }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.07, duration: 0.4, ease: 'easeOut' }}
                >
                  <input
                    type="radio"
                    name="scanType"
                    value={opt.value}
                    checked={scanType === opt.value}
                    onChange={() => setScanType(opt.value)}
                    className="mt-1 mr-2 accent-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-coolWhite mb-1">{opt.label} <span className="font-semibold">{opt.title}</span></span>
                    <span className="text-xs text-gray-300 ml-6">{opt.desc}</span>
                  </div>
                </motion.label>
              ))}
            </div>
          </motion.div>
          <motion.button
            type="submit"
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-bold flex items-center w-fit"
            disabled={loading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <Search className="w-4 h-4 mr-2" /> Run Scan
          </motion.button>
          {error && <motion.div className="text-red-400 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{error}</motion.div>}
        </motion.form>
      )}

      {/* Scans Tab */}
      {activeTab === 'scans' && (
        <motion.div className="mb-8 w-full" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <h3 className="text-xl font-semibold text-coolWhite mb-4">Your Scans</h3>
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
                {scans.map((scan: any, idx: number) => (
                  <motion.tr key={scan.scan_id} className="border-b border-gray-700" initial={{ opacity: 0, x: 30 * (idx + 1) }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}>
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Scan Results Modal/Section */}
      {results && (
        <motion.div className="bg-darkGray p-6 rounded-lg shadow-md mt-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h3 className="text-lg font-semibold text-coolWhite mb-2">Scan Results</h3>
          <pre className="text-xs text-gray-200 bg-gray-900 rounded p-4 overflow-x-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </motion.div>
      )}

      {loading && <motion.div className="text-coolWhite flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}><Loader className="w-5 h-5 mr-2 animate-spin" />Loading...</motion.div>}
    </motion.div>
  );
};

export default OsintEngine;
