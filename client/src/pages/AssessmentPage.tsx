import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const AssessmentPage: React.FC = () => {
  const [target, setTarget] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plainOutput, setPlainOutput] = useState<string | null>(null);
  const [sections, setSections] = useState<Array<{ title: string; content: string }>>([]);

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
        body: JSON.stringify({ target }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const resp = await res.json();
      setOutput(JSON.stringify(resp, null, 2));
      if (resp.parsed) {
        setPlainOutput(resp.parsed.plainOutput || null);
        setSections(resp.parsed.sections || []);
      } else if (resp.stdout) {
        // fallback: strip ANSI on the client (in case server didn't)
        const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
        setPlainOutput(stripAnsi(resp.stdout));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run assessment');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite">
      <div className="w-full">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 rounded bg-emerald-700/10 text-emerald-400">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Assessment</h1>
            <p className="text-sm text-gray-400">Run and review assessments for targets and assets.</p>
          </div>
        </div>

  <div className="mt-6 bg-gray-850 rounded-lg p-8 border border-gray-800 w-full">
          <label className="block text-sm text-gray-300">Target (domain, IP or URL)</label>
          <input
            className="mt-2 w-full bg-gray-800 text-white px-3 py-2 rounded"
            placeholder="example.com or https://example.com or 8.8.8.8"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />

          <p className="mt-4 text-xs text-gray-400">
            💡 <strong>Full Comprehensive Scan:</strong> This will run a complete OSINT analysis including deep DNS brute-forcing and data breach checks. This may take 3-5 minutes.
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button
                className={`px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 ${running ? 'opacity-70 cursor-wait' : ''}`}
                onClick={runAssessment}
                disabled={running}
              >
                {running ? 'Running comprehensive scan…' : 'Run Assessment'}
              </button>
            <button
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
              onClick={() => { setTarget(''); setOutput(null); setError(null); setPlainOutput(null); setSections([]); }}
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-400">{error}</div>
          )}

          {plainOutput && (
            <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-200 overflow-y-auto max-h-[60vh] whitespace-pre-wrap">
              {sections.length > 0 ? (
                sections.map((s, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="text-sm text-gray-300 font-semibold mb-1">{s.title}</div>
                    <pre className="bg-gray-800 p-3 rounded text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap">{s.content}</pre>
                  </div>
                ))
              ) : (
                <pre className="text-xs text-gray-200">{plainOutput}</pre>
              )}
            </div>
          )}

          {output && (
            <details className="mt-4 p-3 bg-gray-850 rounded text-xs text-gray-300">
              <summary className="cursor-pointer">Raw JSON response</summary>
              <pre className="mt-2 text-xs text-gray-200 overflow-x-auto">{output}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
