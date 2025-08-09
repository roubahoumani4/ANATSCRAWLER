
import React, { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts';

const TABS = ["Summary", "Correlations", "Browse", "Graph", "Scan Settings", "Log"];


const ScanDetailsPage = () => {
  // Use wouter's useRoute to extract scanId from the URL
  const [match, params] = useRoute("/osint-engine/scans/:scanId");
  const scanId = params?.scanId;
  const [, navigate] = useLocation();
  if (!scanId) {
    return <div className="p-8 text-red-400">Invalid scan ID.</div>;
  }
  console.log('ScanDetailsPage mounted, scanId:', scanId);
  const [tab, setTab] = useState("Summary");
  const [scanStatus, setScanStatus] = useState<any>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanLog, setScanLog] = useState<string>("");
  const [graphData, setGraphData] = useState<any[]>([]);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphEdges, setGraphEdges] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'canvas'>('table');
  const [filterType, setFilterType] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
  const [correlations, setCorrelations] = useState<any>(null);
  const [misp, setMisp] = useState<any>(null);
  const [mispLoading, setMispLoading] = useState<boolean>(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(5000);

  const abortScan = useCallback(async () => {
    try {
      await fetch(`/api/spiderfoot/scan/${scanId}/abort`, { method: 'POST' });
      await fetchScanData();
    } catch (e) {
      console.error('Failed to abort scan', e);
    }
  }, [scanId, fetchScanData]);

  const deleteScan = useCallback(async () => {
    try {
      await fetch(`/api/spiderfoot/scan/${scanId}/delete`, { method: 'POST' });
      navigate('/osint-engine/scans');
    } catch (e) {
      console.error('Failed to delete scan', e);
    }
  }, [scanId, navigate]);

  const fetchScanData = useCallback(async () => {
    try {
      const [status, summary, correlations, browse, graph, logs] = await Promise.all([
        fetch(`/api/spiderfoot/scan/${scanId}/status`).then(res => res.json()).catch(() => null),
        fetch(`/api/spiderfoot/scan/${scanId}/summary`).then(res => res.json()).catch(() => []),
        fetch(`/api/spiderfoot/scan/${scanId}/correlationsummary`).then(res => res.json()).catch(() => []),
        fetch(`/api/spiderfoot/scan/${scanId}/browse`).then(res => res.json()).catch(() => []),
        fetch(`/api/spiderfoot/scan/${scanId}/graph`).then(res => res.json()).catch(() => []),
        fetch(`/api/spiderfoot/scan/${scanId}/logs`).then(res => res.json()).catch(() => [])
      ]);

      // Normalize scan status: server should return an object, but tolerate array shape
      const normalizedStatus = Array.isArray(status)
        ? {
            name: status[0] ?? scanId,
            target: status[1] ?? '',
            created: status[2] ?? 0,
            started: status[3] ?? 0,
            finished: status[4] ?? 0,
            status: status[5] ?? 'UNKNOWN'
          }
        : (status || {});
      setScanStatus(normalizedStatus);
      setScanResults({ summary, correlations, browse, graph });
      setCorrelations(correlations);
      // Normalize graph data: ensure array and build nodes/edges
      const gArr = Array.isArray(graph) ? graph : [];
      setGraphData(gArr);
      const nodeMap = new Map<string, { id: string; label: string; type?: string; risk?: number }>();
      const edges: { from: string; to: string }[] = [];
      for (const ev of gArr) {
        const id = String(ev.id || ev.hash || '');
        const src = String(ev.source || '');
        if (!id) continue;
        if (!nodeMap.has(id)) nodeMap.set(id, { id, label: ev.label || ev.data || id, type: ev.type, risk: ev.risk });
        if (src) {
          if (!nodeMap.has(src)) nodeMap.set(src, { id: src, label: ev.source_data || src, type: ev.source_type });
          edges.push({ from: src, to: id });
        }
      }
      setGraphNodes(Array.from(nodeMap.values()));
      setGraphEdges(edges);

      // Fetch MISP enrichment (non-blocking)
      try {
        setMispLoading(true);
        const enrich = await fetch(`/api/spiderfoot/scan/${scanId}/enrich/misp`).then(r => r.json());
        setMisp(enrich);
      } catch {
        setMisp(null);
      } finally {
        setMispLoading(false);
      }
      
      // Format logs properly
      let formattedLogs = "";
        if (Array.isArray(logs)) {
        formattedLogs = logs.map(l => {
          if (typeof l === 'string') return l;
          if (typeof l === 'object' && l.generated) {
            return `${l.generated} [${l.component || 'SYSTEM'}] ${l.type || 'INFO'}: ${l.message || ''}`;
          }
          return JSON.stringify(l);
        }).join('\n');
      } else if (typeof logs === 'string') {
        formattedLogs = logs;
      }
      setScanLog(formattedLogs);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scan data:', error);
      setError("Failed to load scan details");
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchScanData();
  }, [scanId, fetchScanData]);

  useEffect(() => {
    if (!refreshIntervalMs) return;
    const id = setInterval(() => {
      fetchScanData();
    }, refreshIntervalMs);
    return () => clearInterval(id);
  }, [refreshIntervalMs, fetchScanData]);

  if (loading) return <div className="p-8">Loading scan details...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!scanStatus) return <div className="p-8">No scan info found.</div>;

  // Prepare data types for bar chart (from summary)
  const summaryArr = Array.isArray(scanResults?.summary) ? scanResults.summary : [];
  const barData = summaryArr.map((row: any) => ({
    name: row[0] || row.type || row.name || 'Unknown',
    value: typeof row[3] === 'number' ? row[3] : (typeof row.total === 'number' ? row.total : 0)
  }));

  // Prepare correlations data - handle both array and object formats
  const correlationsData = Array.isArray(correlations) ? correlations : [];
  const correlationStats = correlationsData.reduce((acc: any, corr: any) => {
    // Handle different data structures
    let risk = '';
    if (Array.isArray(corr)) {
      // Array format: [risk_level, count, risk_level_again, additional_info]
      risk = (corr[0] || '').toLowerCase();
    } else if (typeof corr === 'object' && corr !== null) {
      // Object format: { risk: 'HIGH', count: 5 }
      risk = (corr.risk || corr.rule_risk || '').toLowerCase();
    } else {
      risk = String(corr || '').toLowerCase();
    }
    
    if (risk === 'high') acc.high++;
    else if (risk === 'medium') acc.medium++;
    else if (risk === 'low') acc.low++;
    else acc.info++;
    return acc;
  }, { high: 0, medium: 0, low: 0, info: 0 });

  // Prepare browse data
  const browseData = Array.isArray(scanResults?.browse) ? scanResults.browse : [];

  return (
    <div className="p-8 w-full">
      <div className="flex items-center gap-4 mb-4">
        <button className="text-blue-400 underline" onClick={() => navigate("/osint-engine/scans") }>&larr; Back</button>
        <h1 className="text-2xl font-bold">
          {scanStatus.name || scanStatus.target}
          <span className="ml-2 text-xs font-semibold text-yellow-400">{scanStatus.status}</span>
          {Array.isArray((scanStatus as any)?.modules) && (scanStatus as any).modules.length > 0 && (
            <span className="ml-3 text-xs text-gray-400">Modules: {(scanStatus as any).modules.slice(0, 6).join(', ')}{(scanStatus as any).modules.length > 6 ? '…' : ''}</span>
          )}
        </h1>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t}
              className={`px-4 py-2 rounded ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-coolWhite'}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-4 flex items-center gap-2">
          {/* Actions */}
          {(() => {
            const statusStr = String(scanStatus?.status || '').toUpperCase();
            const canAbort = ["RUNNING", "STARTING", "STARTED", "ABORT-REQUESTED"].includes(statusStr);
            const canDelete = ["FINISHED", "ERROR-FAILED", "ABORTED", "UNKNOWN"].includes(statusStr);
            return (
              <>
                <button
                  className={`bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded ${canAbort ? '' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={abortScan}
                  disabled={!canAbort}
                >
                  Abort
                </button>
                <button
                  className={`bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded ${canDelete ? '' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={deleteScan}
                  disabled={!canDelete}
                >
                  Delete
                </button>
              </>
            );
          })()}
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-xs text-gray-400">Auto-refresh:</span>
          <select
            className="bg-gray-700 text-coolWhite text-xs px-2 py-1 rounded"
            value={refreshIntervalMs}
            onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
          >
            <option value={0}>Off</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
          <button className="ml-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded" onClick={fetchScanData}>Refresh now</button>
        </div>
      </div>
      {tab === "Summary" && (
        <div>
          <div className="mb-4 flex gap-8">
            <div className="bg-gray-800 p-4 rounded">
              <div>Status: <b>{scanStatus.status}</b></div>
              <div>Started: <b>{scanStatus.started || '-'}</b></div>
              <div>Finished: <b>{scanStatus.finished || '-'}</b></div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="mb-2 font-semibold">Correlations</div>
              <div className="flex gap-2">
                <span className="bg-red-400 px-2 rounded">High {correlationStats.high || 0}</span>
                <span className="bg-yellow-400 px-2 rounded">Medium {correlationStats.medium || 0}</span>
                <span className="bg-blue-400 px-2 rounded">Low {correlationStats.low || 0}</span>
                <span className="bg-green-400 px-2 rounded">Info {correlationStats.info || 0}</span>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded min-w-[220px]">
              <div className="mb-2 font-semibold flex items-center gap-2">MISP {mispLoading && <span className="text-xs text-gray-400">(loading)</span>}</div>
              {misp && misp.success && misp.matches ? (
                (() => {
                  const vals = Object.values(misp.matches) as any[];
                  const iocsWithHits = Object.entries(misp.matches).filter(([_, v]: any) => v && v.success && ((v.attributes?.length||0) > 0 || (v.events?.length||0) > 0)).length;
                  const totalAttrs = vals.reduce((acc, v: any) => acc + ((v?.attributes?.length)||0), 0);
                  return (
                    <div className="text-sm text-gray-200">
                      <div>IOC hits: <b>{iocsWithHits}</b></div>
                      <div>Attributes: <b>{totalAttrs}</b></div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-gray-400">No MISP data</div>
              )}
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded mt-4">
            <div className="font-semibold mb-2">Data Types</div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    <LabelList dataKey="value" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400">No data types found.</div>
            )}
          </div>
        </div>
      )}
      {tab === "Correlations" && (
        <div className="bg-gray-900 p-4 rounded">
          <div className="font-semibold mb-2">Correlations</div>
          {correlationsData && correlationsData.length > 0 ? (
            <div className="space-y-2">
              {correlationsData.map((corr: any, idx: number) => {
                let risk = '';
                let count = 0;
                let description = '';
                
                if (Array.isArray(corr)) {
                  risk = corr[0] || '';
                  count = corr[1] || 0;
                  description = corr[2] || '';
                } else if (typeof corr === 'object' && corr !== null) {
                  risk = corr.risk || corr.rule_risk || '';
                  count = corr.count || corr.total || 0;
                  description = corr.description || corr.rule_descr || '';
                }
                
                return (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      risk.toLowerCase() === 'high' ? 'bg-red-700/80 text-red-200' : 
                      risk.toLowerCase() === 'medium' ? 'bg-yellow-700/80 text-yellow-200' : 
                      risk.toLowerCase() === 'low' ? 'bg-blue-700/80 text-blue-200' : 
                      'bg-green-700/80 text-green-200'
                    }`}>
                      {risk.toUpperCase()}: {count}
                    </span>
                    {description && <span className="text-gray-300 text-sm">{description}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-400">No correlations found.</div>
          )}
        </div>
      )}
      {tab === "Browse" && (
        <div>
          <div className="font-semibold mb-2">Browse Data</div>
          {browseData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs bg-gray-900 rounded">
                <thead>
                  <tr>
                    <th className="p-2">Type</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Last Seen</th>
                    <th className="p-2">Module</th>
                    <th className="p-2">Count</th>
                    <th className="p-2">MISP</th>
                  </tr>
                </thead>
                <tbody>
                  {browseData.map((el: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-2">{el[1] || el.type || 'Unknown'}</td>
                      <td className="p-2">{el[0] || el.value || 'N/A'}</td>
                      <td className="p-2">{el[2] || el.last_seen || 'N/A'}</td>
                      <td className="p-2">{el[3] || el.module || 'N/A'}</td>
                      <td className="p-2">{el[4] || el.count || 1}</td>
                      <td className="p-2">
                        {(() => {
                          const value = el[0] || el.value;
                          const hit = misp?.matches?.[value];
                          if (!hit || !hit.success) return <span className="text-gray-600">-</span>;
                          const a = (hit.attributes?.length)||0;
                          const e = (hit.events?.length)||0;
                          if (a===0 && e===0) return <span className="text-gray-600">-</span>;
                          const cls = a+e >= 5 ? 'bg-red-700/80 text-red-200' : a+e >= 2 ? 'bg-yellow-700/80 text-yellow-200' : 'bg-blue-700/80 text-blue-200';
                          return <span className={`px-2 py-0.5 rounded text-[10px] ${cls}`}>hits {a+e}</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400">No data elements found.</div>
          )}
        </div>
      )}
      {tab === "Graph" && (
        <div className="bg-gray-900 p-4 rounded">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Graph</div>
            <div className="flex items-center gap-2">
              <label className={`text-xs px-2 py-1 rounded cursor-pointer ${viewMode==='table'?'bg-gray-700 text-white':'bg-gray-800 text-gray-300'}`}>
                <input
                  type="radio"
                  name="viewmode"
                  className="hidden"
                  checked={viewMode==='table'}
                  onChange={() => setViewMode('table')}
                />
                Table
              </label>
              <label className={`text-xs px-2 py-1 rounded cursor-pointer ${viewMode==='canvas'?'bg-gray-700 text-white':'bg-gray-800 text-gray-300'}`}>
                <input
                  type="radio"
                  name="viewmode"
                  className="hidden"
                  checked={viewMode==='canvas'}
                  onChange={() => setViewMode('canvas')}
                />
                Interactive
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Type</span>
              <select className="bg-gray-800 text-xs px-2 py-1 rounded" value={filterType} onChange={(e)=>setFilterType(e.target.value)}>
                <option value="">All</option>
                {Array.from(new Set(graphNodes.map(n=>n.type).filter(Boolean))).sort().map((t)=> (
                  <option key={String(t)} value={String(t)}>{String(t)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Module</span>
              <select className="bg-gray-800 text-xs px-2 py-1 rounded" value={filterModule} onChange={(e)=>setFilterModule(e.target.value)}>
                <option value="">All</option>
                {Array.from(new Set(graphData.map(e=>e.module).filter(Boolean))).sort().map((m)=> (
                  <option key={String(m)} value={String(m)}>{String(m)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Risk</span>
              <select className="bg-gray-800 text-xs px-2 py-1 rounded" value={filterRisk} onChange={(e)=>setFilterRisk(e.target.value)}>
                <option value="">All</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            {(filterType||filterModule||filterRisk) && (
              <button className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded" onClick={()=>{setFilterType('');setFilterModule('');setFilterRisk('');}}>Clear</button>
            )}
          </div>

          {/* Filter logic */}
          {(() => {
            const riskVal = filterRisk ? Number(filterRisk) : undefined;
            const passesNode = (n: any) => (
              (!filterType || String(n.type||'') === filterType)
              && (riskVal===undefined || Number(n.risk||0) === riskVal)
            );
            const nodeOk = new Set(graphNodes.filter(passesNode).map(n=>n.id));
            const edgesFiltered = graphEdges.filter(e => nodeOk.has(e.from) && nodeOk.has(e.to));
            const moduleOk = (ev: any) => (!filterModule || String(ev.module||'') === filterModule);
            const edgesFinal = edgesFiltered.filter(e => {
              // Keep edge if there exists an event connecting src->dst with module match
              return graphData.some(ev => String(ev.id||ev.hash||'')===e.to && String(ev.source||'')===e.from && moduleOk(ev));
            });

            if (viewMode === 'table') {
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs bg-gray-900 rounded">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">From</th>
                        <th className="p-2 text-left">To</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">Risk</th>
                        <th className="p-2 text-left">Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      {edgesFinal.slice(0, 300).map((e, idx) => {
                        const from = graphNodes.find(n => n.id === e.from);
                        const to = graphNodes.find(n => n.id === e.to);
                        const ev = graphData.find(x => String(x.id||x.hash||'')===e.to && String(x.source||'')===e.from);
                        const risk = typeof to?.risk === 'number' ? to?.risk : undefined;
                        const riskClass = risk===undefined ? 'bg-gray-700 text-gray-200' : (risk>=3 ? 'bg-red-700/80 text-red-200' : risk===2 ? 'bg-yellow-700/80 text-yellow-200' : risk===1 ? 'bg-blue-700/80 text-blue-200' : 'bg-green-700/80 text-green-200');
                        const typeIcon = (to?.type||'').toLowerCase().includes('domain') ? '🌐' : (to?.type||'').toLowerCase().includes('ip') ? '🖧' : (to?.type||'').toLowerCase().includes('email') ? '✉️' : '•';
                        return (
                          <tr key={idx} className="border-b border-gray-800">
                            <td className="p-2">{from?.label || e.from}</td>
                            <td className="p-2">{to?.label || e.to}</td>
                            <td className="p-2">{typeIcon} {to?.type || '-'}</td>
                            <td className="p-2"><span className={`px-2 py-0.5 rounded text-[10px] ${riskClass}`}>{risk!==undefined ? risk : '-'}</span></td>
                            <td className="p-2">{ev?.module || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {edgesFinal.length > 300 && (
                    <div className="text-gray-500 text-xs mt-2">Showing first 300 edges out of {edgesFinal.length}</div>
                  )}
                </div>
              );
            }

            // Simple circular layout for nodes
            const nodesShown = graphNodes.filter(n => nodeOk.has(n.id));
            const N = Math.max(nodesShown.length, 1);
            const radius = 180;
            const centerX = 260;
            const centerY = 220;
            const positions = new Map<string, {x:number,y:number}>();
            nodesShown.forEach((n, i) => {
              const angle = (2*Math.PI*i)/N;
              positions.set(n.id, { x: centerX + radius*Math.cos(angle), y: centerY + radius*Math.sin(angle) });
            });

            return (
              <div className="w-full overflow-auto">
                <svg width={600} height={440} className="bg-gray-950 rounded">
                  {/* edges */}
                  {edgesFinal.slice(0, 1000).map((e, idx) => {
                    const p1 = positions.get(e.from);
                    const p2 = positions.get(e.to);
                    if (!p1 || !p2) return null;
                    return <line key={idx} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#334155" strokeWidth={1} />
                  })}
                  {/* nodes */}
                  {nodesShown.map((n, idx) => {
                    const p = positions.get(n.id)!;
                    const risk = typeof n.risk === 'number' ? n.risk : undefined;
                    const color = risk===undefined ? '#64748b' : (risk>=3 ? '#ef4444' : risk===2 ? '#f59e0b' : risk===1 ? '#3b82f6' : '#22c55e');
                    return (
                      <g key={idx} transform={`translate(${p.x},${p.y})`}>
                        <circle r={10} fill={color} />
                        <text x={12} y={4} fontSize={10} fill="#e5e7eb">{(n.label || n.id).toString().slice(0, 18)}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>
      )}
      {tab === "Scan Settings" && (
        <div className="bg-gray-900 p-4 rounded">
          <div className="font-semibold mb-2">Scan Settings</div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(scanStatus?.settings || scanStatus, null, 2)}
          </pre>
        </div>
      )}
      {tab === "Log" && (
        <div className="bg-gray-900 p-4 rounded">
          <div className="font-semibold mb-2">Scan Log</div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {scanLog || "No log available."}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ScanDetailsPage;
