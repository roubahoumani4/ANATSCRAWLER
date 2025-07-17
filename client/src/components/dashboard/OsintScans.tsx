import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader, List, XCircle, Activity, Search } from "lucide-react";
import BackButton from "../ui/back-button";

const API_BASE = "/api/spiderfoot";

const OsintScans = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('none');
  const [sortConfig, setSortConfig] = useState<{ column: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = () => {
    fetch(`${API_BASE}/scans`)
      .then(res => res.json())
      .then(data => setScans(data.scans || []));
  };

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

  React.useEffect(() => { setPage(1); }, [filterStatus, rowsPerPage]);

  return (
    <>
      <div className="mb-6">
        <BackButton color="cyan" to="/osint" />
      </div>
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
          }}><Search className="w-5 h-5" /></button>
          <button className="bg-red-700 hover:bg-red-600 text-white p-2 rounded disabled:opacity-50" title="Stop" disabled={selectedRows.size === 0} onClick={async () => {
            for (const scanId of Array.from(selectedRows)) {
              await fetch(`${API_BASE}/scan/${scanId}/abort`, { method: "POST" });
            }
            fetchScans();
          }}><XCircle className="w-5 h-5" /></button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded disabled:opacity-50" title="Refresh" disabled={selectedRows.size === 0} onClick={fetchScans}><Activity className="w-5 h-5" /></button>
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
              {/* ...columns... */}
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
                <td className="p-2 text-blue-400 underline cursor-pointer" title={scan.name || scan.scan_id}>{scan.name || scan.scan_id}</td>
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
                    <button className="bg-purple-700 hover:bg-purple-600 text-white p-1 rounded" title="View Results"><List className="w-4 h-4" /></button>
                    {scan.status === "running" && (
                      <button className="bg-red-700 hover:bg-red-600 text-white p-1 rounded" title="Stop"><XCircle className="w-4 h-4" /></button>
                    )}
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
    </>
  );
};

export default OsintScans;
