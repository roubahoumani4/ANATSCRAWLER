import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AssessmentPage: React.FC = () => {
  const [target, setTarget] = useState('');
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plainOutput, setPlainOutput] = useState<string | null>(null);
  const [sections, setSections] = useState<Array<{ title: string; content: string }>>([]);
  const [showCharts, setShowCharts] = useState(false);

  // Helper to download a file: try server download endpoint first, then fallback to status JSON
  const downloadReportForJob = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const hdrs: any = {};
      if (token) hdrs['Authorization'] = `Bearer ${token}`;

      // Try the dedicated download endpoint
      const dl = await fetch(`${API_BASE_URL}/api/v1/assessment/download/${id}`, {
        headers: hdrs,
        credentials: 'include',
      });

      if (dl.ok) {
        const blob = await dl.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cd = dl.headers.get('content-disposition') || '';
        const fnMatch = cd.match(/filename="?([^";]+)"?/i);
        const filename = (fnMatch && fnMatch[1]) ? fnMatch[1] : `report_${id}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // Fallback: fetch status JSON and download as file
      const st = await fetch(`${API_BASE_URL}/api/v1/assessment/status/${id}`, {
        headers: hdrs,
        credentials: 'include',
      });
      if (!st.ok) throw new Error(`Failed to retrieve job status: ${st.status}`);
      const json = await st.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment_${id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Download failed');
    }
  };

  // Poll for job status
  const pollJobStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/assessment/status/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok && res.status !== 500) {
        throw new Error(`HTTP ${res.status}`);
      }

      const resp = await res.json();

      if (resp.status === 'completed' && resp.result) {
        setRunning(false);
        // keep jobId for download reference
        setLastJobId(id);
        setOutput(JSON.stringify(resp.result, null, 2));
        if (resp.result.parsed) {
          setPlainOutput(resp.result.parsed.plainOutput || null);
          setSections(resp.result.parsed.sections || []);
        } else if (resp.result.stdout) {
          const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
          setPlainOutput(stripAnsi(resp.result.stdout));
        }
        setStatusMessage(`✅ Assessment completed in ${resp.elapsedSeconds}s`);
        return true; // Stop polling
      }

      if (resp.status === 'failed') {
        setRunning(false);
        setLastJobId(id);
        setError(resp.error || 'Assessment failed');
        return true; // Stop polling
      }

      // Still running
      if (resp.elapsedSeconds) {
        setElapsedSeconds(resp.elapsedSeconds);
        setStatusMessage(`⏳ ${resp.message}`);
      }
      return false; // Continue polling
    } catch (err: any) {
      setError(err.message || 'Failed to check status');
      return true; // Stop polling on error
    }
  };

  const runAssessment = async () => {
    setError(null);
    setOutput(null);
    setStatusMessage(null);
    setElapsedSeconds(0);
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

      if (resp.jobId) {
        setJobId(resp.jobId);
        setLastJobId(null);
        setStatusMessage('📝 Assessment job started, waiting for results...');

        // Poll for status every 2 seconds
        const pollInterval = setInterval(async () => {
          const done = await pollJobStatus(resp.jobId);
          if (done) {
            clearInterval(pollInterval);
          }
        }, 2000);

        // Check status immediately
        await pollJobStatus(resp.jobId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment');
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
            className="mt-2 w-full bg-gray-800 text-white px-3 py-2 rounded disabled:opacity-50"
            placeholder="example.com or https://example.com or 8.8.8.8"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={running}
          />

          <p className="mt-4 text-xs text-gray-400">
            💡 <strong>Full Comprehensive Scan:</strong> This will run a complete OSINT analysis including deep DNS brute-forcing and data breach checks. This may take 3-5 minutes.
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button
                className={`px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={runAssessment}
                disabled={running}
              >
                {running ? '⏳ Running assessment...' : 'Run Assessment'}
              </button>
            <button
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              onClick={() => { setTarget(''); setOutput(null); setError(null); setPlainOutput(null); setSections([]); setStatusMessage(null); }}
              disabled={running}
            >
              Clear
            </button>
          </div>

          {statusMessage && (
            <div className="mt-4 text-sm text-blue-400 animate-pulse">{statusMessage}</div>
          )}

          {/* SUMMARY DONUTS / CHARTS - Always visible at the top after status */}
          {(output || plainOutput) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                try {
                  let parsed: any = {};
                  if (output) {
                    try {
                      parsed = JSON.parse(output).result?.parsed || {};
                    } catch (e) {
                      parsed = {};
                    }
                  }
                  const plain = (parsed && parsed.plainOutput) || plainOutput || '';
                  const num = (label: string) => {
                    const m = (plain as string).match(new RegExp(label + "\\s*:\\s*(\\d+)", 'i'));
                    return m ? Number(m[1]) : null;
                  };

                  const ips = Number(parsed.ipsDiscovered ?? num('IPs Discovered') ?? 0);
                  const subsCount = Number(parsed.subdomainsFound ?? num('Subdomains Found') ?? (parsed.subdomains ? (Array.isArray(parsed.subdomains) ? parsed.subdomains.length : Object.keys(parsed.subdomains).length) : 0));
                  const ports = Number(parsed.openPorts ?? num('Open Ports') ?? (parsed.openPortsList ? parsed.openPortsList.length : 0));
                  const crit = Number(parsed.criticalVulnerabilities ?? num('Critical Vulnerabilities') ?? 0);

                  const vulnerabilities: any[] = parsed.vulnerabilities || [];
                  const totalVulns = Number(parsed.totalVulnerabilities ?? num('Total Vulnerabilities') ?? vulnerabilities.length);

                  // build subdomains array (safe)
                  let subdomainsArr: string[] = [];
                  if (parsed.subdomains) {
                    if (Array.isArray(parsed.subdomains)) subdomainsArr = parsed.subdomains as string[];
                    else if (typeof parsed.subdomains === 'object') subdomainsArr = Object.keys(parsed.subdomains);
                  } else if (Array.isArray(parsed.subdomains_comprehensive)) {
                    subdomainsArr = parsed.subdomains_comprehensive.map((s: any) => s.subdomain || s);
                  } else if (plain) {
                    subdomainsArr = (Array.from(new Set((plain.match(/[a-z0-9\-]+\.[a-z0-9\-]+\.[a-z]{2,}/gi) || []))) as string[]).slice(0, 50);
                  }

                  // create a small synthetic trend for the area sparkline (inspired by dashboard area chart)
                  const buildTrend = (base: number) => {
                    const b = Math.max(1, Math.round(base));
                    return [Math.round(b * 0.5), Math.round(b * 0.75), b, Math.round(b * 1.1), Math.round(b * 0.9)];
                  };

                  const areaData = buildTrend(ips).map((v, i) => ({ name: ['Jan', 'Feb', 'Mar', 'Apr', 'May'][i] || `P${i + 1}`, scans: v, alerts: Math.round((crit / Math.max(1, totalVulns || 1)) * v) }));

                  // Pie for subdomains vs remainder
                  const pieData = [{ name: 'Subdomains', value: subsCount }, { name: 'Other', value: Math.max(0, ips - subsCount) }];

                  // Port data (top ports) fallback
                  const openPortsList: number[] = parsed.openPortsList || (parsed.port_scanning && parsed.port_scanning.open_ports ? parsed.port_scanning.open_ports.map((p: any) => p.port) : []);
                  const portCounts: Record<string, number> = {};
                  (openPortsList || []).forEach((p: number) => { portCounts[String(p)] = (portCounts[String(p)] || 0) + 1; });
                  const portData = Object.keys(portCounts).sort((a, b) => Number(b) - Number(a)).slice(0, 8).map(k => ({ name: k, value: portCounts[k] }));

                  // severity stacked bar
                  const sevCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
                  vulnerabilities.forEach((v: any) => { const s = String((v.severity || '').toUpperCase()); if (sevCounts[s] !== undefined) sevCounts[s]++; else sevCounts.INFO++; });
                  const totalData = [{ name: 'Vulnerabilities', CRITICAL: sevCounts.CRITICAL, HIGH: sevCounts.HIGH, MEDIUM: sevCounts.MEDIUM, LOW: sevCounts.LOW, INFO: sevCounts.INFO }];

                  return (
                    <>
                      {/* Top: Area sparkline (left) + Subdomains pie (right) */}
                      <div className="col-span-1 md:col-span-2 bg-gray-850 p-4 rounded border border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm text-gray-300">OSINT Activity</div>
                            <div className="text-xl font-bold text-white">{ips} items</div>
                          </div>
                          <div className="text-sm text-gray-400">Last 5 periods</div>
                        </div>
                        <div style={{ height: 140 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#9ca3af" />
                              <YAxis stroke="#9ca3af" allowDecimals={false} />
                              <Tooltip />
                              <Area type="monotone" dataKey="scans" stroke="#06b6d4" fill="url(#colorScans)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-gray-850 p-4 rounded border border-gray-800 text-center">
                        <div className="text-sm text-gray-300 mb-2">Subdomains vs Other</div>
                        <div style={{ width: 160, height: 120, margin: '0 auto' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} dataKey="value" innerRadius={30} outerRadius={56} startAngle={90} endAngle={-270}>
                                <Cell key="sub" fill="#8b5cf6" />
                                <Cell key="other" fill="#0f172a" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">{subsCount} subdomains</div>
                      </div>

                      {/* Second row: ports, subdomain list (mini bar), vulnerabilities stacked */}
                      <div className="bg-gray-850 p-4 rounded border border-gray-800">
                        <div className="text-sm text-gray-300 mb-2">Open Ports (top)</div>
                        <div style={{ height: 140 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={portData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#9ca3af" />
                              <YAxis stroke="#9ca3af" allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#f59e0b" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-2 text-center text-lg font-bold text-white">{openPortsList.length} open ports</div>
                      </div>

                      <div className="bg-gray-850 p-4 rounded border border-gray-800">
                        <div className="text-sm text-gray-300 mb-2">Top Subdomains</div>
                        <div style={{ height: 140 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subdomainsArr.slice(0, 6).map((s) => ({ name: s.replace(/\.$/, ''), value: s.split('.').length }))} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                              <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                              <XAxis type="number" stroke="#9ca3af" />
                              <YAxis dataKey="name" type="category" width={140} stroke="#9ca3af" />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8b5cf6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-2 text-center text-lg font-bold text-white">{subdomainsArr.length} found</div>
                      </div>

                      <div className="bg-gray-850 p-4 rounded border border-gray-800">
                        <div className="text-sm text-gray-300 mb-2">Vulnerabilities by Severity</div>
                        <div style={{ height: 140 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={totalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#9ca3af" />
                              <YAxis stroke="#9ca3af" allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="CRITICAL" stackId="a" fill="#ef4444" />
                              <Bar dataKey="HIGH" stackId="a" fill="#f97316" />
                              <Bar dataKey="MEDIUM" stackId="a" fill="#f59e0b" />
                              <Bar dataKey="LOW" stackId="a" fill="#10b981" />
                              <Bar dataKey="INFO" stackId="a" fill="#64748b" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-2 text-center text-lg font-bold text-white">{vulnerabilities.length} total</div>
                      </div>

                      <div className="col-span-3 flex items-center justify-center">
                        {(lastJobId || jobId) && (
                          <button
                            onClick={() => downloadReportForJob(lastJobId || jobId!)}
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 font-semibold"
                          >
                            ⬇️ Download full report (PDF)
                          </button>
                        )}
                      </div>
                    </>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-400">{error}</div>
          )}

          {/* Raw output hidden in collapsible details */}
          {plainOutput && (
            <details className="mt-6 p-3 bg-gray-850 rounded border border-gray-800 text-xs text-gray-300">
              <summary className="cursor-pointer font-semibold text-gray-200">📄 Full scan output (click to expand)</summary>
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
            </details>
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
