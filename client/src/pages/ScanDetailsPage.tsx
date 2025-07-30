
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
    Promise.all([
      fetch(`/api/spiderfoot/scan/${scanId}/status`).then(res => res.json()),
      fetch(`/api/spiderfoot/scan/${scanId}/results`).then(res => res.json()),
      fetch(`/api/spiderfoot/scan/${scanId}/log`).then(res => res.ok ? res.text() : "")
    ])
      .then(([status, results, log]) => {
        setScanStatus(status);
        setScanResults(results);
        setScanLog(log);
        // Extract correlations if present
        if (results && (results.correlations || results.corr_high || results.corr_medium || results.corr_low || results.corr_info)) {
          setCorrelations(results.correlations || {
            high: results.corr_high,
            medium: results.corr_medium,
            low: results.corr_low,
            info: results.corr_info
          });
        } else {
          setCorrelations(null);
        }
        // Extract graph data if present
        if (results && results.graph) {
          setGraphData(results.graph);
        } else {
          setGraphData(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load scan details");
        setLoading(false);
      });
  }, [scanId]);

  if (loading) return <div className="p-8">Loading scan details...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!scanStatus) return <div className="p-8">No scan info found.</div>;

  // Prepare data types for bar chart
  const dataTypes = scanResults?.data_types || scanResults?.types || [];
  const barData = Array.isArray(dataTypes)
    ? dataTypes.map((dt: any) => ({
        name: dt.name || dt.type || dt[0],
        value: dt.count || dt[1] || 0
      }))
    : Object.entries(dataTypes).map(([name, value]) => ({ name, value }));

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
              <div>Total: <b>{scanResults?.total || scanResults?.elements?.length || 0}</b></div>
              <div>Unique: <b>{scanResults?.unique || 0}</b></div>
              <div>Status: <b>{scanStatus.status}</b></div>
              <div>Errors: <b>{scanStatus.errors || 0}</b></div>
              <div>Started: <b>{scanStatus.started || '-'}</b></div>
              <div>Finished: <b>{scanStatus.finished || '-'}</b></div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="mb-2 font-semibold">Correlations</div>
              <div className="flex gap-2">
                <span className="bg-red-400 px-2 rounded">High {scanResults?.corr_high || 0}</span>
                <span className="bg-yellow-400 px-2 rounded">Medium {scanResults?.corr_medium || 0}</span>
                <span className="bg-blue-400 px-2 rounded">Low {scanResults?.corr_low || 0}</span>
                <span className="bg-green-400 px-2 rounded">Info {scanResults?.corr_info || 0}</span>
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
          {correlations && (correlations.high || correlations.medium || correlations.low || correlations.info) ? (
            <div className="flex gap-4">
              <span className="bg-red-700/80 text-red-200 px-3 py-1 rounded-full text-xs font-bold">High: {correlations.high ?? 0}</span>
              <span className="bg-yellow-700/80 text-yellow-200 px-3 py-1 rounded-full text-xs font-bold">Medium: {correlations.medium ?? 0}</span>
              <span className="bg-blue-700/80 text-blue-200 px-3 py-1 rounded-full text-xs font-bold">Low: {correlations.low ?? 0}</span>
              <span className="bg-green-700/80 text-green-200 px-3 py-1 rounded-full text-xs font-bold">Info: {correlations.info ?? 0}</span>
            </div>
          ) : correlations && typeof correlations === 'object' ? (
            <div className="flex gap-4">
              {Object.entries(correlations).map(([key, val]) => (
                <span key={key} className={`px-3 py-1 rounded-full text-xs font-bold ${key === 'high' || key === 'errors' ? 'bg-red-700/80 text-red-200' : key === 'medium' || key === 'warnings' ? 'bg-yellow-700/80 text-yellow-200' : key === 'low' ? 'bg-blue-700/80 text-blue-200' : 'bg-green-700/80 text-green-200'}`}>{key}: {typeof val === 'number' || typeof val === 'string' ? val : JSON.stringify(val)}</span>
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
          {Array.isArray(scanResults?.elements) && scanResults.elements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs bg-gray-900 rounded">
                <thead>
                  <tr>
                    <th className="p-2">Type</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Module</th>
                    <th className="p-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.elements.map((el: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-2">{el.type || el[0]}</td>
                      <td className="p-2">{el.value || el[1]}</td>
                      <td className="p-2">{el.module || el[2]}</td>
                      <td className="p-2">{el.ts || el[3]}</td>
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
          {graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.edges) ? (
            <div className="text-gray-400">Graph data loaded ({graphData.nodes.length} nodes, {graphData.edges.length} edges). {/* TODO: Add visualization */}</div>
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
