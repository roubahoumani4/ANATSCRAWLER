import React, { useState, useEffect } from "react";
import GraphView from "./GraphView";
import SummaryBarChart from "./SummaryBarChart";
import CorrelationsTable from "./CorrelationsTable";
import BrowseTable from "./BrowseTable";
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
  // Table state
  const [filterStatus, setFilterStatus] = useState<string>('none');
  // Sorting state: { column: string, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState<{ column: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  // Fetch scan results (with polling for live updates)
  const fetchResults = async (scanId: string) => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scan/${scanId}/results`);
      const data = await res.json();
      setResults(data);
      // If scan is running, start polling for live updates
      if (data.status === 'running' || data.status === 'abort-requested') {
        setActiveScanId(scanId);
      } else {
        setActiveScanId(null);
      }
    } catch {
      setError("Failed to fetch results");
    }
    setLoading(false);
  };

  // Poll for scan results if scan is running
  useEffect(() => {
    if (!activeScanId) return;
    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/scan/${activeScanId}/results`);
        const data = await res.json();
        if (!isMounted) return;
        setResults(data);
        if (data.status === 'running' || data.status === 'abort-requested') {
          pollTimeout = setTimeout(poll, 2000); // poll every 2s
        } else {
          setActiveScanId(null);
        }
      } catch {
        // Optionally handle error
        setActiveScanId(null);
      }
    };
    poll();
    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [activeScanId]);

  // Tab state: "new" or "scans"
  const [activeTab, setActiveTab] = useState<'new' | 'scans'>('new');


  // Filtering (status only)
  const filteredScans = scans.filter(scan => {
    if (filterStatus !== 'none') {
      if (filterStatus === 'aborted') {
        if (!(scan.status === 'aborted' || scan.status === 'abort-requested')) return false;
      } else if (scan.status !== filterStatus) return false;
    }
    return true;
  });

  // Sorting
  const sortFns: Record<string, (a: any, b: any) => number> = {
    name: (a, b) => ((a.name || a.scan_id) || '').localeCompare((b.name || b.scan_id) || ''),
    target: (a, b) => (a.target || '').localeCompare(b.target || ''),
    started: (a, b) => new Date(a.started || 0).getTime() - new Date(b.started || 0).getTime(),
    finished: (a, b) => new Date(a.finished || 0).getTime() - new Date(b.finished || 0).getTime(),
    status: (a, b) => (a.status || '').localeCompare(b.status || ''),
    elements: (a, b) => (a.elements || 0) - (b.elements || 0),
    correlations: (a, b) => {
      const sum = (obj: any) => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          return Object.values(obj).reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : 0), 0);
        }
        return 0;
      };
      return sum(a.correlations) - sum(b.correlations);
    }
  };
  let sortedScans = [...filteredScans];
  if (sortConfig && sortFns[sortConfig.column]) {
    sortedScans.sort((a, b) => {
      const res = sortFns[sortConfig.column](a, b);
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredScans.length / rowsPerPage));
  const paginatedScans = sortedScans.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Row selection
  const allSelected = paginatedScans.length > 0 && paginatedScans.every(scan => selectedRows.has(scan.scan_id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedScans.forEach(scan => newSet.delete(scan.scan_id));
        return newSet;
      });
    } else {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedScans.forEach(scan => newSet.add(scan.scan_id));
        return newSet;
      });
    }
  };
  const toggleRow = (scanId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scanId)) newSet.delete(scanId); else newSet.add(scanId);
      return newSet;
    });
  };

  // Reset page if filter or rowsPerPage changes
  React.useEffect(() => { setPage(1); }, [filterStatus, rowsPerPage]);

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
                  className={`flex items-center gap-0 px-4 py-3 rounded cursor-pointer border-2 ${scanType === opt.value ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-darkGray'} transition-all`}
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
                  <div className="flex flex-row w-full items-center">
                    <div className="w-32 min-w-[8rem] max-w-[8rem] font-bold text-coolWhite text-left">{opt.label}</div>
                    <div className="flex flex-col flex-1 pl-4">
                      <span className="font-semibold text-coolWhite mb-1">{opt.title}</span>
                      <span className="text-xs text-gray-300 mt-1">{opt.desc}</span>
                    </div>
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
          <h3 className="text-xl font-semibold text-coolWhite mb-4">Scans</h3>
          {/* Table Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-coolWhite">Status:</span>
              <select
                className="bg-darkGray border border-gray-700 text-coolWhite rounded px-3 py-1 focus:outline-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="none">All</option>
                <option value="finished">Finished</option>
                <option value="aborted">Aborted</option>
                <option value="running">Running</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-700 hover:bg-blue-600 text-white p-2 rounded disabled:opacity-50" title="Rerun" disabled={selectedRows.size === 0} onClick={async () => {
                for (const scanId of Array.from(selectedRows)) {
                  const scan = scans.find(s => s.scan_id === scanId);
                  if (scan) {
                    await fetch(`${API_BASE}/scan`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        target: scan.target,
                        modules: scan.modules || [],
                        name: (scan.name || scan.scan_id) + " (rerun)",
                        scan_type: scan.scan_type || "all"
                      })
                    });
                  }
                }
                fetchScans();
              }}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.5 19A9 9 0 1 1 19 5.5" /></svg></button>
              <button className="bg-red-700 hover:bg-red-600 text-white p-2 rounded disabled:opacity-50" title="Stop" disabled={selectedRows.size === 0} onClick={async () => {
                for (const scanId of Array.from(selectedRows)) {
                  await fetch(`${API_BASE}/scan/${scanId}/abort`, { method: "POST" });
                }
                fetchScans();
              }}><XCircle className="w-5 h-5" /></button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded disabled:opacity-50" title="Refresh" disabled={selectedRows.size === 0} onClick={fetchScans}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.5 19A9 9 0 1 1 19 5.5" /></svg></button>
              <button className="bg-green-700 hover:bg-green-600 text-white p-2 rounded disabled:opacity-50" title="Export" disabled={selectedRows.size === 0} onClick={() => {
                const exportData = scans.filter(scan => selectedRows.has(scan.scan_id));
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scans_export_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 100);
              }}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" /></svg></button>
              <button className="bg-red-700 hover:bg-red-600 text-white p-2 rounded disabled:opacity-50" title="Delete Selected" disabled={selectedRows.size === 0} onClick={() => {
                setScans(scans.filter(scan => !selectedRows.has(scan.scan_id)));
                setSelectedRows(new Set());
              }}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg shadow-lg bg-darkGray">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 bg-gray-800">
                  <th className="p-2 text-center">
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'target', label: 'Target' },
                    { key: 'started', label: 'Started' },
                    { key: 'finished', label: 'Finished' },
                    { key: 'status', label: 'Status', center: true },
                    { key: 'elements', label: 'Elements', center: true },
                    { key: 'correlations', label: 'Correlations', center: true }
                  ].map(col => (
                    <th
                      key={col.key}
                      className={`p-2 ${col.center ? 'text-center' : 'text-left'} select-none cursor-pointer group`}
                      onClick={() => setSortConfig(prev => prev && prev.column === col.key ? { column: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { column: col.key, direction: 'desc' })}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <span className="flex flex-col text-xs">
                          <span className={`transition-colors ${sortConfig?.column === col.key && sortConfig.direction === 'asc' ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-300'}`}>▲</span>
                          <span className={`transition-colors -mt-1 ${sortConfig?.column === col.key && sortConfig.direction === 'desc' ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-300'}`}>▼</span>
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedScans.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-gray-500 p-4">No scans found.</td></tr>
                )}
                {paginatedScans.map((scan: any, idx: number) => (
                  <motion.tr key={scan.scan_id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors" initial={{ opacity: 0, x: 30 * (idx + 1) }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={selectedRows.has(scan.scan_id)}
                        onChange={() => toggleRow(scan.scan_id)}
                      />
                    </td>
                    <td className="p-2 text-blue-400 underline cursor-pointer" title={scan.name || scan.scan_id} onClick={() => fetchResults(scan.scan_id)}>{scan.name || scan.scan_id}</td>
                    <td className="p-2 text-coolWhite">{scan.target}</td>
                    <td className="p-2 text-coolWhite">{scan.started ? new Date(scan.started).toLocaleString() : "-"}</td>
                    <td className="p-2 text-coolWhite">{scan.finished ? new Date(scan.finished).toLocaleString() : "Not yet"}</td>
                    <td className="p-2 text-center">
                      {scan.status === "finished" ? (
                        <span className="bg-green-700/80 text-green-200 px-3 py-1 rounded-full text-xs font-bold">FINISHED</span>
                      ) : scan.status === "error" ? (
                        <span className="bg-red-700/80 text-red-200 px-3 py-1 rounded-full text-xs font-bold">ERROR</span>
                      ) : scan.status === "aborted" ? (
                        <span className="bg-yellow-700/80 text-yellow-200 px-3 py-1 rounded-full text-xs font-bold">ABORTED</span>
                      ) : scan.status === "abort-requested" ? (
                        <span className="bg-yellow-900/80 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">ABORT-REQUESTED</span>
                      ) : (
                        <span className="bg-blue-700/80 text-blue-200 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center"><Loader className="w-4 h-4 mr-1 animate-spin" />{scan.status?.toUpperCase()}</span>
                      )}
                    </td>
                    <td className="p-2 text-center text-coolWhite">{scan.elements ?? '-'}</td>
                    <td className="p-2 text-center">
                      {/* Example: { errors: 0, warnings: 6, info: 1 } */}
                      {scan.correlations ? (
                        <div className="flex gap-1 justify-center">
                      {Object.entries(scan.correlations).map(([key, val], i) => (
                        <span key={key} className={`px-2 py-0.5 rounded-full text-xs font-bold ${key === 'errors' ? 'bg-red-700/80 text-red-200' : key === 'warnings' ? 'bg-yellow-700/80 text-yellow-200' : 'bg-blue-700/80 text-blue-200'}`}>{typeof val === 'number' ? val : '-'}</span>
                      ))}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button className="bg-purple-700 hover:bg-purple-600 text-white p-1 rounded" title="View Results" onClick={() => fetchResults(scan.scan_id)}><List className="w-4 h-4" /></button>
                        {scan.status === "running" && (
                          <button className="bg-red-700 hover:bg-red-600 text-white p-1 rounded" title="Stop" onClick={async () => {
                            setLoading(true);
                            setError(null);
                            try {
                              await fetch(`${API_BASE}/scan/${scan.scan_id}/abort`, { method: "POST" });
                              fetchScans();
                            } catch {
                              setError("Failed to abort scan");
                            }
                            setLoading(false);
                          }}><XCircle className="w-4 h-4" /></button>
                        )}
                        <button className="bg-green-700 hover:bg-green-600 text-white p-1 rounded" title="Download"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" /></svg></button>
                        <button className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded" title="Refresh" onClick={fetchScans}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.5 19A9 9 0 1 1 19 5.5" /></svg></button>
                        <button className="bg-red-700 hover:bg-red-600 text-white p-1 rounded" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-b-lg border-t border-gray-700">
              <div className="flex gap-2">
                <button className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600" title="First Page" onClick={() => setPage(1)} disabled={page === 1}>&#171;</button>
                <button className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600" title="Previous Page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&#8249;</button>
                <span className="text-coolWhite text-xs">Page {page} of {totalPages}</span>
                <button className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600" title="Next Page" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&#8250;</button>
                <button className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600" title="Last Page" onClick={() => setPage(totalPages)} disabled={page === totalPages}>&#187;</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-coolWhite text-xs">Rows per page:</span>
                <select
                  className="bg-darkGray border border-gray-700 text-coolWhite rounded px-2 py-1 text-xs focus:outline-none"
                  value={rowsPerPage}
                  onChange={e => setRowsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-coolWhite text-xs">Scans {(filteredScans.length === 0 ? 0 : ((page - 1) * rowsPerPage + 1))} - {Math.min(page * rowsPerPage, filteredScans.length)} / {filteredScans.length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}



      {/* Scan Results Modal/Section with Tabs */}
      {results && (
        <motion.div className="bg-darkGray p-6 rounded-lg shadow-md mt-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <ScanResultsTabs results={results} />
        </motion.div>
      )}
    </motion.div>
  );
}

export default OsintEngine;

// --- Scan Results Tabs Component ---
function ScanResultsTabs({ results }: { results: any }) {
  const [tab, setTab] = React.useState("summary");
  const [polling, setPolling] = React.useState(false);

  // --- Helper functions ---
  function getCorrelationsSummary() {
    if (!results || !results.correlations) return { high: 0, medium: 0, low: 0, info: 0 };
    if (Array.isArray(results.correlations)) {
      return results.correlations.reduce((acc: any, c: any) => {
        const risk = (c.risk || '').toLowerCase();
        if (risk === 'high') acc.high++;
        else if (risk === 'medium') acc.medium++;
        else if (risk === 'low') acc.low++;
        else acc.info++;
        return acc;
      }, { high: 0, medium: 0, low: 0, info: 0 });
    } else if (typeof results.correlations === 'object') {
      return {
        high: results.correlations.high || 0,
        medium: results.correlations.medium || 0,
        low: results.correlations.low || 0,
        info: results.correlations.info || 0
      };
    }
    return { high: 0, medium: 0, low: 0, info: 0 };
  }

  function getSummaryStats() {
    return {
      total: results?.elements || results?.summary?.total || 0,
      unique: results?.summary?.unique || 0,
      status: results?.status || results?.summary?.status || '',
      errors: results?.summary?.errors || 0
    };
  }

  function getBrowseData() {
    return results?.browse || results?.data || results?.elements || [];
  }

  function getCorrelationsTable() {
    if (Array.isArray(results.correlations)) return results.correlations;
    if (typeof results.correlations === 'object' && results.correlations !== null) {
      return Object.entries(results.correlations).map(([k, v]: [string, any]) => ({ correlation: k, ...v }));
    }
    return [];
  }

  function getGraphData() {
    return results?.graph || results?.network || null;
  }

  // --- Live polling for running scans ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (results?.status === 'running') {
      setPolling(true);
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/spiderfoot/scan/${results.scan_id}/results`);
          const data = await res.json();
          if (data) {
            // Only update if status or data changed
            if (JSON.stringify(data) !== JSON.stringify(results)) {
              Object.assign(results, data); // Mutate in place for modal
              setTab(t => t); // Force re-render
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000);
    } else {
      setPolling(false);
    }
    return () => { if (interval) clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results?.status, results?.scan_id]);

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        {[
          { key: "summary", label: "Summary" },
          { key: "correlations", label: "Correlations" },
          { key: "browse", label: "Browse" },
          { key: "graph", label: "Graph" }
        ].map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 font-semibold rounded-t ${tab === t.key ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:text-blue-300'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'summary' && results?.status === 'running' && (
              <span className="ml-2 animate-pulse text-xs text-blue-400">(Live)</span>
            )}
          </button>
        ))}
      </div>

      {/* --- Summary Tab --- */}
      {tab === "summary" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded p-4 flex flex-col gap-2 border border-gray-800">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-2xl font-bold text-coolWhite">{getSummaryStats().total}</div>
          </div>
          <div className="bg-gray-900 rounded p-4 flex flex-col gap-2 border border-gray-800">
            <div className="text-xs text-gray-400">Unique</div>
            <div className="text-2xl font-bold text-coolWhite">{getSummaryStats().unique}</div>
          </div>
          <div className="bg-gray-900 rounded p-4 flex flex-col gap-2 border border-gray-800">
            <div className="text-xs text-gray-400">Status</div>
            <div className="text-2xl font-bold text-coolWhite">{getSummaryStats().status}
              {results?.status === 'running' && (
                <span className="ml-2 animate-spin inline-block align-middle"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span>
              )}
            </div>
          </div>
          <div className="bg-gray-900 rounded p-4 flex flex-col gap-2 border border-gray-800">
            <div className="text-xs text-gray-400">Errors</div>
            <div className="text-2xl font-bold text-red-400">{getSummaryStats().errors}</div>
          </div>
          <div className="md:col-span-2 bg-gray-900 rounded p-4 border border-gray-800">
            <div className="text-xs text-gray-400 mb-2">Correlations</div>
            <div className="flex gap-2">
              {Object.entries(getCorrelationsSummary()).map(([risk, count]) => (
                <span key={String(risk)} className={`px-3 py-1 rounded-full text-xs font-bold ${risk === 'high' ? 'bg-red-700/80 text-red-200' : risk === 'medium' ? 'bg-yellow-700/80 text-yellow-200' : risk === 'low' ? 'bg-blue-700/80 text-blue-200' : 'bg-green-700/80 text-green-200'}`}>{String(risk).toUpperCase()}: {String(count)}</span>
              ))}
            </div>
          </div>
          {/* --- Bar Chart --- */}
          <div className="md:col-span-3 bg-gray-900 rounded p-4 border border-gray-800 mt-4">
            <SummaryBarChart data={getBrowseData()} />
          </div>
        </div>
      )}

      {/* --- Correlations Tab --- */}
      {tab === "correlations" && (
        <CorrelationsTable correlations={getCorrelationsTable()} />
      )}

      {/* --- Browse Tab --- */}
      {tab === "browse" && (
        <BrowseTable data={getBrowseData()} />
      )}

      {/* --- Graph Tab --- */}
      {tab === "graph" && (
        <div className="bg-gray-900 rounded p-4 border border-gray-800 min-h-[300px] flex items-center justify-center">
          <GraphView data={getGraphData()} />
        </div>
      )}
    </div>
  );
}





