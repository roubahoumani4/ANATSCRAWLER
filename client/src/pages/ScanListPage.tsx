
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Scan = {
  scan_id: string;
  name?: string;
  target: string;
  started?: string;
  finished?: string;
  status: string;
  elements?: number;
  correlations?: number;
  [key: string]: any;
};

const ScanListPage = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/spiderfoot/scanlist")
      .then(res => res.json())
      .then(data => {
        // The new endpoint returns an array of arrays, map to Scan objects
        setScans(
          Array.isArray(data)
            ? data.filter(arr => arr && arr[0]).map(arr => ({
                scan_id: arr[0],
                name: arr[1],
                target: arr[2],
                started: arr[3],
                finished: arr[4],
                status: arr[5],
                elements: arr[6],
                correlations: arr[7],
                modules: arr[8],
                scan_type: arr[9],
              }))
            : []
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load scans");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading scans...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="p-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Scans</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-darkGray border border-gray-700 rounded">
          <thead>
            <tr className="bg-gray-800 text-coolWhite">
              <th className="p-2">Name</th>
              <th className="p-2">Target</th>
              <th className="p-2">Started</th>
              <th className="p-2">Finished</th>
              <th className="p-2">Status</th>
              <th className="p-2">Elements</th>
              <th className="p-2">Correlations</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {scans.map(scan => (
              <tr
                key={scan.scan_id}
                className="hover:bg-blue-900/20 cursor-pointer"
                onClick={() => navigate(`/osint-engine/scans/${scan.scan_id}`)}
              >
                <td className="p-2">{scan.name || scan.target}</td>
                <td className="p-2">{scan.target}</td>
                <td className="p-2">{scan.started}</td>
                <td className="p-2">{scan.finished || "Not yet"}</td>
                <td className="p-2">{scan.status}</td>
                <td className="p-2">{scan.elements || 0}</td>
                <td className="p-2">{scan.correlations || 0}</td>
                <td className="p-2">
                  {/* Add action buttons here (refresh, abort, delete, etc.) */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScanListPage;
