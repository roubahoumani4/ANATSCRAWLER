import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import VulnerabilityGraphs from '@/components/VulnerabilityGraphs';
import { ChevronDown, ChevronUp, Download, FileText, History as HistoryIcon, Shield, Radar, Globe, Server, Activity as ActivityIcon, Lock, AlertTriangle, Globe2, Building2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { parseAssessmentSections } from './AssessmentPage';

const OutputPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<any | null>(null);
  const [outputExpanded, setOutputExpanded] = useState(false);

  // Compute visualization data from scan.parsed - parse sections from plainOutput like AssessmentPage does
  const visualization = useMemo(() => {
    if (!scan?.parsed) return null;
    
    // Parse structured sections from plainOutput (same as AssessmentPage)
    const sectionData = parseAssessmentSections(scan.parsed.plainOutput || scan.stdout || '', scan.parsed);
    if (!sectionData) return null;

    // WHOIS Pie
    const whoisPie = [];
    if (sectionData.whois?.creationDate && sectionData.whois?.expirationDate) {
      const created = new Date(sectionData.whois.creationDate).getTime();
      const expires = new Date(sectionData.whois.expirationDate).getTime();
      const now = Date.now();
      const total = expires - created;
      const elapsed = now - created;
      whoisPie.push({ name: 'Elapsed', value: Math.max(0, elapsed) });
      whoisPie.push({ name: 'Remaining', value: Math.max(0, total - elapsed) });
    }

    // DNS Counts
    const dnsCounts = [
      { type: 'A', count: sectionData.dns?.aRecords?.length || 0 },
      { type: 'MX', count: sectionData.dns?.mxRecords?.length || 0 },
      { type: 'NS', count: sectionData.dns?.nsRecords?.length || 0 },
      { type: 'TXT', count: sectionData.dns?.txtRecords?.length || 0 },
    ];

    // Subdomain Bars
    const subdomainBars = (sectionData.subdomains?.entries || []).slice(0, 4).map((sub: any) => ({
      name: sub.subdomain,
      value: 1,
      ip: sub.ip || 'Unknown',
    }));

    // Port Service Bars
    const portServiceBars: any[] = [];
    const svcMap = new Map<string, number>();
    (sectionData.ports?.entries || []).forEach((p: any) => {
      const svc = p.service || 'unknown';
      svcMap.set(svc, (svcMap.get(svc) || 0) + 1);
    });
    for (const [service, cnt] of svcMap) {
      portServiceBars.push({ service, value: cnt });
    }

    // SSL Pie
    const sslPie = [];
    if (sectionData.ssl?.validFrom && sectionData.ssl?.validUntil) {
      const vf = new Date(sectionData.ssl.validFrom).getTime();
      const vu = new Date(sectionData.ssl.validUntil).getTime();
      const now = Date.now();
      const total = vu - vf;
      const elapsed = now - vf;
      sslPie.push({ name: 'Elapsed', value: Math.max(0, elapsed) });
      sslPie.push({ name: 'Remaining', value: Math.max(0, total - elapsed) });
    }

    // Header Breakdown
    const headerBreakdown = [
      { name: 'Present', value: 0 },
      { name: 'Missing', value: 0 },
    ];
    (sectionData.web?.analyses || []).forEach((analysis: any) => {
      analysis.headers?.forEach((hdr: any) => {
        if (hdr.status === 'present') headerBreakdown[0].value++;
        else headerBreakdown[1].value++;
      });
    });

    // Technology Counts
    const technologyCounts: any[] = [];
    const techMap = new Map<string, number>();
    (sectionData.web?.analyses || []).forEach((analysis: any) => {
      analysis.technologies?.forEach((tech: string) => {
        techMap.set(tech, (techMap.get(tech) || 0) + 1);
      });
    });
    for (const [tech, cnt] of techMap) {
      technologyCounts.push({ tech, value: cnt });
    }

    // Breach Pie
    const breachPie = [
      { name: 'Breached', value: 0 },
      { name: 'Clean', value: 0 },
    ];
    (sectionData.breach?.results || []).forEach((entry: any) => {
      if (entry.message?.toLowerCase().includes('error') || entry.message?.toLowerCase().includes('401')) {
        // error case, we still note the attempt
      } else {
        breachPie[0].value++;
      }
    });
    if (breachPie[0].value === 0 && sectionData.breach?.results?.length) {
      breachPie[1].value = sectionData.breach.results.length;
    }

    // Geo Bars
    const geoBars: any[] = [];
    const geoMap = new Map<string, number>();
    (sectionData.geo?.locations || []).forEach((loc: any) => {
      const country = loc.country || 'Unknown';
      geoMap.set(country, (geoMap.get(country) || 0) + 1);
    });
    for (const [country, cnt] of geoMap) {
      geoBars.push({ country, value: cnt });
    }

    // Business Bars
    const businessBars = [
      { name: 'Infrastructure', value: sectionData.business?.infrastructureProviders?.length || 0 },
      { name: 'Related Entities', value: sectionData.business?.relatedEntities?.length || 0 },
      { name: 'Profile Fields', value: Object.keys(sectionData.business?.companyProfile || {}).length },
    ];

    return {
      whoisPie,
      dnsCounts,
      subdomainBars,
      portServiceBars,
      sslPie,
      headerBreakdown,
      technologyCounts,
      breachPie,
      geoBars,
      businessBars,
    };
  }, [scan]);

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
            <HistoryIcon size={16} />
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

            {/* Comprehensive Visualization Cards */}
            {visualization && scan.parsed && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 1. WHOIS */}
                <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-emerald-400 font-semibold">
                        1. COMPREHENSIVE WHOIS REGISTRATION DETAILS
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        {scan.parsed.whois?.domain || scan.target || 'WHOIS Insights'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Registrar: {scan.parsed.whois?.registrar || 'Unknown'}
                      </p>
                    </div>
                    <Shield className="text-emerald-400 w-8 h-8" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-300">
                    <div className="space-y-2">
                      <p>Created: <span className="text-white">{scan.parsed.whois?.creationDate || 'N/A'}</span></p>
                      <p>Expires: <span className="text-white">{scan.parsed.whois?.expirationDate || 'N/A'}</span></p>
                      <p>Contacts: <span className="text-white">{scan.parsed.whois?.contactEmails?.length || 0}</span></p>
                    </div>
                    <div className="h-40">
                      {visualization.whoisPie.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={visualization.whoisPie} dataKey="value" outerRadius={70} label>
                              <Cell fill="#34d399" />
                              <Cell fill="#0f172a" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-gray-500">Insufficient WHOIS timeline data.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide mb-1">Name Servers</p>
                      <ul className="space-y-1">
                        {scan.parsed.whois?.nameServers?.length
                          ? scan.parsed.whois.nameServers.map((ns: string) => <li key={ns}>{ns}</li>)
                          : <li>Not reported</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide mb-1">Contact Emails</p>
                      <ul className="space-y-1">
                        {scan.parsed.whois?.contactEmails?.length
                          ? scan.parsed.whois.contactEmails.map((mail: string) => <li key={mail}>{mail}</li>)
                          : <li>Not reported</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 2. DNS */}
                <div className="bg-gray-900/60 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-cyan-400 font-semibold">
                        2. ENHANCED DNS CONFIGURATION ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">DNS Surface</h3>
                      <p className="text-sm text-gray-400">
                        DNSSEC: {scan.parsed.dns?.dnssecEnabled ? 'Enabled' : 'Not enabled'}
                      </p>
                    </div>
                    <Radar className="text-cyan-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.dnsCounts.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualization.dnsCounts}>
                          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                          <XAxis dataKey="type" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">DNS records not detected.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-2">
                    <p><span className="text-gray-400">A Records:</span> {scan.parsed.dns?.aRecords.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">MX Records:</span> {scan.parsed.dns?.mxRecords.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">SPF:</span> {scan.parsed.dns?.spfRecord || 'Not published'}</p>
                  </div>
                </div>

                {/* 3. Subdomains */}
                <div className="bg-gray-900/60 border border-purple-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-purple-400 font-semibold">
                        3. COMPREHENSIVE SUBDOMAIN ENUMERATION
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        {scan.parsed.subdomains?.total || scan.parsed.subdomains?.entries.length || 0} Subdomains
                      </h3>
                      <p className="text-sm text-gray-400">Top resolved hosts with IP visibility</p>
                    </div>
                    <Globe className="text-purple-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.subdomainBars.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualization.subdomainBars} layout="vertical" margin={{ left: 40 }}>
                          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                          <XAxis type="number" stroke="#9ca3af" hide />
                          <YAxis dataKey="name" type="category" stroke="#9ca3af" width={180} />
                          <Tooltip formatter={(_, __, item: any) => item.payload.ip} />
                          <Bar dataKey="value" fill="#a855f7" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No subdomains reported.</p>
                    )}
                  </div>
                </div>

                {/* 4. Ports */}
                <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-amber-400 font-semibold">
                        4. ADVANCED PORT SCANNING & SERVICE DETECTION
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        {scan.parsed.ports?.total || scan.parsed.ports?.entries.length || 0} Open Ports
                      </h3>
                      <p className="text-sm text-gray-400">Most common exposed services</p>
                    </div>
                    <Server className="text-amber-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.portServiceBars.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualization.portServiceBars}>
                          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                          <XAxis dataKey="service" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#fbbf24" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No open ports detected.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 max-h-32 overflow-y-auto">
                    {scan.parsed.ports?.entries?.slice(0, 8).map((entry: any) => (
                      <p key={`${entry.ip}-${entry.port}`}>
                        {entry.ip}:{entry.port} • {entry.service} ({entry.status})
                      </p>
                    )) || <p>No port table available.</p>}
                  </div>
                </div>

                {/* 5. SSL */}
                <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-blue-400 font-semibold">
                        5. SSL/TLS CERTIFICATE ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">Certificate Posture</h3>
                      <p className="text-sm text-gray-400">{scan.parsed.ssl?.issuer || 'Issuer unknown'}</p>
                    </div>
                    <Lock className="text-blue-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.sslPie.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={visualization.sslPie} dataKey="value" outerRadius={70} label>
                            <Cell fill="#3b82f6" />
                            <Cell fill="#0f172a" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No certificate window detected.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-1">
                    <p><span className="text-gray-400">Subject:</span> {scan.parsed.ssl?.subject || 'N/A'}</p>
                    <p><span className="text-gray-400">Valid From:</span> {scan.parsed.ssl?.validFrom || 'N/A'}</p>
                    <p><span className="text-gray-400">Valid Until:</span> {scan.parsed.ssl?.validUntil || 'N/A'}</p>
                    <p><span className="text-gray-400">Signature:</span> {scan.parsed.ssl?.signatureAlgorithm || 'N/A'}</p>
                  </div>
                </div>

                {/* 6. Web Tech */}
                <div className="bg-gray-900/60 border border-pink-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-pink-400 font-semibold">
                        6. COMPREHENSIVE WEB TECHNOLOGY ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">Security Headers & Tech Stack</h3>
                      <p className="text-sm text-gray-400">
                        {scan.parsed.web?.analyses?.length || 0} endpoints inspected
                      </p>
                    </div>
                    <ActivityIcon className="text-pink-400 w-8 h-8" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="h-36">
                      {visualization.headerBreakdown.some((d) => d.value) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visualization.headerBreakdown}>
                            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#ec4899" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-gray-500">Header insights unavailable.</p>
                      )}
                    </div>
                    <div className="h-36">
                      {visualization.technologyCounts.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visualization.technologyCounts} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                            <XAxis type="number" stroke="#9ca3af" />
                            <YAxis dataKey="tech" type="category" stroke="#9ca3af" width={150} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#f472b6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-gray-500">Technologies not disclosed.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-red-300 space-y-1 max-h-24 overflow-y-auto">
                    {scan.parsed.web?.analyses?.flatMap((analysis: any) =>
                      analysis.criticalFindings.map((finding: string) => (
                        <p key={`${analysis.target}-${finding}`}>
                          {analysis.target}: {finding}
                        </p>
                      ))
                    ) || <p className="text-gray-400">No critical findings reported.</p>}
                  </div>
                </div>

                {/* 7. Data Breach */}
                <div className="bg-gray-900/60 border border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-red-400 font-semibold">
                        7. REAL DATA BREACH ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">Breached Accounts</h3>
                      <p className="text-sm text-gray-400">
                        HIBP Checks: {scan.parsed.breach?.results?.length || 0}
                      </p>
                    </div>
                    <AlertTriangle className="text-red-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {(visualization.breachPie.some((d) => d.value)) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={visualization.breachPie} dataKey="value" innerRadius={40} outerRadius={70} label>
                            <Cell fill="#ef4444" />
                            <Cell fill="#0f172a" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No breach verdicts returned.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-1 max-h-24 overflow-y-auto">
                    {scan.parsed.breach?.results?.length
                      ? scan.parsed.breach.results.map((entry: any) => (
                          <p key={entry.email}>
                            {entry.email}: {entry.message}
                          </p>
                        ))
                      : <p>No breach queries executed.</p>}
                  </div>
                </div>

                {/* 8. WAF Detection */}
                <div className="bg-gray-900/60 border border-indigo-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-indigo-400 font-semibold">
                        8. WEB APPLICATION FIREWALL DETECTION
                      </p>
                      <h3 className="text-xl font-semibold text-white">Perimeter Shielding</h3>
                      <p className="text-sm text-gray-400">Detection insights per endpoint</p>
                    </div>
                    <Shield className="text-indigo-400 w-8 h-8" />
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-2">
                    {scan.parsed.waf?.detections.length
                      ? scan.parsed.waf.detections.map((det: any) => (
                          <p key={det.target}>
                            {det.message} • {det.target}
                          </p>
                        ))
                      : <p>No WAF signals identified.</p>}
                  </div>
                </div>

                {/* 9. IP Geolocation */}
                <div className="bg-gray-900/60 border border-green-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-green-400 font-semibold">
                        9. IP GEOLOCATION & NETWORK ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">Global Footprint</h3>
                      <p className="text-sm text-gray-400">
                        {scan.parsed.geo?.locations?.length || 0} network assets
                      </p>
                    </div>
                    <Globe2 className="text-green-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.geoBars.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualization.geoBars}>
                          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                          <XAxis dataKey="country" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No geolocation data.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-1 max-h-24 overflow-y-auto">
                    {scan.parsed.geo?.locations?.map((loc: any) => (
                      <p key={loc.ip}>
                        {loc.ip} • {loc.organization || 'Unknown'} ({loc.country || '??'})
                      </p>
                    )) || <p>No IP intelligence.</p>}
                  </div>
                </div>

                {/* 10. Business Intelligence */}
                <div className="bg-gray-900/60 border border-yellow-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-yellow-400 font-semibold">
                        10. BUSINESS INTELLIGENCE & CONTEXT ANALYSIS
                      </p>
                      <h3 className="text-xl font-semibold text-white">Organization Context</h3>
                      <p className="text-sm text-gray-400">Entities & providers discovered</p>
                    </div>
                    <Building2 className="text-yellow-400 w-8 h-8" />
                  </div>
                  <div className="h-40 mt-4">
                    {visualization.businessBars.some((d) => d.value) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualization.businessBars}>
                          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#facc15" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-500">No business intelligence extracted.</p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-300 space-y-1">
                    <p><span className="text-gray-400">Providers:</span> {scan.parsed.business?.infrastructureProviders?.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">Related Entities:</span> {scan.parsed.business?.relatedEntities?.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">Profile:</span> {JSON.stringify(scan.parsed.business?.companyProfile || {})}</p>
                  </div>
                </div>

                {/* Vulnerability graphs (live vs comprehensive) */}
                <div className="xl:col-span-2">
                  <VulnerabilityGraphs sectionData={scan.parsed} plainOutput={scan.parsed?.plainOutput || scan.stdout || null} />
                </div>
              </div>
            )}

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
