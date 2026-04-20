import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import VulnerabilityGraphs from '@/components/VulnerabilityGraphs';
import { ChevronDown, ChevronUp, Download, FileText, History as HistoryIcon, Shield, Radar, Globe, Server, Activity as ActivityIcon, Lock, AlertTriangle, Globe2, Building2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { parseAssessmentSections } from './AssessmentPage';
import MatrixBackground from '@/components/ui/MatrixBackground';

// Helper function to clean unwanted footer lines from scan output
const cleanScanOutput = (output: string): string => {
  const lines = output.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    // Remove lines related to report generation footer
    if (trimmed === 'GENERATING COMPREHENSIVE OSINT REPORT') return false;
    if (trimmed.startsWith('[+] Professional report generated:')) return false;
    if (trimmed.startsWith('Report Location:')) return false;
    if (trimmed === 'Enhanced scan completed successfully!' || trimmed === 'ENHANCED SCAN COMPLETE!') return false;
    if (trimmed.startsWith("Check the '") && trimmed.includes("' directory for complete results")) return false;
    if (trimmed.startsWith("Enhanced scan completed successfully!")) return false;
    // Remove standalone separator lines at the end
    if (/^={3,}$/.test(trimmed)) {
      const lineIndex = lines.indexOf(line);
      const remainingLines = lines.slice(lineIndex + 1).filter(l => l.trim() !== '');
      // Only remove if it's one of the last few separators
      if (remainingLines.length < 3) return false;
    }
    return true;
  });
  return filtered.join('\n').trim();
};

const OutputPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<any | null>(null);
  const [outputExpanded, setOutputExpanded] = useState(false);

  // Parse section data first (same as AssessmentPage)
  const sectionData = useMemo(() => {
    if (!scan?.parsed) {
      console.log('No scan.parsed available');
      return null;
    }
    console.log('Raw scan.parsed:', scan.parsed);
    console.log('plainOutput available:', !!scan.parsed.plainOutput);
    console.log('stdout available:', !!scan.stdout);
    
    const plainText = scan.parsed.plainOutput || scan.stdout || '';
    console.log('Plain text length:', plainText.length);
    console.log('First 500 chars:', plainText.substring(0, 500));
    
    // Parse structured sections from plainOutput (same as AssessmentPage)
    const parsed = parseAssessmentSections(plainText, scan.parsed);
    console.log('Parsed sectionData:', parsed);
    console.log('Has whois:', !!parsed?.whois);
    console.log('Has dns:', !!parsed?.dns);
    console.log('Has subdomains:', !!parsed?.subdomains);
    console.log('Has ports:', !!parsed?.ports);
    
    return parsed;
  }, [scan]);

  // Compute visualization data (EXACT COPY from AssessmentPage)
  const visualization = useMemo(() => {
    if (!sectionData) {
      console.log('No sectionData for visualization');
      return null;
    }
    console.log('Computing visualization from sectionData:', {
      hasWhois: !!sectionData.whois,
      hasDns: !!sectionData.dns,
      hasSubdomains: !!sectionData.subdomains,
      hasPorts: !!sectionData.ports,
      whoisData: sectionData.whois,
      dnsData: sectionData.dns,
      subdomainsData: sectionData.subdomains,
      portsData: sectionData.ports,
      sslData: sectionData.ssl,
      webData: sectionData.web,
      breachData: sectionData.breach,
      geoData: sectionData.geo,
      businessData: sectionData.business,
    });
    const parseDate = (value?: string) => (value ? new Date(value) : null);
    const msToDays = (ms: number) => Math.max(ms / (1000 * 60 * 60 * 24), 0);

    const whois = sectionData.whois;
    let whoisPie: Array<{ name: string; value: number }> = [];
    if (whois?.creationDate && whois?.expirationDate) {
      const creation = parseDate(whois.creationDate);
      const expiration = parseDate(whois.expirationDate);
      if (creation && expiration && expiration > creation) {
        const total = expiration.getTime() - creation.getTime();
        const elapsed = Date.now() - creation.getTime();
        const remaining = expiration.getTime() - Date.now();
        whoisPie = [
          { name: 'Elapsed', value: Number(msToDays(elapsed).toFixed(2)) },
          { name: 'Remaining', value: Number(msToDays(remaining).toFixed(2)) },
        ];
      }
    }

    const dnsCounts = sectionData.dns
      ? [
          { type: 'A', count: sectionData.dns.aRecords.length },
          { type: 'MX', count: sectionData.dns.mxRecords.length },
          { type: 'NS', count: sectionData.dns.nsRecords.length },
          { type: 'TXT', count: sectionData.dns.txtRecords.length },
        ]
      : [];

    const subdomainBars = (sectionData.subdomains?.entries || []).slice(0, 8).map((entry: any, idx: number) => ({
      name: entry.subdomain,
      value: entry.ip ? 2 : 1,
      ip: entry.ip || `Listed #${idx + 1}`,
    }));

    const portServiceBars = (() => {
      const counts: Record<string, number> = {};
      (sectionData.ports?.entries || []).forEach((entry: any) => {
        const key = entry.service?.toUpperCase() || 'UNKNOWN';
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.keys(counts)
        .map((service) => ({ service, value: counts[service] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    })();

    const sslPie = (() => {
      if (!sectionData.ssl?.validFrom || !sectionData.ssl?.validUntil) return [];
      const start = parseDate(sectionData.ssl.validFrom);
      const end = parseDate(sectionData.ssl.validUntil);
      if (!start || !end || end <= start) return [];
      const total = end.getTime() - start.getTime();
      const elapsed = Date.now() - start.getTime();
      const remaining = end.getTime() - Date.now();
      return [
        { name: 'Valid', value: Number(msToDays(Math.min(elapsed, total)).toFixed(2)) },
        { name: 'Days left', value: Number(msToDays(Math.max(remaining, 0)).toFixed(2)) },
      ];
    })();

    const headerBreakdown = (() => {
      let present = 0;
      let missing = 0;
      (sectionData.web?.analyses || []).forEach((analysis: any) => {
        analysis.headers.forEach((header: any) => {
          if (header.status === 'present') present += 1;
          else missing += 1;
        });
      });
      return [
        { name: 'Present', value: present },
        { name: 'Missing', value: missing },
      ];
    })();

    const technologyCounts = (() => {
      const counts: Record<string, number> = {};
      (sectionData.web?.analyses || []).forEach((analysis: any) => {
        analysis.technologies.forEach((tech: string) => {
          counts[tech] = (counts[tech] || 0) + 1;
        });
      });
      return Object.keys(counts).map((tech) => ({ tech, value: counts[tech] }));
    })();

    const breachPie = (() => {
      const summary = { clean: 0, error: 0 };
      (sectionData.breach?.results || []).forEach((result: any) => {
        if (result.status === 'clean') summary.clean += 1;
        else summary.error += 1;
      });
      return [
        { name: 'No Breaches', value: summary.clean },
        { name: 'Errors', value: summary.error },
      ];
    })();

    const geoBars = (() => {
      const counts: Record<string, number> = {};
      (sectionData.geo?.locations || []).forEach((loc: any) => {
        const country = loc.country || 'Unknown';
        counts[country] = (counts[country] || 0) + 1;
      });
      return Object.keys(counts).map((country) => ({ country, value: counts[country] }));
    })();

    const businessBars = (() => {
      const infra = sectionData.business?.infrastructureProviders?.length || 0;
      const related = sectionData.business?.relatedEntities?.length || 0;
      const profile = sectionData.business?.companyProfile
        ? Object.keys(sectionData.business.companyProfile).length
        : 0;
      return [
        { name: 'Infrastructure', value: infra },
        { name: 'Related Entities', value: related },
        { name: 'Profile Fields', value: profile },
      ];
    })();

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
  }, [sectionData]);

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
        
        // Use scan metadata from data.scan (contains status, startTime, endTime)
        // and result data from data.result (contains parsed output)
        const scanInfo = data.scan || {};
        const resultData = data.result || {};
        
        // Merge scan metadata with result data
        const fullScan = {
          ...resultData,
          status: scanInfo.status || data.status || 'unknown',
          startTime: scanInfo.startTime || scanInfo.createdAt,
          endTime: scanInfo.endTime || scanInfo.updatedAt,
          target: scanInfo.target || resultData.target,
          jobId: scanInfo.jobId || data.jobId,
          parsed: resultData.parsed || scanInfo.parsed,
          stdout: resultData.stdout || scanInfo.stdout,
          stderr: resultData.stderr || scanInfo.stderr,
        };
        
        console.log('Fetched scan data:', { scan: scanInfo, result: resultData, merged: fullScan });
        setScan(fullScan);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch scan');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="p-8 min-h-screen bg-jetBlack text-coolWhite relative">
        <MatrixBackground />
        <div className="max-w-5xl mx-auto mt-20 relative z-10">
          <div className="text-center mb-12">
            <FileText className="mx-auto mb-4 text-gray-500" size={64} />
            <h2 className="text-3xl font-bold mb-2">No Scan Output Available</h2>
            <p className="text-gray-400">Choose an option below to view scan results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start New Scan Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-900/40 via-sky-800/30 to-sky-900/40 border border-sky-700/50 hover:border-sky-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-8 flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 rounded-full bg-sky-600/20 flex items-center justify-center mb-4 group-hover:bg-sky-600/30 transition-colors">
                  <Shield className="text-sky-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-sky-300">Start New Scan</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Initiate a comprehensive security assessment from the Assessment page to view detailed outputs and results.
                </p>
                <button 
                  className="w-full px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold transition-colors duration-200 shadow-lg hover:shadow-sky-500/50"
                  onClick={() => navigate('/osint/assessment')}
                >
                  Go to Assessment Page
                </button>
              </div>
            </div>

            {/* View History Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-8 flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors">
                  <HistoryIcon className="text-purple-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-purple-300">View Previous Scans</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Browse your scan history to review previous assessment results and download detailed reports.
                </p>
                <button 
                  className="w-full px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold transition-colors duration-200 shadow-lg hover:shadow-purple-500/50"
                  onClick={() => navigate('/osint/assessment/history')}
                >
                  Go to History Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-jetBlack text-coolWhite relative">
      <MatrixBackground />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText size={28} className="text-white" />
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
            {visualization && scan.parsed && sectionData && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 1. WHOIS */}
                <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-emerald-400 font-semibold">
                        1. COMPREHENSIVE WHOIS REGISTRATION DETAILS
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        {sectionData.whois?.domain || scan.target || 'WHOIS Insights'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Registrar: {sectionData.whois?.registrar || 'Unknown'}
                      </p>
                    </div>
                    <Shield className="text-emerald-400 w-8 h-8" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-300">
                    <div className="space-y-2">
                      <p>Created: <span className="text-white">{sectionData.whois?.creationDate || 'N/A'}</span></p>
                      <p>Expires: <span className="text-white">{sectionData.whois?.expirationDate || 'N/A'}</span></p>
                      <p>Contacts: <span className="text-white">{sectionData.whois?.contactEmails?.length || 0}</span></p>
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
                        {sectionData.whois?.nameServers?.length
                          ? sectionData.whois.nameServers.map((ns: string) => <li key={ns}>{ns}</li>)
                          : <li>Not reported</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wide mb-1">Contact Emails</p>
                      <ul className="space-y-1">
                        {sectionData.whois?.contactEmails?.length
                          ? sectionData.whois.contactEmails.map((mail: string) => <li key={mail}>{mail}</li>)
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
                        DNSSEC: {sectionData.dns?.dnssecEnabled ? 'Enabled' : 'Not enabled'}
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
                    <p><span className="text-gray-400">A Records:</span> {sectionData.dns?.aRecords.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">MX Records:</span> {sectionData.dns?.mxRecords.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">SPF:</span> {sectionData.dns?.spfRecord || 'Not published'}</p>
                  </div>

                  {/* checkdmarc enrichment */}
                  {(sectionData.dns?.dmarcRecord || sectionData.dns?.dmarcPolicy || sectionData.dns?.spfValid != null || sectionData.dns?.mtaSts || sectionData.dns?.mxHosts) && (
                    <div className="mt-5 border-t border-cyan-500/10 pt-4">
                      <p className="text-xs font-semibold text-cyan-300 mb-3 tracking-wide">EMAIL SECURITY (checkdmarc)</p>

                      {/* DMARC */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${sectionData.dns?.dmarcValid ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-xs font-medium text-gray-200">DMARC</span>
                          {sectionData.dns?.dmarcPolicy && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              sectionData.dns.dmarcPolicy === 'reject' ? 'bg-green-500/20 text-green-300' :
                              sectionData.dns.dmarcPolicy === 'quarantine' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              p={sectionData.dns.dmarcPolicy}
                            </span>
                          )}
                        </div>
                        {sectionData.dns?.dmarcRecord && (
                          <p className="text-[11px] text-gray-400 break-all font-mono bg-gray-800/60 rounded px-2 py-1">{sectionData.dns.dmarcRecord}</p>
                        )}
                        {!sectionData.dns?.dmarcRecord && (
                          <p className="text-[11px] text-red-400">No DMARC record found — domain is vulnerable to email spoofing</p>
                        )}
                        {sectionData.dns?.dmarcWarnings && sectionData.dns.dmarcWarnings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {sectionData.dns.dmarcWarnings.map((w, i) => (
                              <p key={i} className="text-[10px] text-yellow-400">⚠ {w}</p>
                            ))}
                          </div>
                        )}
                        {sectionData.dns?.dmarcRua && sectionData.dns.dmarcRua.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5">Aggregate reports → {sectionData.dns.dmarcRua.map(r => typeof r === 'object' ? JSON.stringify(r) : r).join(', ')}</p>
                        )}
                      </div>

                      {/* SPF enhanced */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${sectionData.dns?.spfValid ? 'bg-green-400' : sectionData.dns?.spfValid === false ? 'bg-red-400' : 'bg-gray-500'}`} />
                          <span className="text-xs font-medium text-gray-200">SPF</span>
                          {sectionData.dns?.spfDnsLookups != null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              sectionData.dns.spfDnsLookups > 10 ? 'bg-red-500/20 text-red-300' :
                              sectionData.dns.spfDnsLookups > 7 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {sectionData.dns.spfDnsLookups}/10 lookups
                            </span>
                          )}
                        </div>
                        {sectionData.dns?.spfWarnings && sectionData.dns.spfWarnings.length > 0 && (
                          <div className="space-y-0.5">
                            {sectionData.dns.spfWarnings.map((w, i) => (
                              <p key={i} className="text-[10px] text-yellow-400">⚠ {w}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MTA-STS */}
                      {sectionData.dns?.mtaSts && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${sectionData.dns.mtaSts.valid ? 'bg-green-400' : 'bg-gray-500'}`} />
                            <span className="text-xs font-medium text-gray-200">MTA-STS</span>
                            {sectionData.dns.mtaSts.policy?.mode && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/20 text-blue-300">
                                mode={sectionData.dns.mtaSts.policy.mode}
                              </span>
                            )}
                          </div>
                          {sectionData.dns.mtaSts.warnings && sectionData.dns.mtaSts.warnings.length > 0 && (
                            <div className="space-y-0.5">
                              {sectionData.dns.mtaSts.warnings.map((w: string, i: number) => (
                                <p key={i} className="text-[10px] text-yellow-400">⚠ {w}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* MX Hosts with TLS */}
                      {sectionData.dns?.mxHosts && sectionData.dns.mxHosts.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 mb-1">MX Hosts:</p>
                          <div className="space-y-1">
                            {sectionData.dns.mxHosts.map((mx, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px]">
                                <span className="text-gray-300 font-mono">{mx.hostname}</span>
                                <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${mx.tls ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {mx.tls ? 'TLS' : 'No TLS'}
                                </span>
                                <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${mx.starttls ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                  {mx.starttls ? 'STARTTLS' : 'No STARTTLS'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Subdomains */}
                <div className="bg-gray-900/60 border border-purple-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-purple-400 font-semibold">
                        3. COMPREHENSIVE SUBDOMAIN ENUMERATION
                      </p>
                      <h3 className="text-xl font-semibold text-white">
                        {sectionData.subdomains?.total || sectionData.subdomains?.entries.length || 0} Subdomains
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
                        {sectionData.ports?.total || sectionData.ports?.entries.length || 0} Open Ports
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
                    {sectionData.ports?.entries?.slice(0, 8).map((entry: any) => (
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
                      <p className="text-sm text-gray-400">{sectionData.ssl?.issuer || 'Issuer unknown'}</p>
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
                    <p><span className="text-gray-400">Subject:</span> {sectionData.ssl?.subject || 'N/A'}</p>
                    <p><span className="text-gray-400">Valid From:</span> {sectionData.ssl?.validFrom || 'N/A'}</p>
                    <p><span className="text-gray-400">Valid Until:</span> {sectionData.ssl?.validUntil || 'N/A'}</p>
                    <p><span className="text-gray-400">Signature:</span> {sectionData.ssl?.signatureAlgorithm || 'N/A'}</p>
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
                        {sectionData.web?.analyses?.length || 0} endpoints inspected
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
                    {sectionData.web?.analyses?.flatMap((analysis: any) =>
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
                        HIBP Checks: {sectionData.breach?.results?.length || 0}
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
                    {sectionData.breach?.results?.length
                      ? sectionData.breach.results.map((entry: any) => (
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
                    {sectionData.waf?.detections.length
                      ? sectionData.waf.detections.map((det: any) => (
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
                        {sectionData.geo?.locations?.length || 0} network assets
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
                    {sectionData.geo?.locations?.map((loc: any) => (
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
                    <p><span className="text-gray-400">Providers:</span> {sectionData.business?.infrastructureProviders?.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">Related Entities:</span> {sectionData.business?.relatedEntities?.join(', ') || 'N/A'}</p>
                    <p><span className="text-gray-400">Profile:</span> {JSON.stringify(sectionData.business?.companyProfile || {})}</p>
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
                            {cleanScanOutput(s.content)}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                        {cleanScanOutput(scan.stdout || scan.parsed?.plainOutput || 'No output available')}
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
                <button
                  className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                      const response = await fetch(`${API_BASE_URL}/api/v1/assessment/download/${encodeURIComponent(jobId)}`, {
                        headers: {
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        credentials: 'include',
                      });
                      
                      if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        throw new Error(error.error || 'Failed to download report');
                      }
                      
                      // Get the blob and create a download link
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      
                      // Get filename from Content-Disposition header or use default
                      const contentDisposition = response.headers.get('Content-Disposition');
                      let filename = `assessment_${scan.target}_${jobId.slice(0, 8)}.txt`;
                      if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                        if (filenameMatch) filename = filenameMatch[1];
                      }
                      
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      // Show success message (you can use a toast notification if available)
                      console.log('Report downloaded successfully:', filename);
                    } catch (e: any) {
                      setError(e.message || 'Failed to download report');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <Download size={16} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Downloading...' : 'Download Report'}
                </button>
                <button 
                  className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold transition-colors flex items-center gap-2"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
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
                      
                      const scanInfo = data.scan || {};
                      const resultData = data.result || {};
                      
                      const fullScan = {
                        ...resultData,
                        status: scanInfo.status || data.status || 'unknown',
                        startTime: scanInfo.startTime || scanInfo.createdAt,
                        endTime: scanInfo.endTime || scanInfo.updatedAt,
                        target: scanInfo.target || resultData.target,
                        jobId: scanInfo.jobId || data.jobId,
                        parsed: resultData.parsed || scanInfo.parsed,
                        stdout: resultData.stdout || scanInfo.stdout,
                        stderr: resultData.stderr || scanInfo.stderr,
                      };
                      
                      setScan(fullScan);
                    } catch (e: any) {
                      setError(e.message || 'Failed to refresh data');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <Download size={16} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default OutputPage;
