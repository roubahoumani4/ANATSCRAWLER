import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import VulnerabilityGraphs from '@/components/VulnerabilityGraphs';
import { ChevronDown, ChevronUp, Download, FileText, History } from 'lucide-react';

const OutputPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<any | null>(null);
  const [outputExpanded, setOutputExpanded] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    (async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/assessment/status/${jobId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setScan(data.result || data.scan || null);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch scan');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <FileText className="mx-auto mb-4 text-gray-500" size={64} />
          <h2 className="text-2xl font-semibold mb-4">No Scan Output Available</h2>
          <p className="text-gray-400 mb-8">
            Please initiate a scan from the Assessment page to view outputs and results.
          </p>
          <button 
            className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold"
            onClick={() => navigate('/osint/assessment')}
          >
            Go to Assessment Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText size={28} className="text-sky-400" />
            Scan Output
          </h1>
          <p className="text-sm text-gray-400 mt-1">Detailed analysis results and generated reports</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-2"
            onClick={() => navigate('/osint/assessment/history')}
          >
            <History size={16} />
            History
          </button>
          <button 
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
            onClick={() => navigate('/osint/assessment')}
          >
            Back to Assessment
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-300 animate-pulse">Loading scan results...</div>
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {scan && (
          <div className="space-y-6">
            {/* Scan Info Card */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Scan Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Target:</span>
                  <div className="text-white font-medium">{scan.target || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className="text-white font-medium">
                    <span className={`px-2 py-1 rounded text-xs ${
                      scan.status === 'running' ? 'bg-yellow-700 text-yellow-100' :
                      scan.status === 'finished' ? 'bg-emerald-700 text-emerald-100' :
                      scan.status === 'failed' ? 'bg-red-700 text-red-100' :
                      'bg-gray-700 text-gray-200'
                    }`}>
                      {scan.status || 'unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Start Time:</span>
                  <div className="text-white font-medium">
                    {scan.startTime ? new Date(scan.startTime).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">End Time:</span>
                  <div className="text-white font-medium">
                    {scan.endTime ? new Date(scan.endTime).toLocaleString() : 'Running...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Vulnerability Graphs */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Vulnerability Analysis</h2>
              <VulnerabilityGraphs 
                sectionData={scan.parsed} 
                plainOutput={scan.parsed?.plainOutput || scan.stdout || null} 
              />
            </div>

            {/* Full Output - Collapsible */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg">
              <button
                className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                onClick={() => setOutputExpanded(!outputExpanded)}
              >
                <h2 className="text-lg font-semibold">Full Scan Output</h2>
                {outputExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {outputExpanded && (
                <div className="p-6 pt-0">
                  <div className="bg-gray-950 rounded border border-gray-800 p-4 overflow-y-auto max-h-[600px]">
                    {scan.parsed && scan.parsed.sections && scan.parsed.sections.length > 0 ? (
                      scan.parsed.sections.map((s: any, idx: number) => (
                        <div key={idx} className="mb-6">
                          <div className="text-sm text-emerald-400 font-semibold mb-2 sticky top-0 bg-gray-950 py-1">
                            {s.title}
                          </div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                            {s.content}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                        {scan.stdout || scan.parsed?.plainOutput || 'No output available'}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download Section */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Download Reports</h2>
              <div className="flex gap-3 flex-wrap">
                <a
                  className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold flex items-center gap-2 transition-colors"
                  href={`${API_BASE_URL}/api/v1/assessment/download/${encodeURIComponent(jobId)}`}
                  download
                >
                  <Download size={16} />
                  Download PDF Report
                </a>
                <button 
                  className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPage;
