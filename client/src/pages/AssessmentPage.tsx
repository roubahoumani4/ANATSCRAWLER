import React, { useMemo, useState } from 'react';
import { Shield, Radar, Globe, Server, Activity as ActivityIcon, Lock, AlertTriangle, Globe2, Building2, Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';

type WhoisSection = {
  domain?: string;
  creationDate?: string;
  expirationDate?: string;
  registrar?: string;
  nameServers: string[];
  contactEmails: string[];
};

type DnsSection = {
  aRecords: string[];
  mxRecords: string[];
  nsRecords: string[];
  txtRecords: string[];
  dnssecEnabled: boolean;
  spfRecord?: string;
};

type SubdomainSection = {
  total?: number;
  entries: Array<{ subdomain: string; ip?: string }>;
};

type PortsSection = {
  entries: Array<{ ip: string; port: number; service: string; banner: string; status: string }>;
  total?: number;
};

type SslSection = {
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validUntil?: string;
  signatureAlgorithm?: string;
};

type WebTechSection = {
  analyses: Array<{
    target: string;
    server?: string;
    poweredBy?: string;
    headers: Array<{ name: string; status: 'present' | 'missing' }>;
    technologies: string[];
    criticalFindings: string[];
  }>;
};

type BreachSection = {
  results: Array<{ email: string; status: 'clean' | 'error'; message: string }>;
};

type WafSection = {
  detections: Array<{ target: string; message: string }>;
};

type GeoSection = {
  locations: Array<{ ip: string; organization?: string; country?: string; city?: string; asn?: string }>;
};

type BusinessSection = {
  companyProfile?: Record<string, string>;
  infrastructureProviders: string[];
  relatedEntities: string[];
};

type SectionData = {
  whois?: WhoisSection;
  dns?: DnsSection;
  subdomains?: SubdomainSection;
  ports?: PortsSection;
  ssl?: SslSection;
  web?: WebTechSection;
  breach?: BreachSection;
  waf?: WafSection;
  geo?: GeoSection;
  business?: BusinessSection;
};

const SECTION_DEFS = [
  { key: 'whois', title: 'COMPREHENSIVE WHOIS REGISTRATION DETAILS' },
  { key: 'dns', title: 'ENHANCED DNS CONFIGURATION ANALYSIS' },
  { key: 'subdomains', title: 'COMPREHENSIVE SUBDOMAIN ENUMERATION' },
  { key: 'ports', title: 'ADVANCED PORT SCANNING & SERVICE DETECTION' },
  { key: 'ssl', title: 'SSL/TLS CERTIFICATE ANALYSIS' },
  { key: 'web', title: 'COMPREHENSIVE WEB TECHNOLOGY ANALYSIS' },
  { key: 'breach', title: 'REAL DATA BREACH ANALYSIS' },
  { key: 'waf', title: 'WEB APPLICATION FIREWALL DETECTION' },
  { key: 'geo', title: 'IP GEOLOCATION & NETWORK ANALYSIS' },
  { key: 'business', title: 'BUSINESS INTELLIGENCE & CONTEXT ANALYSIS' },
];

const sanitizeList = (block: string): string[] =>
  block
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•]\s*/, '').trim())
    .filter(Boolean);

const extractBlock = (plain: string, targetTitle: string) => {
  const upper = plain.toUpperCase();
  const normalizedTitle = targetTitle.toUpperCase();
  const start = upper.indexOf(normalizedTitle);
  if (start === -1) return '';
  let end = upper.length;
  SECTION_DEFS.forEach(({ title }) => {
    if (title === targetTitle) return;
    const idx = upper.indexOf(title.toUpperCase(), start + normalizedTitle.length);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  });
  return plain.slice(start, end).replace(targetTitle, '').trim();
};

const extractKeyValue = (block: string, label: string) => {
  const match = block.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
  return match ? match[1].trim() : undefined;
};

const extractListAfterLabel = (block: string, label: string) => {
  const match = block.match(
    new RegExp(`${label}:[\\s\\S]*?(?=\\n\\s*[A-Z0-9_][A-Za-z0-9 _\\-/\\.]+:\\s|$)`, 'i')
  );
  if (!match) return [];
  const cleaned = match[0].split(/\r?\n/).slice(1).join('\n');
  return sanitizeList(cleaned);
};

const parsePortEntries = (
  text: string,
  fallback: Array<{ ip: string; port: number; service: string; banner: string; status: string }> | null = null
) => {
  const entries: Array<{ ip: string; port: number; service: string; banner: string; status: string }> = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^IP\s+/i.test(line) || /^[-=]/.test(line)) continue;
    const match = line.match(
      /^(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,5})\s+([A-Za-z0-9\-\/\+]+)\s+(.*?)\s+(OPEN|CLOSED|FILTERED)$/i
    );
    if (match) {
      const [, ip, portStr, service, banner, status] = match;
      entries.push({
        ip,
        port: Number(portStr),
        service,
        banner: banner.trim(),
        status: status.toUpperCase(),
      });
      continue;
    }
    const fallbackMatch = line.match(/(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,5})/);
    if (fallbackMatch) {
      const [, ip, portStr] = fallbackMatch;
      entries.push({ ip, port: Number(portStr), service: 'unknown', banner: line, status: 'OPEN' });
    }
  }
  if (!entries.length && fallback) {
    return fallback;
  }
  return entries;
};

const parseAssessmentSections = (plain: string | null, parsedExtras?: any): SectionData | null => {
  if (!plain) return null;
  const data: SectionData = {};

  SECTION_DEFS.forEach(({ key, title }) => {
    const block = extractBlock(plain, title);
    if (!block) return;

    if (key === 'whois') {
      data.whois = {
        domain: extractKeyValue(block, 'Domain'),
        creationDate: extractKeyValue(block, 'Creation Date'),
        expirationDate: extractKeyValue(block, 'Expiration Date'),
        registrar: extractKeyValue(block, 'Registrar'),
        nameServers: extractListAfterLabel(block, 'Name Servers'),
        contactEmails: extractListAfterLabel(block, 'Contact Emails'),
      };
      return;
    }

    if (key === 'dns') {
      const dnssecLine = block.match(/DNSSEC.+(enabled|not enabled)/i);
      data.dns = {
        aRecords: extractListAfterLabel(block, 'A Records'),
        mxRecords: extractListAfterLabel(block, 'MX Records'),
        nsRecords: extractListAfterLabel(block, 'NS Records'),
        txtRecords: extractListAfterLabel(block, 'TXT Records'),
        dnssecEnabled: dnssecLine ? /NOT/.test(dnssecLine[0].toUpperCase()) === false : false,
        spfRecord: extractKeyValue(block, 'Record'),
      };
      return;
    }

    if (key === 'subdomains') {
      const entries: Array<{ subdomain: string; ip?: string }> = [];
      const matches = Array.from(block.matchAll(/\[\+\]\s+([a-z0-9\.\-]+\.[a-z]{2,})\s*->\s*([\d\.]+)/gi));
      matches.forEach((m) => entries.push({ subdomain: m[1], ip: m[2] }));
      const bulletMatches = Array.from(block.matchAll(/-\s+([a-z0-9\.\-]+\.[a-z]{2,})/gi));
      bulletMatches.forEach((m) => {
        if (!entries.find((e) => e.subdomain === m[1])) entries.push({ subdomain: m[1] });
      });
      const totalMatch = block.match(/Total unique subdomains found:\s*(\d+)/i);
      data.subdomains = {
        entries,
        total: totalMatch ? Number(totalMatch[1]) : entries.length || undefined,
      };
      return;
    }

    if (key === 'ports') {
      const tableMatch = block.match(/OPEN PORTS:[\s\S]*$/i);
      const entries = parsePortEntries(
        tableMatch ? tableMatch[0] : block,
        parsedExtras?.openPortsEntries || null
      );
      data.ports = {
        entries,
        total: parsedExtras?.openPorts || entries.length,
      };
      return;
    }

    if (key === 'ssl') {
      data.ssl = {
        subject: extractKeyValue(block, 'Subject'),
        issuer: extractKeyValue(block, 'Issuer'),
        validFrom: extractKeyValue(block, 'Valid From'),
        validUntil: extractKeyValue(block, 'Valid Until'),
        signatureAlgorithm: extractKeyValue(block, 'Signature Algorithm'),
      };
      return;
    }

    if (key === 'web') {
      const analyses: WebTechSection['analyses'] = [];
      const segments = Array.from(
        block.matchAll(/Analyzing:\s*([^\n]+)\n([\s\S]*?)(?=Analyzing:|\n\d+\.\s|$)/g)
      );
      segments.forEach(([, target, body]) => {
        const headers: Array<{ name: string; status: 'present' | 'missing' }> = [];
        const headerMatches = body.match(/[+\-!]\]\s+([A-Za-z\-]+):\s+(MISSING|present)/gi);
        if (headerMatches) {
          headerMatches.forEach((line) => {
            const m = line.match(/([A-Za-z\-]+):\s*(MISSING|present)/i);
            if (m) {
              headers.push({ name: m[1], status: /MISSING/i.test(m[2]) ? 'missing' : 'present' });
            }
          });
        }
        const technologyMatches = Array.from(body.matchAll(/Technology:\s*([^\n]+)/g)).map((m) => m[1].trim());
        const criticals = Array.from(body.matchAll(/\[🔴\s+CRITICAL\]\s+([^\n]+)/g)).map((m) => m[1].trim());
        analyses.push({
          target: target.trim(),
          server: extractKeyValue(body, 'Server'),
          poweredBy: extractKeyValue(body, 'Powered-By'),
          headers,
          technologies: technologyMatches,
          criticalFindings: criticals,
        });
      });
      data.web = { analyses };
      return;
    }

    if (key === 'breach') {
      const results: BreachSection['results'] = [];
      const noBreachMatches = Array.from(block.matchAll(/\[\+\]\s+No breaches found for\s+([^\s]+)/gi));
      noBreachMatches.forEach((m) =>
        results.push({ email: m[1], status: 'clean', message: 'No breaches found' })
      );
      const errorMatches = Array.from(block.matchAll(/\[-\]\s+HIBP API error:\s*(\d+)/gi));
      errorMatches.forEach((m, idx) => {
        results[idx] = {
          ...(results[idx] || { email: `request_${idx + 1}` }),
          status: 'error',
          message: `HIBP API error ${m[1]}`,
        };
      });
      data.breach = { results };
      return;
    }

    if (key === 'waf') {
      const detections: WafSection['detections'] = [];
      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      lines.forEach((line) => {
        const match = line.match(/(No WAF detected on|WAF detected on)\s+(.+)/i);
        if (match) {
          detections.push({ target: match[2].trim(), message: match[1] });
        }
      });
      data.waf = { detections };
      return;
    }

    if (key === 'geo') {
      const locations: GeoSection['locations'] = [];
      const geoMatches = Array.from(block.matchAll(/IP:\s*([^\n]+)\n([\s\S]*?)(?=IP:|10\.\s|$)/g));
      geoMatches.forEach(([, ip, body]) => {
        locations.push({
          ip: ip.trim(),
          organization: extractKeyValue(body, 'Organization'),
          country: extractKeyValue(body, 'Country'),
          city: extractKeyValue(body, 'City'),
          asn: extractKeyValue(body, 'ASN'),
        });
      });
      data.geo = { locations };
      return;
    }

    if (key === 'business') {
      let providers = extractListAfterLabel(block, 'infrastructure_providers');
      let related = extractListAfterLabel(block, 'related_entities');
      const providersInline = block.match(/infrastructure_providers:\s*\[([^\]]+)\]/i);
      if (providersInline) {
        providers = providersInline[1]
          .split(',')
          .map((item) => item.replace(/['"]/g, '').trim())
          .filter(Boolean);
      }
      const relatedInline = block.match(/related_entities:\s*\[([^\]]+)\]/i);
      if (relatedInline) {
        related = relatedInline[1]
          .split(',')
          .map((item) => item.replace(/['"]/g, '').trim())
          .filter(Boolean);
      }
      const companyMatch = block.match(/company_profile:\s*({[\s\S]+?})/i);
      let profile: Record<string, string> | undefined;
      if (companyMatch) {
        try {
          const normalized = companyMatch[1]
            .replace(/'/g, '"')
            .replace(/\s+/g, ' ')
            .replace(/,(\s*})/g, '$1');
          profile = JSON.parse(normalized);
        } catch {
          profile = undefined;
        }
      }
      data.business = {
        companyProfile: profile,
        infrastructureProviders: providers,
        relatedEntities: related,
      };
    }
  });

  return data;
};

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
  const [sectionData, setSectionData] = useState<SectionData | null>(null);

  const visualization = useMemo(() => {
    if (!sectionData) return null;
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

    const subdomainBars = (sectionData.subdomains?.entries || []).slice(0, 8).map((entry, idx) => ({
      name: entry.subdomain,
      value: entry.ip ? 2 : 1,
      ip: entry.ip || `Listed #${idx + 1}`,
    }));

    const portServiceBars = (() => {
      const counts: Record<string, number> = {};
      (sectionData.ports?.entries || []).forEach((entry) => {
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
      (sectionData.web?.analyses || []).forEach((analysis) => {
        analysis.headers.forEach((header) => {
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
      (sectionData.web?.analyses || []).forEach((analysis) => {
        analysis.technologies.forEach((tech) => {
          counts[tech] = (counts[tech] || 0) + 1;
        });
      });
      return Object.keys(counts).map((tech) => ({ tech, value: counts[tech] }));
    })();

    const breachPie = (() => {
      const summary = { clean: 0, error: 0 };
      (sectionData.breach?.results || []).forEach((result) => {
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
      (sectionData.geo?.locations || []).forEach((loc) => {
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

  // Helper to generate and download PDF from output text
  const downloadReportAsPDF = () => {
    try {
      if (!plainOutput) {
        setError('No output available to download');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set font to monospace for better code/text formatting
      doc.setFont('courier');
      doc.setFontSize(9);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      const lineHeight = 5;
      let yPosition = margin;

      // Split text into lines and process
      const lines = plainOutput.split('\n');
      
      lines.forEach((line) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Handle long lines by splitting them
        const splitLines = doc.splitTextToSize(line, maxWidth);
        
        splitLines.forEach((splitLine: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(splitLine, margin, yPosition);
          yPosition += lineHeight;
        });
      });

      // Generate filename with target and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = target 
        ? `OSINT_Report_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`
        : `OSINT_Report_${timestamp}.pdf`;

      // Save the PDF
      doc.save(filename);
    } catch (e: any) {
      setError(e.message || 'PDF generation failed');
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
          const parsedBlock = resp.result.parsed;
          const nextPlain = parsedBlock.plainOutput || null;
          setPlainOutput(nextPlain);
          setSections(parsedBlock.sections || []);
          setSectionData(parseAssessmentSections(nextPlain, parsedBlock));
        } else if (resp.result.stdout) {
          const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
          const clean = stripAnsi(resp.result.stdout);
          setPlainOutput(clean);
          setSections([]);
          setSectionData(parseAssessmentSections(clean, resp.result.parsed));
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
    setSectionData(null);
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
              onClick={() => {
                setTarget('');
                setOutput(null);
                setError(null);
                setPlainOutput(null);
                setSections([]);
                setSectionData(null);
                setStatusMessage(null);
              }}
              disabled={running}
            >
              Clear
            </button>
          </div>

          {statusMessage && (
            <div className="mt-4 text-sm text-blue-400 animate-pulse">{statusMessage}</div>
          )}

          {sectionData && visualization && (
            <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* 1. WHOIS */}
              <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs tracking-wide text-emerald-400 font-semibold">
                      1. COMPREHENSIVE WHOIS REGISTRATION DETAILS
                    </p>
                    <h3 className="text-xl font-semibold text-white">
                      {sectionData.whois?.domain || target || 'WHOIS Insights'}
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
                        ? sectionData.whois.nameServers.map((ns) => <li key={ns}>{ns}</li>)
                        : <li>Not reported</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase tracking-wide mb-1">Contact Emails</p>
                    <ul className="space-y-1">
                      {sectionData.whois?.contactEmails?.length
                        ? sectionData.whois.contactEmails.map((mail) => <li key={mail}>{mail}</li>)
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
                  {sectionData.ports?.entries?.slice(0, 8).map((entry) => (
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
                  {sectionData.web?.analyses?.flatMap((analysis) =>
                    analysis.criticalFindings.map((finding) => (
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
                    ? sectionData.breach.results.map((entry) => (
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
                    ? sectionData.waf.detections.map((det) => (
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
                  {sectionData.geo?.locations?.map((loc) => (
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

              <div className="xl:col-span-2 flex items-center justify-center">
                {plainOutput && (
                  <button
                    onClick={downloadReportAsPDF}
                    className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
                  >
                    ⬇️ Download full report (PDF)
                  </button>
                )}
              </div>
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

        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
