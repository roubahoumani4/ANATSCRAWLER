import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const AssessmentPage: React.FC = () => {
  const [target, setTarget] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deepScan, setDeepScan] = useState(false);
  const [checkBreaches, setCheckBreaches] = useState(false);

  const runAssessment = async () => {
    setError(null);
    setOutput(null);
    if (!target) return setError('Please provide a target (domain, URL or IP)');
    setRunning(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/assessment/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ target, deepScan, checkBreaches }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
  const resp = await res.json();
  setOutput(JSON.stringify(resp, null, 2));
  if (resp.parsed) setParsed(resp.parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to run assessment');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 rounded bg-emerald-700/10 text-emerald-400">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Assessment</h1>
            <p className="text-sm text-gray-400">Run and review assessments for targets and assets.</p>
          </div>
        </div>

        <div className="mt-6 bg-gray-850 rounded-lg p-6 border border-gray-800">
          <label className="block text-sm text-gray-300">Target (domain, IP or URL)</label>
          <input
            className="mt-2 w-full bg-gray-800 text-white px-3 py-2 rounded"
            placeholder="example.com or https://example.com or 8.8.8.8"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={deepScan} onChange={(e) => setDeepScan(e.target.checked)} />
              Deep scan
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={checkBreaches} onChange={(e) => setCheckBreaches(e.target.checked)} />
              Check breaches
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className={`px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 ${running ? 'opacity-70 cursor-wait' : ''}`}
              onClick={runAssessment}
              disabled={running}
            >
              {running ? 'Running…' : 'Run Assessment'}
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
              onClick={() => { setTarget(''); setOutput(null); setError(null); }}
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-400">{error}</div>
          )}

          {output && (
            <pre className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-200 overflow-x-auto max-h-[40vh]">
              {output}
            </pre>
          )}
          {parsed && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Assessment Dashboard</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">IPs Discovered</div>
                  <div className="text-2xl font-bold">{parsed.ipsDiscovered ?? '—'}</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">Subdomains Found</div>
                  <div className="text-2xl font-bold">{parsed.subdomainsFound ?? '—'}</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">Open Ports</div>
                  <div className="text-2xl font-bold">{parsed.openPorts ?? (parsed.openPortsList?.length ?? '—')}</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">Risk Level</div>
                  <div className="text-2xl font-bold">{parsed.riskLevel ?? '—'}</div>
                </div>
              </div>

              {/* Simple bar chart for vulnerabilities */}
              <div className="mt-4 p-4 bg-gray-800 rounded">
                <div className="text-sm text-gray-400 mb-2">Vulnerabilities</div>
                <div className="flex items-center gap-4">
                  <div className="w-1/2">
                    <div className="text-xs text-gray-300">Critical</div>
                    <div className="h-4 bg-gray-700 rounded mt-1">
                      <div
                        className="h-4 bg-red-600 rounded"
                        style={{ width: `${Math.min(100, (parsed.criticalVulnerabilities || 0) * 10)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{parsed.criticalVulnerabilities ?? 0}</div>
                  </div>
                  <div className="w-1/2">
                    <div className="text-xs text-gray-300">Total</div>
                    <div className="h-4 bg-gray-700 rounded mt-1">
                      <div
                        className="h-4 bg-amber-500 rounded"
                        style={{ width: `${Math.min(100, (parsed.totalVulnerabilities || 0) * 5)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{parsed.totalVulnerabilities ?? 0}</div>
                  </div>
                </div>

                {/* simple list of open ports */}
                {parsed.openPortsList && parsed.openPortsList.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Open Ports</div>
                    <div className="flex flex-wrap gap-2">
                      {parsed.openPortsList.map((p: number) => (
                        <span key={p} className="text-xs bg-gray-700 px-2 py-1 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
