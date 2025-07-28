import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TABS = ["Summary", "Correlations", "Browse", "Graph"];

const ScanDetailsPage = () => {
  const { scanId } = useParams();
  const [tab, setTab] = useState("Summary");
  const [scanInfo, setScanInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/spiderfoot/scan/${scanId}/info`)
      .then(res => res.json())
      .then(data => {
        setScanInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load scan info");
        setLoading(false);
      });
  }, [scanId]);

  if (loading) return <div className="p-8">Loading scan details...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!scanInfo) return <div className="p-8">No scan info found.</div>;

  return (
    <div className="p-8 w-full">
      <div className="flex items-center gap-4 mb-4">
        <button className="text-blue-400 underline" onClick={() => navigate(-1)}>&larr; Back</button>
        <h1 className="text-2xl font-bold">{scanInfo.name || scanInfo.target} <span className="ml-2 text-xs font-semibold text-yellow-400">{scanInfo.status}</span></h1>
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
          {/* Scan status summary, data types, and chart here */}
          <div className="mb-4 flex gap-8">
            <div className="bg-gray-800 p-4 rounded">
              <div>Total: <b>{scanInfo.total || scanInfo.elements || 0}</b></div>
              <div>Unique: <b>{scanInfo.unique || 0}</b></div>
              <div>Status: <b>{scanInfo.status}</b></div>
              <div>Errors: <b>{scanInfo.errors || 0}</b></div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="mb-2 font-semibold">Correlations</div>
              <div className="flex gap-2">
                <span className="bg-red-400 px-2 rounded">High {scanInfo.corr_high || 0}</span>
                <span className="bg-yellow-400 px-2 rounded">Medium {scanInfo.corr_medium || 0}</span>
                <span className="bg-blue-400 px-2 rounded">Low {scanInfo.corr_low || 0}</span>
                <span className="bg-green-400 px-2 rounded">Info {scanInfo.corr_info || 0}</span>
              </div>
            </div>
          </div>
          {/* Data types bar chart placeholder */}
          <div className="bg-gray-900 p-4 rounded mt-4">
            <div className="font-semibold mb-2">Data Types</div>
            {/* You can use a chart library here, or render a simple bar chart */}
            <div className="text-gray-400">[Bar chart of data types goes here]</div>
          </div>
        </div>
      )}
      {tab === "Correlations" && (
        <div className="bg-yellow-100 text-yellow-900 p-4 rounded">No correlations.<br/>If the scan is still running please reload once it has completed.</div>
      )}
      {tab === "Browse" && (
        <div>
          <div className="font-semibold mb-2">Browse Data</div>
          {/* Table of data elements, types, timestamps, etc. */}
          <div className="text-gray-400">[Browse data table goes here]</div>
        </div>
      )}
      {tab === "Graph" && (
        <div>
          <div className="font-semibold mb-2">Graph</div>
          {/* Graph visualization placeholder */}
          <div className="text-gray-400">[Graph visualization goes here]</div>
        </div>
      )}
    </div>
  );
};

export default ScanDetailsPage;
