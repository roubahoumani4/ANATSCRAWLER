import React, { useMemo, useState } from 'react';
import { Shield, Radar, Globe, Server, Activity as ActivityIcon, Lock, AlertTriangle, Globe2, Building2, Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import anatLogo from '@/assets/anatlogo.png';
import VulnerabilityGraphs from '@/components/VulnerabilityGraphs';

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

type SocialSection = {
  profiles: Array<{ platform: string; handle: string; url?: string }>; 
  emailPatterns?: string[];
};

type TechStackSection = {
  detections: Array<{ target: string; tech: string; version?: string; source?: string }>;
  cdnProviders?: string[];
  cloudProviders?: string[];
};

type PassiveDnsSection = {
  records: Array<{ name: string; type: string; value: string; firstSeen?: string; lastSeen?: string }>;
};

type IpRangeSection = {
  ranges: Array<{ cidr: string; allocatedTo?: string; notes?: string }>;
};

type VulnerabilitySection = {
  entries: Array<{ id?: string; title: string; severity?: string; cve?: string[]; description?: string }>;
};

type ThreatIntelSection = {
  indicators: Array<{ indicator: string; type: string; reputation: string; source?: string }>;
};

type EmailSection = {
  spf?: string;
  dmarc?: string;
  dkim?: string;
  policyAssessment?: string;
};

type MobileSection = {
  apps: Array<{ name: string; storeUrl?: string; package?: string }>;
  apiEndpoints?: string[];
};

type DocumentSection = {
  files: Array<{ path: string; findings: string[] }>
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
  social?: SocialSection;
  techstack?: TechStackSection;
  passiveDns?: PassiveDnsSection;
  ipRanges?: IpRangeSection;
  vulnerabilities?: VulnerabilitySection;
  threatIntel?: ThreatIntelSection;
  email?: EmailSection;
  mobile?: MobileSection;
  documents?: DocumentSection;
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
  { key: 'social', title: 'SOCIAL MEDIA & DIGITAL FOOTPRINT' },
  { key: 'techstack', title: 'TECHNOLOGY STACK, CDN & CLOUD DETECTION' },
  { key: 'passiveDns', title: 'PASSIVE DNS & HISTORICAL DNS ANALYSIS' },
  { key: 'ipRanges', title: 'IP RANGE & NETWORK BLOCK ANALYSIS' },
  { key: 'vulnerabilities', title: 'VULNERABILITY & CVE INTEGRATION' },
  { key: 'threatIntel', title: 'THREAT INTELLIGENCE & REPUTATION' },
  { key: 'email', title: 'EMAIL SECURITY (SPF / DKIM / DMARC) ANALYSIS' },
  { key: 'mobile', title: 'MOBILE & API ENUMERATION' },
  { key: 'documents', title: 'DOCUMENT METADATA & PUBLIC FILE ANALYSIS' },
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

// Extract a block starting at an arbitrary title and ending at the next big ALL-CAPS title
const extractArbitraryBlock = (plain: string, title: string): string => {
  if (!plain) return '';
  const lines = plain.split(/\r?\n/);

  // Normalize title tokens for fuzzy matching
  const titleNorm = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleTokens = titleNorm.split(/\s+/).filter(Boolean);

  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;

    // Exact include (case-insensitive)
    if (l.toLowerCase().includes(title.toLowerCase())) {
      startIdx = i;
      break;
    }

    // Lines like '11. SOCIAL MEDIA & DIGITAL FOOTPRINT ANALYSIS'
    const numberedMatch = l.match(/^\s*\d+\.\s*(.+)$/);
    if (numberedMatch) {
      const rest = numberedMatch[1].toLowerCase();
      if (rest.includes(titleNorm) || titleTokens.every((t) => rest.includes(t))) {
        startIdx = i;
        break;
      }
    }

    // Fuzzy token match: at least half tokens present
    const lower = l.toLowerCase();
    const matched = titleTokens.filter((t) => lower.includes(t)).length;
    if (titleTokens.length && matched >= Math.ceil(titleTokens.length / 2)) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return '';

  // Find end: next section number or big ALL-CAPS line or separator
  let endIdx = lines.length;
  for (let j = startIdx + 1; j < lines.length; j++) {
    const ln = lines[j].trim();
    if (!ln) continue;
    if (/^[=\-]{3,}$/.test(ln)) {
      endIdx = j;
      break;
    }
    if (/^\s*\d+\./.test(ln)) {
      endIdx = j;
      break;
    }
    // Large ALL-CAPS title line
    if (ln.length > 8 && ln === ln.toUpperCase()) {
      endIdx = j;
      break;
    }
    if (SECTION_DEFS.some((def) => ln.toUpperCase().includes(def.title.toUpperCase()))) {
      endIdx = j;
      break;
    }
  }

  const slice = lines.slice(startIdx, endIdx).join('\n');
  // Remove the heading line to leave only the block content
  const withoutHeading = slice.split(/\r?\n/).slice(1).join('\n');
  return withoutHeading.trim();
};

// Parsers for specific end-of-scan blocks
const parseSocialBlock = (block: string) => {
  const results: Array<{ platform: string; url?: string; status?: string }> = [];
  if (!block) return results;
  const lines = block.split(/\r?\n/);
  for (const l of lines) {
    const m = l.match(/\[\+\]\s*([A-Za-z0-9_\-]+):\s*(https?:\/\/\S+)/i);
    if (m) {
      results.push({ platform: m[1], url: m[2] });
      continue;
    }
    const m2 = l.match(/\[DEBUG\]\s*([^:]+):\s*(.+)/i);
    if (m2) {
      results.push({ platform: m2[1].trim(), status: m2[2].trim() });
    }
  }
  return results;
};

const parseEmailPatterns = (block: string) => {
  if (!block) return [] as string[];
  const lines = block.split(/\r?\n/);
  const out: string[] = [];
  let startCollect = false;
  for (const l of lines) {
    if (/Sample generated email patterns:/i.test(l)) {
      startCollect = true;
      continue;
    }
    if (startCollect) {
      const m = l.match(/^-\s*(\S+@\S+)/);
      if (m) out.push(m[1]);
      else if (!l.trim()) break;
    }
  }
  // fallback: any lines that look like emails
  if (!out.length) {
    for (const l of lines) {
      const m = l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (m) out.push(m[0]);
    }
  }
  return Array.from(new Set(out));
};

const parseTechStackBlock = (block: string) => {
  if (!block) return [] as Array<{ url: string; technologies: string[] }>;
  const blocks = block.split(/\r?\n/);
  const results: Array<{ url: string; technologies: string[] }> = [];
  let currentUrl = '';
  let techs: string[] = [];
  for (const l of blocks) {
    const m = l.match(/Technologies detected on\s*([^:]+):/i);
    if (m) {
      if (currentUrl) results.push({ url: currentUrl, technologies: techs });
      currentUrl = m[1].trim();
      techs = [];
      continue;
    }
    const tm = l.match(/^\s*[-•]\s*(\S+)/);
    if (tm && currentUrl) {
      techs.push(tm[1].trim());
    }
  }
  if (currentUrl) results.push({ url: currentUrl, technologies: techs });
  return results;
};

const parseCloudBlock = (block: string) => {
  if (!block) return [] as string[];
  return block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);
};

const parseLiveVulnBlock = (block: string) => {
  if (!block) return [] as Array<{ cve?: string; software?: string; cvss?: string; severity?: string }>;
  const lines = block.split(/\r?\n/);
  const out: Array<{ cve?: string; software?: string; cvss?: string; severity?: string }> = [];
  for (const l of lines) {
    const m = l.match(/\[.*\]\s*LIVE SCAN:\s*(CVE-\d+-\d+)\s*-\s*([^\-]+)\s*-\s*CVSS:\s*([0-9.]+)/i);
    if (m) {
      out.push({ cve: m[1], software: m[2].trim(), cvss: m[3], severity: 'CRITICAL' });
      continue;
    }
    // Generic CVE line with severity indicator
    const m2 = l.match(/\[(?:[^\]]*)\]\s*(?:LIVE SCAN:)?\s*(CVE-\d+-\d+)\s*-?\s*([^\-]+)?/i);
    if (m2) {
      out.push({ cve: m2[1], software: (m2[2] || '').trim() });
    }
  }
  return out;
};

const parseVulnDetailsBlock = (block: string) => {
  if (!block) return [] as Array<any>;
  const chunks = block.split(/\n\n+/).map((c) => c.trim()).filter(Boolean);
  const results: Array<any> = [];
  for (const c of chunks) {
    // try to extract severity and title from first line
    const firstLine = c.split(/\r?\n/)[0];
  // match possible leading emoji or non-word chars then severity and title
  const titleMatch = firstLine.match(/^[^A-Za-z0-9]*?(CRITICAL|HIGH|MEDIUM|LOW)[:\s-]*\s*(.+)/i);
    let severity = 'UNKNOWN';
    let title = firstLine;
    if (titleMatch) {
      severity = titleMatch[1].toUpperCase();
      title = titleMatch[2] || title;
    }

    const getField = (label: string) => {
      const re = new RegExp(label + ":\\s*([\s\S]*?)(?:\\n[A-Z][a-zA-Z ]+:|$)", 'i');
      const m = c.match(re);
      if (m) return m[1].trim();
      return undefined;
    };

    const description = getField('Description') || '';
    const location = getField('Location') || getField('Location:') || '';
    const software = getField('Software') || '';
    const cves = (getField('CVEs') || getField('CVEs:') || '').replace(/\s+/g, ' ').trim();
    const cvss = (getField('CVSS Score') || getField('CVSS') || '').trim();
    const recommendation = getField('Recommendation') || '';
    const source = getField('Source') || '';

    // ignore very short chunks that aren't findings
    if (!description && !title && !cves && !software) continue;

    results.push({ severity, title, description, location, software, cves, cvss, recommendation, source });
  }
  return results;
};
const extractKeyValue = (block: string, label: string) => {
  const match = block.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
  return match ? match[1].trim() : undefined;
};

const extractListAfterLabel = (block: string, label: string) => {
  // First, try to find the label and capture until the next section boundary
  const labelIndex = block.toLowerCase().indexOf(label.toLowerCase() + ':');
  if (labelIndex === -1) return [];
  
  const afterLabel = block.slice(labelIndex + label.length + 1);
  const lines = afterLabel.split(/\r?\n/);
  const result: string[] = [];
  
  // Get all known section titles for comparison
  const sectionTitles = SECTION_DEFS.map(def => def.title.toUpperCase());
  
  for (const line of lines) {
    const trimmed = line.trim();
    const upperTrimmed = trimmed.toUpperCase();
    
    // Stop at section separators (lines with only = or -)
    if (/^[=\-]{3,}$/.test(trimmed)) break;
    
    // Stop at section numbers (e.g., "2.") - these indicate a new section
    if (/^\d+\.\s*$/.test(trimmed) || /^\d+\.\s+[A-Z]/.test(trimmed)) {
      // Check if the following text is a section title
      const nextLine = lines[lines.indexOf(line) + 1]?.trim() || '';
      if (sectionTitles.some(title => nextLine.toUpperCase().includes(title) || upperTrimmed.includes(title))) {
        break;
      }
    }
    
    // Stop if we encounter a known section title
    if (sectionTitles.some(title => upperTrimmed.includes(title) && trimmed.length > 10)) {
      break;
    }
    
    // Stop at next field label (contains colon and starts with capital letter, but not a list item)
    if (trimmed.includes(':') && /^[A-Z]/.test(trimmed) && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      const nextLabel = trimmed.split(':')[0].trim().toUpperCase();
      // Check if it matches a known section title or is a new major field
      if (sectionTitles.some(title => title.includes(nextLabel)) || nextLabel.length > 15) {
        break;
      }
    }
    
    // Skip empty lines
    if (trimmed === '') continue;
    
    // Add valid list items
    result.push(line);
  }
  
  return sanitizeList(result.join('\n'));
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
  // Prefer structured parsedExtras produced by the scanner when available.
  if (parsedExtras && typeof parsedExtras === 'object') {
    // Normalize common camelCase and snake_case server keys (support both old and new scanner outputs)
    const extras: any = parsedExtras;
    const portScan = extras.portScan || extras.port_scanning || extras.portScanning || extras.port_scan;
    const webAnalysis = extras.webAnalysis || extras.web_technologies || extras.web_technologies || extras.webAnalysis;
    const wafDetection = extras.wafDetection || extras.waf_detection || extras.waf;
    const sslAnalysis = extras.sslAnalysis || extras.ssl_certificates || extras.ssl_cert;
    const dnsAnalysis = extras.dnsAnalysis || (extras.domain_information && extras.domain_information.dns) || extras.dns || extras.dns_analysis;
    const geoAnalysis = extras.geoAnalysis || extras.geo || (extras.network_infrastructure && extras.network_infrastructure.ip_geolocation) || extras.ip_geolocation || extras.network_infrastructure;
    const business = extras.business || extras.business_intelligence || extras.business_intel || extras.businessIntelligence;
    const social = extras.social || extras.social_media || extras.socialMedia;
    const techstack = extras.techstack || extras.tech_stack || extras.techs;
    const passiveDns = extras.passiveDns || extras.passive_dns || extras.passiveDNS;
    const ipRanges = extras.ipRanges || extras.ip_ranges || extras.ipRanges;
    const vulnerabilities = extras.vulnerabilities || (extras.completeResults && extras.completeResults.vulnerabilities) || extras.vulns;
    const threatIntel = extras.threatIntel || extras.threat_intel || extras.threats;
    const email = extras.email || extras.emailAnalysis || extras.email_security;
    const mobile = extras.mobile || extras.mobile_apps || extras.mobileApps;
    const documents = extras.documents || extras.document_metadata || extras.docs;

    const hasStructured = [portScan, webAnalysis, wafDetection, sslAnalysis, dnsAnalysis, extras.completeResults, social, techstack, passiveDns, ipRanges, vulnerabilities, threatIntel, email, mobile, documents].some(Boolean);
    if (hasStructured) {
      const data: SectionData = {};

      // Ports
      if (portScan) {
        const portsSrc = portScan.open_ports || portScan.open_ports || portScan.entries || portScan.openPorts || portScan;
        data.ports = {
          entries: Array.isArray(portsSrc)
            ? portsSrc.map((p: any) => ({ ip: p.ip || p.host || p.address || '', port: Number(p.port || p.port_number || p.portNum || 0), service: p.service || p.name || p.protocol || '', banner: p.banner || p.info || JSON.stringify(p), status: p.state || p.status || 'OPEN' }))
            : [],
          total: portScan.total || portScan.count || (Array.isArray(portsSrc) ? portsSrc.length : undefined),
        };
      }

      // Web technology / techstack
      if (webAnalysis || techstack) {
        const src = webAnalysis || techstack;
        data.web = {
          analyses: (src.analyzed_urls || src.analyzed_urls || src.analyses || src.detections || src.detections || src.detections || []).map((a: any) => ({
            target: a.target || a.url || a.host || a.site || '',
            server: a.server || a.headers?.server,
            poweredBy: a.poweredBy || a.powered_by || a.headers?.['x-powered-by'],
            headers: (a.headersList || a.headers || a.security_headers || []).map((h: any) => ({ name: h.name || h[0] || h, status: h.present ? 'present' : (h.status === 'PRESENT' ? 'present' : 'missing') })),
            technologies: a.technologies || a.tech || a.detected || a.libs || [],
            criticalFindings: a.criticalFindings || a.critical || a.findings || [],
          })),
        };
      }

      // WAF
      if (wafDetection) {
        data.waf = { detections: (wafDetection.detections || wafDetection.findings || (Array.isArray(wafDetection) ? wafDetection : [])).map((d: any) => ({ target: d.target || d.host || d.url || '', message: d.message || d.raw || JSON.stringify(d) })) };
      }

      // SSL
      if (sslAnalysis) {
        data.ssl = {
          subject: sslAnalysis.subject || sslAnalysis.subjectCommonName,
          issuer: sslAnalysis.issuer || sslAnalysis.issuerName,
          validFrom: sslAnalysis.valid_from || sslAnalysis.not_before || sslAnalysis.notBefore,
          validUntil: sslAnalysis.valid_until || sslAnalysis.not_after || sslAnalysis.notAfter,
          signatureAlgorithm: sslAnalysis.signatureAlgorithm || sslAnalysis.sig_alg,
        };
      }

      // DNS
      if (dnsAnalysis) {
        data.dns = {
          aRecords: dnsAnalysis.a || dnsAnalysis.aRecords || dnsAnalysis.A || [],
          mxRecords: dnsAnalysis.mx || dnsAnalysis.mxRecords || [],
          nsRecords: dnsAnalysis.ns || dnsAnalysis.nsRecords || [],
          txtRecords: dnsAnalysis.txt || dnsAnalysis.txtRecords || [],
          dnssecEnabled: dnsAnalysis.dnssec === true || dnsAnalysis.dnssecEnabled === true || false,
          spfRecord: dnsAnalysis.spf || dnsAnalysis.spfRecord || dnsAnalysis.spf_record,
        };
      }

      // Geo
      if (geoAnalysis) {
        const g = Array.isArray(geoAnalysis) ? geoAnalysis : (geoAnalysis.locations || geoAnalysis || []);
        data.geo = { locations: (g.locations || g || []).map((l: any) => ({ ip: l.ip || l.address || l.host || '', organization: l.org || l.organization, country: l.country, city: l.city, asn: l.asn || l.ASN })) };
      }

      // Business
      if (business) {
        data.business = {
          companyProfile: business.company_profile || business.companyProfile || business.profile || business.companyProfile || undefined,
          infrastructureProviders: business.infrastructureProviders || business.infrastructure_providers || business.providers || [],
          relatedEntities: business.relatedEntities || business.related_entities || business.related || [],
        };
      }

      // Social
      if (social) {
        data.social = { profiles: social.profiles || social.accounts || social || [], emailPatterns: social.emailPatterns || social.email_patterns || social.patterns };
      }

      // Techstack (CDN / Cloud)
      if (techstack) {
        data.techstack = { detections: techstack.detections || techstack.entries || techstack || [], cdnProviders: techstack.cdns || techstack.cdnProviders || [], cloudProviders: techstack.clouds || techstack.cloudProviders || [] };
      }

      // Passive DNS
      if (passiveDns) {
        data.passiveDns = { records: passiveDns.records || passiveDns.records || passiveDns };
      }

      // IP ranges
      if (ipRanges) {
        data.ipRanges = { ranges: ipRanges.ranges || ipRanges };
      }

      // Vulnerabilities
      if (vulnerabilities) {
        const src = vulnerabilities || [];
        data.vulnerabilities = { entries: src.map((v: any) => ({ id: v.id || v.cve || undefined, title: v.title || v.name || v.summary || (v.description ? v.description.slice(0, 80) : ''), severity: v.severity || v.cvss || v.cvss_score || undefined, cve: v.cves || (v.cve ? [v.cve] : []), description: v.description || v.details || v.recommendation })) };
      }

      // Threat intel
      if (threatIntel) {
        data.threatIntel = { indicators: threatIntel.indicators || threatIntel };
      }

      // Email
      if (email) {
        data.email = { spf: email.spf, dmarc: email.dmarc, dkim: email.dkim, policyAssessment: email.assessment || email.policyAssessment };
      }

      // Mobile
      if (mobile) {
        data.mobile = { apps: mobile.apps || mobile.apps || [], apiEndpoints: mobile.apiEndpoints || mobile.api_endpoints || [] };
      }

      // Documents
      if (documents) {
        data.documents = { files: documents.files || documents };
      }

      return data;
    }
  }

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
  const downloadReportAsPDF = async () => {
    try {
      if (!plainOutput) {
        setError('No output available to download');
        return;
      }

      // Load logo image first
      let logoData: string | null = null;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = anatLogo;
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                logoData = canvas.toDataURL('image/png');
              }
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => {
            console.warn('Logo could not be loaded');
            resolve(); // Continue without logo
          };
        });
      } catch (e) {
        console.warn('Logo loading error:', e);
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const headerHeight = 35;
      const footerHeight = 15;
      const contentStartY = margin + headerHeight;
      const maxWidth = pageWidth - 2 * margin;
      const baseLineHeight = 5.5;
      let yPosition = contentStartY;
      let pageNumber = 1;

      // Helper function to add header with logo
      const addHeader = () => {
        if (logoData) {
          try {
            // Add logo in top left
            doc.addImage(logoData, 'PNG', margin, 8, 25, 25);
          } catch (e) {
            console.warn('Failed to add logo to PDF:', e);
          }
        }
        
        // Add company name and title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('ANAT SECURITY', margin + 30, 18);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('OSINT Assessment Report', margin + 30, 25);
        
        // Add report date
        const reportDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.setFontSize(8);
        doc.text(`Generated: ${reportDate}`, pageWidth - margin, 18, { align: 'right' });
        
        if (target) {
          doc.text(`Target: ${target}`, pageWidth - margin, 25, { align: 'right' });
        }
        
        // Add horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, headerHeight - 5, pageWidth - margin, headerHeight - 5);
      };

      // Helper function to add footer
      const addFooter = () => {
        const footerY = pageHeight - 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
        doc.text('ANAT Security - Confidential Report', pageWidth - margin, footerY, { align: 'right' });
      };

      // Helper function to check and add new page if needed
      const checkNewPage = (requiredSpace: number = 10) => {
        if (yPosition + requiredSpace > pageHeight - footerHeight) {
          addFooter();
          doc.addPage();
          pageNumber++;
          addHeader();
          yPosition = contentStartY;
        }
      };

      // Helper function to add a section title
      const addSectionTitle = (title: string, sectionNumber?: number) => {
        checkNewPage(15);
        yPosition += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        
        const titleText = sectionNumber ? `${sectionNumber}. ${title}` : title;
        doc.text(titleText, margin, yPosition);
        yPosition += 8;
        
        // Add underline
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.8);
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 3;
      };

      // Helper function to add text with proper formatting
      const addText = (
        text: string,
        fontSize: number = 9,
        isBold: boolean = false,
        color: [number, number, number] = [40, 40, 40],
        customLineHeight?: number
      ) => {
        const lineHeight = customLineHeight || baseLineHeight;
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkNewPage(lineHeight + 1);
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      };

      const addKeyValue = (key: string, value?: string | number | null) => {
        if (value === undefined || value === null || `${value}`.trim() === '') return;
        const valueText = `${value}`;
        const valueLines = doc.splitTextToSize(valueText, maxWidth - 40);
        const blockHeight = Math.max(baseLineHeight, valueLines.length * baseLineHeight);
        checkNewPage(blockHeight + 4);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`${key}:`, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        valueLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + 35, yPosition + idx * baseLineHeight);
        });
        yPosition += blockHeight + 4;
      };

      const addKeyValueList = (pairs: Array<{ key: string; value?: string | number | null }>) => {
        pairs.forEach(({ key, value }) => addKeyValue(key, value));
      };

      const addSubheading = (text: string) => {
        checkNewPage(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(55, 55, 55);
        doc.text(text, margin, yPosition);
        yPosition += 5;
      };

      const addBulletList = (title: string, items?: string[]) => {
        const list = (items || []).filter(Boolean);
        if (!list.length) return;
        if (title) {
          addSubheading(title);
        }
        list.forEach((item) => {
          const lines = doc.splitTextToSize(item, maxWidth - 15);
          const height = Math.max(baseLineHeight, lines.length * baseLineHeight);
          checkNewPage(height + 2);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(40, 40, 40);
          doc.text('•', margin + 2, yPosition + baseLineHeight / 2);
          lines.forEach((line: string, idx: number) => {
            doc.text(line, margin + 8, yPosition + idx * baseLineHeight);
          });
          yPosition += height + 2;
        });
        yPosition += 2;
      };

      const addTable = (
        title: string | null,
        columns: Array<{ header: string; width?: number }>,
        rows: string[][]
      ) => {
        if (!rows.length) return;

        if (title) {
          addSubheading(title);
        }

        const baseWidths = columns.map((col) => col.width || maxWidth / columns.length);
        const totalWidth = baseWidths.reduce((sum, width) => sum + width, 0);
        const scale = totalWidth > maxWidth ? maxWidth / totalWidth : 1;
        const widths = baseWidths.map((width) => width * scale);
        const tableWidth = widths.reduce((sum, width) => sum + width, 0);

        checkNewPage(baseLineHeight + 8);
        doc.setFillColor(236, 239, 244);
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, tableWidth, baseLineHeight + 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        let cursorX = margin;
        columns.forEach((col, idx) => {
          doc.text(col.header, cursorX + 2, yPosition + baseLineHeight + 1);
          cursorX += widths[idx];
        });
        yPosition += baseLineHeight + 4;

        rows.forEach((row) => {
          const cellLines = row.map((cell, idx) =>
            doc.splitTextToSize(cell || '—', widths[idx] - 4)
          );
          const rowHeight =
            Math.max(...cellLines.map((lines) => Math.max(1, lines.length))) * baseLineHeight + 3;
          checkNewPage(rowHeight + 2);
          let cellX = margin;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          columns.forEach((col, idx) => {
            doc.rect(cellX, yPosition, widths[idx], rowHeight);
            const lines = cellLines[idx].length ? cellLines[idx] : ['—'];
            lines.forEach((line: string, lineIdx: number) => {
              doc.text(line, cellX + 2, yPosition + 4 + lineIdx * baseLineHeight);
            });
            cellX += widths[idx];
          });
          yPosition += rowHeight;
        });
        yPosition += 6;
      };

      // Appendix removed from main report by request. Full scan output is available via separate download.

      // Add first page header
      addHeader();

  if (sectionData) {
        const whois = sectionData.whois;
        if (whois) {
          addSectionTitle('COMPREHENSIVE WHOIS REGISTRATION DETAILS', 1);
          addKeyValueList([
            { key: 'Domain', value: whois.domain },
            { key: 'Registrar', value: whois.registrar },
            { key: 'Created', value: whois.creationDate },
            { key: 'Expires', value: whois.expirationDate },
            { key: 'Contacts', value: whois.contactEmails?.length ?? 0 },
          ]);
          addBulletList('Name Servers', whois.nameServers);
          addBulletList('Contact Emails', whois.contactEmails);
        }

        const dns = sectionData.dns;
        if (dns) {
          addSectionTitle('ENHANCED DNS CONFIGURATION ANALYSIS', 2);
          addKeyValueList([
            { key: 'DNSSEC Enabled', value: dns.dnssecEnabled ? 'Yes' : 'No' },
            { key: 'SPF Record', value: dns.spfRecord || 'Not published' },
          ]);
          addBulletList('A Records', dns.aRecords);
          addBulletList('MX Records', dns.mxRecords);
          addBulletList('NS Records', dns.nsRecords);
          addBulletList('TXT Records', dns.txtRecords);
        }

        const subdomains = sectionData.subdomains;
        if (subdomains?.entries?.length) {
          addSectionTitle('COMPREHENSIVE SUBDOMAIN ENUMERATION', 3);
          addKeyValue('Total Subdomains', subdomains.total || subdomains.entries.length);
          addTable(
            'Resolved Subdomains',
            [
              { header: 'Subdomain', width: maxWidth * 0.55 },
              { header: 'IP Address', width: maxWidth * 0.45 },
            ],
            subdomains.entries.map((entry) => [entry.subdomain, entry.ip || '—'])
          );
        }

        const ports = sectionData.ports;
        if (ports?.entries?.length) {
          addSectionTitle('ADVANCED PORT SCANNING & SERVICE DETECTION', 4);
          addKeyValue('Reported Open Ports', ports.total || ports.entries.length);
          addTable(
            'Open Ports',
            [
              { header: 'IP', width: 55 },
              { header: 'Port', width: 25 },
              { header: 'Service', width: 40 },
              { header: 'Status', width: 25 },
              { header: 'Banner / Details', width: maxWidth - 145 },
            ],
            ports.entries.map((entry) => [
              entry.ip,
              entry.port.toString(),
              entry.service || 'Unknown',
              entry.status || '—',
              entry.banner || '—',
            ])
          );
        }

        const ssl = sectionData.ssl;
        if (ssl) {
          addSectionTitle('SSL/TLS CERTIFICATE ANALYSIS', 5);
          addKeyValueList([
            { key: 'Subject', value: ssl.subject },
            { key: 'Issuer', value: ssl.issuer },
            { key: 'Valid From', value: ssl.validFrom },
            { key: 'Valid Until', value: ssl.validUntil },
            { key: 'Signature Algorithm', value: ssl.signatureAlgorithm },
          ]);
        }

        const web = sectionData.web;
        if (web?.analyses?.length) {
          addSectionTitle('COMPREHENSIVE WEB TECHNOLOGY ANALYSIS', 6);
          web.analyses.forEach((analysis, idx) => {
            addSubheading(`Analyzing: ${analysis.target}`);
            addKeyValueList([
              { key: 'Server', value: analysis.server },
              { key: 'Powered-By', value: analysis.poweredBy },
            ]);
            if (analysis.headers?.length) {
              addTable(
                'Security Headers',
                [
                  { header: 'Header Name', width: maxWidth * 0.6 },
                  { header: 'Status', width: maxWidth * 0.4 },
                ],
                analysis.headers.map((header) => [
                  header.name,
                  header.status === 'present' ? 'Present' : 'Missing',
                ])
              );
            }
            addBulletList('Technologies', analysis.technologies);
            addBulletList('Critical Findings', analysis.criticalFindings);
          });
        }

        const breach = sectionData.breach;
        if (breach?.results?.length) {
          addSectionTitle('REAL DATA BREACH ANALYSIS', 7);
          addTable(
            'HIBP Lookups',
            [
              { header: 'Email / Identifier', width: maxWidth * 0.35 },
              { header: 'Status', width: maxWidth * 0.15 },
              { header: 'Details', width: maxWidth * 0.5 },
            ],
            breach.results.map((result) => [
              result.email,
              result.status.toUpperCase(),
              result.message,
            ])
          );
        }

        const waf = sectionData.waf;
        if (waf?.detections?.length) {
          addSectionTitle('WEB APPLICATION FIREWALL DETECTION', 8);
          addBulletList(
            'Detection Results',
            waf.detections.map((det) => `${det.message} • ${det.target}`)
          );
        }

        const geo = sectionData.geo;
        if (geo?.locations?.length) {
          addSectionTitle('IP GEOLOCATION & NETWORK ANALYSIS', 9);
          addTable(
            'Asset Inventory',
            [
              { header: 'IP Address', width: maxWidth * 0.28 },
              { header: 'Organization', width: maxWidth * 0.28 },
              { header: 'Country / City', width: maxWidth * 0.22 },
              { header: 'ASN', width: maxWidth * 0.22 },
            ],
            geo.locations.map((loc) => [
              loc.ip,
              loc.organization || '—',
              `${loc.country || 'Unknown'}${loc.city ? ` / ${loc.city}` : ''}`,
              loc.asn || '—',
            ])
          );
        }

        const business = sectionData.business;
        if (business) {
          addSectionTitle('BUSINESS INTELLIGENCE & CONTEXT ANALYSIS', 10);
          if (business.companyProfile) {
            const profilePairs = Object.entries(business.companyProfile).map(([key, value]) => ({
              key: key.replace(/_/g, ' '),
              value,
            }));
            addKeyValueList(profilePairs);
          }
          addBulletList('Infrastructure Providers', business.infrastructureProviders);
          addBulletList('Related Entities', business.relatedEntities);
        }
        // Include additional sections from the raw full scan output when available.
        // These are the social, email pattern, tech stack, cloud infra and live vulnerability
        // sections the scanner prints near the end of the run. We only include them when
        // `plainOutput` is present so the PDF stays compact otherwise.
        if (plainOutput) {
          // SOCIAL
          const socialBlock = extractArbitraryBlock(plainOutput, 'SOCIAL MEDIA & DIGITAL FOOTPRINT ANALYSIS');
          const socials = parseSocialBlock(socialBlock);
          if (socials.length) {
            addSectionTitle('SOCIAL MEDIA & DIGITAL FOOTPRINT ANALYSIS');
            const rows = socials.map((s) => [s.platform || 'Unknown', s.url || s.status || 'Not found']);
            addTable(null, [{ header: 'Platform', width: 50 }, { header: 'URL / Status', width: maxWidth - 50 }], rows);
          }

          // EMAIL PATTERNS
          const emailBlock = extractArbitraryBlock(plainOutput, 'EMAIL PATTERN DISCOVERY');
          const patterns = parseEmailPatterns(emailBlock);
          if (patterns.length) {
            addSectionTitle('EMAIL PATTERN DISCOVERY');
            addBulletList('Generated email patterns', patterns);
          }

          // TECH STACK
          const techBlock = extractArbitraryBlock(plainOutput, 'ADVANCED TECHNOLOGY STACK ANALYSIS');
          const techs = parseTechStackBlock(techBlock);
          if (techs.length) {
            addSectionTitle('ADVANCED TECHNOLOGY STACK ANALYSIS');
            addTable(null, [{ header: 'URL', width: maxWidth * 0.45 }, { header: 'Technologies', width: maxWidth * 0.55 }], techs.map(t => [t.url, t.technologies.join(', ')]));
          }

          // CLOUD INFRASTRUCTURE
          const cloudBlock = extractArbitraryBlock(plainOutput, 'CLOUD INFRASTRUCTURE ANALYSIS');
          const cloudLines = parseCloudBlock(cloudBlock);
          if (cloudLines.length) {
            addSectionTitle('CLOUD INFRASTRUCTURE ANALYSIS');
            addBulletList('', cloudLines);
          }

          // LIVE VULNERABILITY SCANNING
          const liveBlock = extractArbitraryBlock(plainOutput, 'LIVE VULNERABILITY SCANNING - NVD & CVE DATABASES');
          const liveEntries = parseLiveVulnBlock(liveBlock);
          if (liveEntries.length) {
            addSectionTitle('LIVE VULNERABILITY SCANNING - NVD & CVE DATABASES');
            addTable(null, [{ header: 'CVE', width: 40 }, { header: 'Software', width: maxWidth * 0.45 }, { header: 'CVSS', width: 30 }], liveEntries.map((e) => [e.cve || '—', e.software || '—', e.cvss || '—']));
          }

          // VULNERABILITY DETAILS
          const vulnBlock = extractArbitraryBlock(plainOutput, 'VULNERABILITY DETAILS - COMPREHENSIVE LIST');
          const vulnDetails = parseVulnDetailsBlock(vulnBlock);
          if (vulnDetails.length) {
            addSectionTitle('VULNERABILITY DETAILS - COMPREHENSIVE LIST');
            addTable(null, [
              { header: 'Severity', width: 30 },
              { header: 'Title', width: maxWidth * 0.35 },
              { header: 'Location', width: maxWidth * 0.2 },
              { header: 'Software / CVEs', width: maxWidth * 0.35 },
            ], vulnDetails.map((v) => [v.severity || '—', v.title || '—', v.location || '—', ((v.software || '') + (v.cves ? ` • ${v.cves}` : '')).trim() || '—']));
            // If recommendations exist, add them as a short subsection
            vulnDetails.forEach((v) => {
              if (v.recommendation) {
                addSubheading(`${v.severity}: ${v.title}`);
                addText(`Recommendation: ${v.recommendation}`, 9, false, [60, 60, 60]);
              }
            });
          }

          // Also pick up Vulnerability Summary and Enhanced Scan Summary blocks if present
          const vulnSummaryMatch = plainOutput.match(/Vulnerability Summary:[\s\S]*?(?:\n\n|$)/i);
          if (vulnSummaryMatch) {
            addSectionTitle('Vulnerability Summary');
            addText(vulnSummaryMatch[0].trim(), 9, false, [60, 60, 60]);
          }

          const enhancedSummaryMatch = plainOutput.match(/Enhanced Scan Summary:[\s\S]*?(?:\n\n|$)/i);
          if (enhancedSummaryMatch) {
            addSectionTitle('Enhanced Scan Summary');
            addText(enhancedSummaryMatch[0].trim(), 9, false, [60, 60, 60]);
          }
        }
      } else {
        // Fallback: render plain log output if parsing is unavailable
        const lines = plainOutput.split('\n');
        let currentSection = '';
        let sectionNumber = 0;
        let inSection = false;

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed && yPosition === contentStartY) return;

          const sectionMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (sectionMatch) {
            sectionNumber = parseInt(sectionMatch[1]);
            currentSection = sectionMatch[2];
            addSectionTitle(currentSection, sectionNumber);
            inSection = true;
            return;
          }

          if (/^[=\-]{3,}$/.test(trimmed)) {
            if (inSection) yPosition += 3;
            return;
          }

          const keyValueMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
          if (
            keyValueMatch &&
            !trimmed.startsWith('  ') &&
            !trimmed.startsWith('-') &&
            !trimmed.startsWith('•')
          ) {
            addKeyValue(keyValueMatch[1].trim(), keyValueMatch[2].trim());
            return;
          }

          if (/^\s*[-•]\s+(.+)$/.test(trimmed)) {
            const listItem = trimmed.replace(/^\s*[-•]\s+/, '');
            addBulletList('', [listItem]);
            return;
          }

          if (trimmed) {
            if (/^\d+\.\s*$/.test(trimmed)) return;
            const isKnownSection = SECTION_DEFS.some((def) =>
              trimmed.toUpperCase().includes(def.title.toUpperCase())
            );
            if (isKnownSection && trimmed.length > 15) {
              addSectionTitle(trimmed);
              return;
            }
            addText(trimmed, 9, false, [40, 40, 40]);
          } else if (inSection) {
            yPosition += 3;
          }
        });
      }

      // Add final footer
      addFooter();

      // Generate filename with target and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = target 
        ? `OSINT_Report_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`
        : `OSINT_Report_${timestamp}.pdf`;

      // Save the PDF
      doc.save(filename);
    } catch (e: any) {
      setError(e.message || 'PDF generation failed');
      console.error('PDF generation error:', e);
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

                {/* Vulnerability graphs (live vs comprehensive) */}
                <VulnerabilityGraphs sectionData={sectionData} plainOutput={plainOutput} />

                <div className="xl:col-span-2 flex items-center justify-center space-x-4">
                  {plainOutput && (
                    <>
                      <button
                        onClick={downloadReportAsPDF}
                        className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
                      >
                        ⬇️ Download summary report (PDF)
                      </button>
                    </>
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
