
import React, { useEffect, useState } from "react";
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
  const [graphData, setGraphData] = useState<any>(null);
  const [correlations, setCorrelations] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchScanData = async () => {
      try {
        const [status, summary, correlations, browse, graph, logs] = await Promise.all([
          fetch(`/api/spiderfoot/scan/${scanId}/status`).then(res => res.json()).catch(() => null),
          fetch(`/api/spiderfoot/scan/${scanId}/summary`).then(res => res.json()).catch(() => []),
          fetch(`/api/spiderfoot/scan/${scanId}/correlationsummary`).then(res => res.json()).catch(() => []),
          fetch(`/api/spiderfoot/scan/${scanId}/browse`).then(res => res.json()).catch(() => []),
          fetch(`/api/spiderfoot/scan/${scanId}/graph`).then(res => res.json()).catch(() => []),
          fetch(`/api/spiderfoot/scan/${scanId}/logs`).then(res => res.json()).catch(() => [])
        ]);

        setScanStatus(status);
        setScanResults({ summary, correlations, browse, graph });
        setCorrelations(correlations);
        setGraphData(graph);
        
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
    };

    fetchScanData();
  }, [scanId]);

  if (loading) return <div className="p-8">Loading scan details...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!scanStatus) return <div className="p-8">No scan info found.</div>;

  // Prepare data types for bar chart (from summary)
  const summaryArr = Array.isArray(scanResults?.summary) ? scanResults.summary : [];
  const barData = summaryArr.map((row: any) => ({
    name: row[0] || row.type || row.name || 'Unknown',
    value: typeof row[3] === 'number' ? row[3] : (typeof row.total === 'number' ? row.total : 0)
  }));

  // Prepare correlations data
  const correlationsData = Array.isArray(correlations) ? correlations : [];
  const correlationStats = correlationsData.reduce((acc: any, corr: any) => {
    const risk = (corr[2] || corr.risk || '').toLowerCase();
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
        <h1 className="text-2xl font-bold">{scanStatus.name || scanStatus.target} <span className="ml-2 text-xs font-semibold text-yellow-400">{scanStatus.status}</span></h1>
      </div>
      <div className="flex gap-2 mb-6">
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
          {correlations && Object.keys(correlations).length > 0 ? (
            <div className="flex gap-4">
              {Object.entries(correlations).map(([key, val]) => (
                <span key={key} className={`px-3 py-1 rounded-full text-xs font-bold ${key === 'high' ? 'bg-red-700/80 text-red-200' : key === 'medium' ? 'bg-yellow-700/80 text-yellow-200' : key === 'low' ? 'bg-blue-700/80 text-blue-200' : 'bg-green-700/80 text-green-200'}`}>{key}: {typeof val === 'number' || typeof val === 'string' ? val : JSON.stringify(val)}</span>
              ))}
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
                  </tr>
                </thead>
                <tbody>
                  {browseData.map((el: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-2">{el[1] || el.type}</td>
                      <td className="p-2">{el[0] || el.value}</td>
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
          <div className="font-semibold mb-2">Graph</div>
          {Array.isArray(graphData) && graphData.length > 0 ? (
            <div className="text-gray-400">Graph data loaded ({graphData.length} events). {/* TODO: Add visualization */}</div>
          ) : (
            <div className="text-gray-400">No graph data available.</div>
          )}
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
