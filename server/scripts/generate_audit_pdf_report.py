#!/usr/bin/env python3
"""
PDF Report Generator for Linux OS Audit (Lynis)
Generates reports entirely from Lynis scan output data.
No hardcoded recommendations or static knowledge base.
All findings, descriptions, and remediation steps come directly from the scan results.
"""

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    )
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)


def _safe(text: str, max_len: int = 0) -> str:
    """Escape XML-sensitive characters for ReportLab Paragraphs."""
    if not text:
        return ""
    t = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if max_len and len(t) > max_len:
        t = t[:max_len] + "..."
    return t


# ---------------------------------------------------------------------------
# AI enrichment for empty fields
# ---------------------------------------------------------------------------

_ai_cache: Dict[str, dict] = {}


def _fix_json_escapes(text: str) -> str:
    """Fix invalid JSON escape sequences (e.g. \\S, \\P from registry paths)."""
    return re.sub(r'\\(?!["\\\\bfnrtu/])', r'\\\\', text)


def _parse_ai_json(text: str) -> list:
    """Robustly parse AI response as a JSON array."""
    # Strip markdown code fences
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)

    # Try direct parse
    for attempt_text in [t, _fix_json_escapes(t)]:
        try:
            parsed = json.loads(attempt_text)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                # Groq json_object mode wraps in {"results": [...]}
                for key in ('results', 'findings', 'data', 'items'):
                    if key in parsed and isinstance(parsed[key], list):
                        return parsed[key]
                return [parsed]
        except json.JSONDecodeError:
            continue

    # Last resort: extract array via regex
    match = re.search(r'\[\s*\{.*\}\s*\]', t, re.DOTALL)
    if match:
        for attempt_text in [match.group(), _fix_json_escapes(match.group())]:
            try:
                return json.loads(attempt_text)
            except json.JSONDecodeError:
                continue

    raise json.JSONDecodeError("No valid JSON array found", t, 0)


def _is_empty(val: str) -> bool:
    """Return True if a Lynis field value is effectively empty."""
    return not val or val.strip() in ('', '-', '--', 'N/A')


def _ai_enrich_findings(findings: List[Dict], finding_type: str) -> Dict[str, dict]:
    """Use Groq AI to fill empty recommendation/details fields.

    Args:
        findings: list of warning or suggestion dicts
        finding_type: 'warning' or 'suggestion'
    Returns:
        dict keyed by test_id with enrichment data
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("WARNING: GEMINI_API_KEY (Groq) not set — AI enrichment disabled",
              file=sys.stderr)
        return {}

    # Identify findings that need AI enrichment
    needs_fill: List[Dict] = []
    for f in findings:
        tid = f.get('test_id', '')
        if tid in _ai_cache:
            continue
        if finding_type == 'warning':
            # Always enrich warnings — they need a suggestion
            needs_fill.append(f)
        else:  # suggestion
            if (_is_empty(f.get('details', ''))
                    or _is_empty(f.get('solution', ''))):
                needs_fill.append(f)

    if not needs_fill:
        return {k: v for k, v in _ai_cache.items()}

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
    except Exception as e:
        print(f"AI initialisation failed: {e}", file=sys.stderr)
        return {}

    model = "llama-3.1-8b-instant"
    results: Dict[str, dict] = dict(_ai_cache)
    batch_size = 20

    for batch_start in range(0, len(needs_fill), batch_size):
        # Pace requests to stay under Groq free-tier rate limits (30 req/min)
        if batch_start > 0:
            time.sleep(3)
        batch = needs_fill[batch_start:batch_start + batch_size]

        findings_text = ""
        for j, f in enumerate(batch, 1):
            findings_text += (
                f"\n{j}. Test ID: {f.get('test_id', 'N/A')}\n"
                f"   Description: {f.get('description', 'N/A')}\n"
            )
            if finding_type == 'suggestion':
                findings_text += (
                    f"   Details: {f.get('details', '')}\n"
                    f"   Solution: {f.get('solution', '')}\n"
                )

        if finding_type == 'warning':
            prompt = (
                "You are a Linux security hardening expert. These are Lynis "
                "security audit WARNINGS (critical issues). For each one, "
                "provide a recommendation and an actionable suggestion on "
                "what the administrator should do to fix or mitigate it.\n\n"
                f"WARNINGS:{findings_text}\n\n"
                "Respond with a JSON object containing a \"results\" key "
                "whose value is an array. Each element has:\n"
                '{\n'
                '  "index": <finding number>,\n'
                '  "recommendation": "<what this warning means and why it '
                'matters, 1-2 sentences>",\n'
                '  "suggestion": "<specific Linux command, config change, '
                'or remediation step to fix this, 2-3 sentences>"\n'
                '}\n\n'
                "IMPORTANT: Use forward slashes (/) in file paths. "
                "Escape all backslashes as \\\\\\\\ in JSON strings. "
                "Do NOT use unescaped backslashes."
            )
        else:
            prompt = (
                "You are a Linux security hardening expert. These are Lynis "
                "security audit SUGGESTIONS. For each one, fill in the missing "
                "details and/or recommendation.\n\n"
                f"SUGGESTIONS:{findings_text}\n\n"
                "Respond with a JSON object containing a \"results\" key "
                "whose value is an array. Each element has:\n"
                '{\n'
                '  "index": <finding number>,\n'
                '  "details": "<what this finding means, 1-2 sentences>",\n'
                '  "recommendation": "<specific Linux fix, 1-2 sentences>"\n'
                '}\n\n'
                "IMPORTANT: Use forward slashes (/) in file paths. "
                "Escape all backslashes as \\\\\\\\ in JSON strings. "
                "Do NOT use unescaped backslashes."
            )

        # Retry with exponential backoff for rate-limit (429) and parse errors
        batch_num = batch_start // batch_size + 1
        for attempt in range(4):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"},
                )
                text = resp.choices[0].message.content.strip()
                parsed = _parse_ai_json(text)
                for entry in parsed:
                    idx = entry.get("index", 0)
                    if 1 <= idx <= len(batch):
                        tid = batch[idx - 1].get('test_id', '')
                        results[tid] = entry
                        _ai_cache[tid] = entry
                break  # success
            except Exception as e:
                err_str = str(e)
                if '429' in err_str and attempt < 3:
                    wait = (2 ** attempt) * 15  # 15s, 30s, 60s
                    print(f"Rate limited (batch {batch_num}), retrying in {wait}s...",
                          file=sys.stderr)
                    time.sleep(wait)
                elif 'JSON' in err_str and attempt < 2:
                    print(f"JSON parse retry (batch {batch_num}, attempt {attempt+1})",
                          file=sys.stderr)
                    time.sleep(2)
                else:
                    print(f"AI enrichment error (batch {batch_num}): {e}",
                          file=sys.stderr)
                    break

    return results


# ---------------------------------------------------------------------------
# Lynis .dat file parser
# ---------------------------------------------------------------------------

class LynisReportParser:
    """Parse Lynis report data files (.dat format)."""

    def __init__(self, report_file_path: str):
        self.report_file = report_file_path
        self.data: Dict[str, Any] = {}
        self.parse_report()

    def parse_report(self):
        with open(self.report_file, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if key in self.data:
                        if isinstance(self.data[key], list):
                            self.data[key].append(value)
                        else:
                            self.data[key] = [self.data[key], value]
                    else:
                        self.data[key] = value

    def get_value(self, key: str, default=None):
        return self.data.get(key, default)

    def get_warnings(self) -> List[Dict[str, str]]:
        """Extract warnings from report (deduplicated by test_id)."""
        warnings: List[Dict[str, str]] = []
        seen: set = set()
        for key, value in self.data.items():
            if key.startswith('warning['):
                values = value if isinstance(value, list) else [value]
                for v in values:
                    parts = v.split('|')
                    if len(parts) >= 2:
                        tid = parts[0]
                        if tid in seen:
                            continue
                        seen.add(tid)
                        warnings.append({
                            'test_id': tid,
                            'description': parts[1],
                            'recommendation': parts[3] if len(parts) > 3 else ''
                        })
        return warnings

    def get_suggestions(self) -> List[Dict[str, str]]:
        """Extract suggestions from report (deduplicated by test_id)."""
        suggestions: List[Dict[str, str]] = []
        seen: set = set()
        for key, value in self.data.items():
            if key.startswith('suggestion['):
                values = value if isinstance(value, list) else [value]
                for v in values:
                    parts = v.split('|')
                    if len(parts) >= 2:
                        tid = parts[0]
                        if tid in seen:
                            continue
                        seen.add(tid)
                        suggestions.append({
                            'test_id': tid,
                            'description': parts[1],
                            'details': parts[2] if len(parts) > 2 else '',
                            'solution': parts[4] if len(parts) > 4 else ''
                        })
        return suggestions


# ---------------------------------------------------------------------------
# Compliance framework mapping for audit categories
# ---------------------------------------------------------------------------

_COMPLIANCE_MAP = {
    'AUTH': {'cis': '5.x Access, Authentication and Authorization', 'nist': 'AC, IA', 'iso': 'A.9 Access Control'},
    'BOOT': {'cis': '1.x Initial Setup', 'nist': 'CM, SI', 'iso': 'A.12 Operations Security'},
    'BANN': {'cis': '1.7 Warning Banners', 'nist': 'AC-8', 'iso': 'A.9 System Access Control'},
    'CONT': {'cis': '1.x Initial Setup', 'nist': 'CM, SC', 'iso': 'A.12 Operations Security'},
    'CRYP': {'cis': '1.x Cryptographic Settings', 'nist': 'SC', 'iso': 'A.10 Cryptography'},
    'DBS':  {'cis': '2.x Services', 'nist': 'CM, SC', 'iso': 'A.14 System Acquisition'},
    'FILE': {'cis': '6.x System Maintenance', 'nist': 'CM, AU', 'iso': 'A.12 Operations Security'},
    'FIRE': {'cis': '3.x Network Configuration', 'nist': 'SC', 'iso': 'A.13 Communications Security'},
    'HRDN': {'cis': '1.x Initial Setup', 'nist': 'CM', 'iso': 'A.14 System Acquisition'},
    'HTTP': {'cis': '2.x Services', 'nist': 'CM, SC', 'iso': 'A.14 System Acquisition'},
    'KRNL': {'cis': '1.x Initial Setup', 'nist': 'CM, SI', 'iso': 'A.12 Operations Security'},
    'LOGG': {'cis': '4.x Logging and Auditing', 'nist': 'AU', 'iso': 'A.12.4 Logging and Monitoring'},
    'MAIL': {'cis': '2.x Services', 'nist': 'CM', 'iso': 'A.13 Communications Security'},
    'MALW': {'cis': '1.3 Filesystem Integrity', 'nist': 'SI', 'iso': 'A.12.2 Malware Protection'},
    'NAME': {'cis': '3.x Network Configuration', 'nist': 'SC', 'iso': 'A.13 Communications Security'},
    'NETW': {'cis': '3.x Network Configuration', 'nist': 'SC', 'iso': 'A.13 Communications Security'},
    'PKGS': {'cis': '1.x Initial Setup', 'nist': 'CM, SI', 'iso': 'A.12 Operations Security'},
    'PROC': {'cis': '1.x Initial Setup', 'nist': 'CM', 'iso': 'A.12 Operations Security'},
    'SSH':  {'cis': '5.2 SSH Server Configuration', 'nist': 'AC, SC', 'iso': 'A.9 Access Control'},
    'STRG': {'cis': '1.1 Filesystem Configuration', 'nist': 'CM', 'iso': 'A.8 Asset Management'},
    'TIME': {'cis': '2.x Services', 'nist': 'AU-8', 'iso': 'A.12 Operations Security'},
    'USB':  {'cis': '1.1 Filesystem Configuration', 'nist': 'CM, MP', 'iso': 'A.8 Asset Management'},
}


# ---------------------------------------------------------------------------
# PDF Report Builder - Professional Security Audit Report
# ---------------------------------------------------------------------------

class AuditPDFReport:
    """Generate professional PDF audit report from Linux scan data.

    Sections:
      1. Executive Summary
      2. Audit Scope & Methodology
      3. System Information
      4. Risk Classification
      5. Prioritized Remediation Roadmap
      6. Detailed Findings
      7. Risk Heat Map
      8. Compliance Mapping
      9. Before & After Success Criteria
      10. Appendices
      11. Auditor Sign-off
      12. Document Metadata
    """

    def __init__(self, report_data: Dict[str, Any], output_path: str):
        self.data = report_data
        self.output_path = output_path
        self.styles = self._create_styles()
        self.doc = SimpleDocTemplate(
            output_path, pagesize=A4,
            rightMargin=0.75 * inch, leftMargin=0.75 * inch,
            topMargin=0.75 * inch, bottomMargin=0.75 * inch
        )
        self.story: list = []

    # ------------------------------------------------------------------ styles
    def _create_styles(self):
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='ReportTitle', parent=styles['Heading1'],
            fontSize=24, textColor=colors.HexColor('#1a365d'),
            spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold'
        ))
        styles.add(ParagraphStyle(
            name='ReportSubtitle', parent=styles['Heading2'],
            fontSize=14, textColor=colors.HexColor('#2c5282'),
            spaceAfter=12, alignment=TA_CENTER
        ))
        styles.add(ParagraphStyle(
            name='SectionTitle', parent=styles['Heading2'],
            fontSize=14, textColor=colors.HexColor('#1a365d'),
            spaceAfter=6, spaceBefore=12, fontName='Helvetica-Bold',
            borderColor=colors.HexColor('#cbd5e0'), borderWidth=2, borderPadding=6
        ))
        styles.add(ParagraphStyle(
            name='SubsectionTitle', parent=styles['Heading3'],
            fontSize=12, textColor=colors.HexColor('#2d3748'),
            spaceAfter=6, spaceBefore=10
        ))
        styles.add(ParagraphStyle(
            name='FindingCritical', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#742a2a'),
            backgroundColor=colors.HexColor('#fed7d7')
        ))
        styles.add(ParagraphStyle(
            name='FindingHigh', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#7c2d12'),
            backgroundColor=colors.HexColor('#ffedd5')
        ))
        styles.add(ParagraphStyle(
            name='FindingMedium', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#92400e'),
            backgroundColor=colors.HexColor('#fef3c7')
        ))
        styles.add(ParagraphStyle(
            name='FindingLow', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#1e3a5f'),
            backgroundColor=colors.HexColor('#dbeafe')
        ))
        return styles

    def _risk_level(self, score: int):
        if score >= 80:
            return 'Low', colors.HexColor('#22863a')
        if score >= 60:
            return 'Medium', colors.HexColor('#f0ad4e')
        if score >= 40:
            return 'High', colors.HexColor('#d9534f')
        return 'Critical', colors.HexColor('#cc3333')

    def _std_table_style(self):
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f7fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ])

    # =============================== Sections ===============================

    def _section_cover_page(self):
        """Cover page with title, metadata, and confidentiality notice."""
        self.story.append(
            Paragraph("SYSTEM SECURITY AUDIT REPORT", self.styles['ReportTitle']))
        self.story.append(
            Paragraph("Linux OS Hardening Assessment", self.styles['ReportSubtitle']))

        audit_date = self.data.get(
            'audit_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        meta = (
            '<font size=9>'
            '<b>Report Generated:</b> ' + _safe(str(audit_date)) + '<br/>'
            '<b>Company:</b> ' + (_safe(self.data.get('company_name', '')) or 'N/A') + '<br/>'
            '<b>System:</b> ' + _safe(self.data.get('hostname', 'Unknown')) + '<br/>'
            '<b>IP Address:</b> ' + _safe(self.data.get('ip_address', 'N/A')) + '<br/>'
            '<b>OS:</b> ' + _safe(self.data.get('os_name', 'Unknown')) + ' '
            + _safe(self.data.get('os_version', '')) + '<br/>'
            '<b>Kernel:</b> ' + _safe(self.data.get('kernel_version', 'Unknown')) + '<br/>'
            '<b>Owner:</b> ' + _safe(self.data.get('owner_name', 'Not Specified')) + '<br/>'
            '</font>'
        )
        self.story.append(Paragraph(meta, self.styles['Normal']))
        self.story.append(Spacer(1, 0.25 * inch))

        disclaimer = (
            '<font size=8 color="#666666"><i>'
            'This report contains confidential security audit information. '
            'Unauthorized access, use, or distribution is prohibited. '
            'This assessment was performed using an automated security auditing tool '
            'conducted by ANATSECURITY. All findings and recommendations are based on '
            'the scan output and AI-assisted analysis.'
            '</i></font>'
        )
        self.story.append(Paragraph(disclaimer, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_executive_summary(self, score: int, warnings: List, suggestions: List):
        """Section 1 - executive-level summary."""
        self.story.append(
            Paragraph("1. EXECUTIVE SUMMARY", self.styles['SectionTitle']))

        risk, _ = self._risk_level(score)

        rows = [
            ['Metric', 'Value'],
            ['Hardening Score', str(score) + '/100'],
            ['Risk Level', risk],
            ['Critical/High Priority Findings', str(len(warnings))],
            ['Medium/Low Priority Findings', str(len(suggestions))],
            ['Total Findings', str(len(warnings) + len(suggestions))],
        ]
        t = Table(rows, colWidths=[3.5 * inch, 2.5 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f7fafc')]),
        ]))
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        if warnings:
            top_priority = ('Address ' + str(len(warnings))
                            + ' critical warning(s) immediately '
                            'to reduce security exposure.')
        else:
            top_priority = ('No critical warnings identified. Focus on '
                            'implementing suggested improvements.')

        narrative = (
            'An automated security audit was conducted by ANATSECURITY on '
            '<b>' + _safe(self.data.get('hostname', 'the target system')) + '</b>. '
            'The system achieved a hardening score of <b>' + str(score) + '/100</b>, '
            'indicating a <b>' + risk + '</b> risk level.<br/><br/>'
            'The assessment identified <b>' + str(len(warnings)) + '</b> critical/high '
            'priority finding(s) requiring immediate attention and '
            '<b>' + str(len(suggestions)) + '</b> medium/low priority finding(s) '
            'recommended for security improvement.<br/><br/>'
            '<b>Top Priority:</b> ' + top_priority
        )
        self.story.append(Paragraph(narrative, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_audit_scope(self):
        """Section 2 - audit scope and methodology."""
        self.story.append(
            Paragraph("2. AUDIT SCOPE &amp; METHODOLOGY", self.styles['SectionTitle']))

        text = (
            '<b>Scope:</b> This assessment evaluated the security configuration '
            'and hardening posture of the Linux operating system on '
            '<b>' + _safe(self.data.get('hostname', 'the target system')) + '</b>.<br/><br/>'
            '<b>Methodology:</b> The audit was performed using an automated '
            'security auditing tool conducted by ANATSECURITY. The tool performs '
            'comprehensive checks across multiple security domains including '
            'system configuration, authentication, networking, file permissions, '
            'logging, and kernel security.<br/><br/>'
            '<b>Assessment Criteria:</b> Findings are evaluated against '
            'industry-standard security benchmarks including CIS Benchmarks, '
            'NIST 800-53, and ISO 27001 controls. Each finding is classified '
            'by severity and accompanied by specific remediation guidance.'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_system_information(self):
        """Section 3 - system details."""
        self.story.append(
            Paragraph("3. SYSTEM INFORMATION", self.styles['SectionTitle']))

        info = (
            '<b>System Identification:</b><br/>'
            'Hostname: ' + _safe(self.data.get('hostname', 'Unknown')) + '<br/>'
            'IP Address: ' + _safe(self.data.get('ip_address', 'N/A')) + '<br/>'
            'Owner: ' + _safe(self.data.get('owner_name', 'Not Specified')) + '<br/>'
            '<br/>'
            '<b>Operating System:</b><br/>'
            'OS: ' + _safe(self.data.get('os_name', 'Unknown')) + ' '
            + _safe(self.data.get('os_version', '')) + '<br/>'
            'Kernel Version: ' + _safe(self.data.get('kernel_version_full', 'Unknown')) + '<br/>'
            'Hardware Platform: ' + _safe(self.data.get('hardware_platform', 'Unknown')) + '<br/>'
            'Virtual Machine: ' + _safe(self.data.get('vm', 'Unknown')) + '<br/>'
            '<br/>'
            '<b>Environment:</b><br/>'
            'Uptime (days): ' + _safe(self.data.get('uptime_days', 'Unknown')) + '<br/>'
            'Service Manager: ' + _safe(self.data.get('service_manager', 'Unknown')) + '<br/>'
            'Firewall Software: ' + (_safe(self.data.get('firewall_software', '')) or 'Not Detected') + '<br/>'
            'Audit Daemon: ' + ('Running' if self.data.get('audit_daemon') else 'Not Detected') + '<br/>'
        )
        self.story.append(Paragraph(info, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_risk_classification(self, warnings: List, suggestions: List):
        """Section 4 - four-tier risk classification."""
        self.story.append(
            Paragraph("4. RISK CLASSIFICATION", self.styles['SectionTitle']))

        text = (
            'Findings are classified into four severity tiers based on their '
            'potential security impact and urgency of remediation:'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.1 * inch))

        rows = [
            ['Risk Tier', 'Description', 'Count', 'Action Required'],
            ['Critical', 'Security vulnerabilities requiring immediate remediation',
             str(len(warnings)), 'Immediate (0-48h)'],
            ['High', 'Significant issues requiring urgent attention',
             '0', 'Short-term (1-2 weeks)'],
            ['Medium', 'Recommended security improvements',
             str(len(suggestions)), 'Medium-term (1-3 months)'],
            ['Low', 'Best practice enhancements',
             '0', 'Long-term (3-6 months)'],
        ]
        t = Table(rows, colWidths=[1.0 * inch, 2.5 * inch, 0.8 * inch, 1.7 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f7fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ('TEXTCOLOR', (0, 1), (0, 1), colors.HexColor('#cc3333')),
            ('TEXTCOLOR', (0, 2), (0, 2), colors.HexColor('#d9534f')),
            ('TEXTCOLOR', (0, 3), (0, 3), colors.HexColor('#f0ad4e')),
            ('TEXTCOLOR', (0, 4), (0, 4), colors.HexColor('#22863a')),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ]))
        self.story.append(t)
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_remediation_roadmap(self, warnings: List, suggestions: List):
        """Section 5 - prioritized remediation timeline."""
        self.story.append(
            Paragraph("5. PRIORITIZED REMEDIATION ROADMAP", self.styles['SectionTitle']))

        rows = [
            ['Timeline', 'Priority', 'Actions Required', 'Count'],
            ['Immediate\n(0-48 hours)', 'Critical',
             'Address all security warnings\nthat expose the system to active threats',
             str(len(warnings))],
            ['Short-term\n(1-2 weeks)', 'High',
             'Resolve configuration weaknesses\nthat could be exploited', '0'],
            ['Medium-term\n(1-3 months)', 'Medium',
             'Implement suggested security\nimprovements and hardening measures',
             str(len(suggestions))],
            ['Long-term\n(3-6 months)', 'Low',
             'Apply best practice enhancements\nand continuous monitoring', '0'],
        ]
        t = Table(rows, colWidths=[1.2 * inch, 0.8 * inch, 2.5 * inch, 1.0 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        text = (
            'Remediation should follow the priority order above. Critical findings '
            'must be addressed first as they represent the most significant security '
            'risks. Each subsequent tier should be addressed as resources permit, '
            'with regular reassessment to track improvement progress.'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_detailed_findings(self, warnings: List, suggestions: List):
        """Section 6 - all findings with AI-enriched analysis.
        Labels: Warnings use Details/Recommendation; Suggestions use Details/Recommendation.
        No AI markers are shown."""
        self.story.append(
            Paragraph("6. DETAILED FINDINGS", self.styles['SectionTitle']))

        # Run AI enrichment
        warn_ai = _ai_enrich_findings(warnings, 'warning')
        sugg_ai = _ai_enrich_findings(suggestions, 'suggestion')

        # 6.1 Warnings (Critical/High Priority)
        self.story.append(Paragraph(
            "6.1 Critical &amp; High Priority Findings (" + str(len(warnings)) + " findings)",
            self.styles['SubsectionTitle']))

        if not warnings:
            self.story.append(Paragraph(
                "No critical or high priority findings were identified during the scan.",
                self.styles['Normal']))
        else:
            for idx, w in enumerate(warnings, 1):
                tid = w.get('test_id', '')
                desc = _safe(w.get('description', ''))
                rec = w.get('recommendation', '').strip()

                # Fill empty recommendation from AI
                if _is_empty(rec) and tid in warn_ai:
                    rec = warn_ai[tid].get('recommendation', '')
                elif _is_empty(rec):
                    rec = ''

                text = '<b>' + str(idx) + '. [' + _safe(tid) + '] ' + desc + '</b>'

                # "Recommendation" field relabeled as "Details" for warnings
                if rec:
                    text += '<br/><b>Details:</b> ' + _safe(rec)

                # "Suggestion" field relabeled as "Recommendation" for warnings
                suggestion = ''
                if tid in warn_ai:
                    suggestion = warn_ai[tid].get('suggestion', '')
                if suggestion:
                    text += '<br/><b>Recommendation:</b> ' + _safe(suggestion)

                self.story.append(
                    Paragraph(text, self.styles['FindingCritical']))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

        # 6.2 Suggestions (Medium/Low Priority)
        self.story.append(Paragraph(
            "6.2 Medium &amp; Low Priority Findings (" + str(len(suggestions)) + " findings)",
            self.styles['SubsectionTitle']))

        if not suggestions:
            self.story.append(Paragraph(
                "No medium or low priority findings were identified during the scan.",
                self.styles['Normal']))
        else:
            for idx, s in enumerate(suggestions, 1):
                tid = s.get('test_id', '')
                desc = _safe(s.get('description', ''))
                details = s.get('details', '').strip()
                solution = s.get('solution', '').strip()

                if _is_empty(details):
                    details = ''
                if _is_empty(solution):
                    solution = ''

                # Fill empty fields from AI
                if tid in sugg_ai:
                    ai_data = sugg_ai[tid]
                    if not details:
                        details = ai_data.get('details', '')
                    if not solution:
                        solution = ai_data.get('recommendation', '')

                text = '<b>' + str(idx) + '. [' + _safe(tid) + '] ' + desc + '</b>'
                if details:
                    text += '<br/><b>Details:</b> ' + _safe(details)
                if solution:
                    text += '<br/><b>Recommendation:</b> ' + _safe(solution)

                self.story.append(
                    Paragraph(text, self.styles['FindingMedium']))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_risk_heat_map(self, warnings: List, suggestions: List):
        """Section 7 - category vs severity matrix."""
        self.story.append(
            Paragraph("7. RISK HEAT MAP", self.styles['SectionTitle']))

        categories: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {'critical': 0, 'high': 0, 'medium': 0, 'low': 0})

        for w in warnings:
            cat = w['test_id'].split('-')[0] if '-' in w['test_id'] else 'OTHER'
            categories[cat]['critical'] += 1
        for s in suggestions:
            cat = s['test_id'].split('-')[0] if '-' in s['test_id'] else 'OTHER'
            categories[cat]['medium'] += 1

        if categories:
            rows = [['Category', 'Critical', 'High', 'Medium', 'Low', 'Total']]
            for cat in sorted(categories.keys()):
                c = categories[cat]
                total = c['critical'] + c['high'] + c['medium'] + c['low']
                rows.append([
                    cat, str(c['critical']), str(c['high']),
                    str(c['medium']), str(c['low']), str(total)
                ])
            rows.append([
                'TOTAL', str(len(warnings)), '0',
                str(len(suggestions)), '0',
                str(len(warnings) + len(suggestions))
            ])
            t = Table(rows, colWidths=[1.3 * inch, 0.9 * inch, 0.9 * inch,
                                       0.9 * inch, 0.9 * inch, 0.9 * inch])
            t.setStyle(self._std_table_style())
            self.story.append(t)
        else:
            self.story.append(
                Paragraph("No findings to display.", self.styles['Normal']))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_compliance_mapping(self, warnings: List, suggestions: List):
        """Section 8 - map finding categories to compliance frameworks."""
        self.story.append(
            Paragraph("8. COMPLIANCE MAPPING", self.styles['SectionTitle']))

        text = (
            'The following table maps audit finding categories to recognized '
            'security frameworks and benchmarks for compliance tracking purposes:'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.1 * inch))

        # Collect categories present in findings
        found_cats: set = set()
        for w in warnings:
            cat = w['test_id'].split('-')[0] if '-' in w['test_id'] else 'OTHER'
            found_cats.add(cat)
        for s in suggestions:
            cat = s['test_id'].split('-')[0] if '-' in s['test_id'] else 'OTHER'
            found_cats.add(cat)

        rows = [['Audit Category', 'CIS Benchmark', 'NIST 800-53', 'ISO 27001']]
        for cat in sorted(found_cats):
            mapping = _COMPLIANCE_MAP.get(cat, {
                'cis': 'General Hardening',
                'nist': 'CM',
                'iso': 'A.12 Operations Security'
            })
            rows.append([cat, mapping['cis'], mapping['nist'], mapping['iso']])

        if len(rows) > 1:
            t = Table(rows, colWidths=[1.2 * inch, 2.0 * inch, 1.2 * inch, 1.6 * inch])
            t.setStyle(self._std_table_style())
            self.story.append(t)
        else:
            self.story.append(
                Paragraph("No categories to map.", self.styles['Normal']))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_before_after(self, score: int, warnings: List, suggestions: List):
        """Section 9 - current state and target success criteria."""
        self.story.append(
            Paragraph("9. BEFORE &amp; AFTER SUCCESS CRITERIA", self.styles['SectionTitle']))

        risk, _ = self._risk_level(score)
        target_score = min(100, score + max(10, (100 - score) // 2))
        target_risk, _ = self._risk_level(target_score)

        self.story.append(Paragraph(
            "<b>Current Assessment:</b>", self.styles['SubsectionTitle']))

        rows = [
            ['Metric', 'Current Value'],
            ['Hardening Score', str(score) + '/100'],
            ['Risk Level', risk],
            ['Active Warnings', str(len(warnings))],
            ['Pending Suggestions', str(len(suggestions))],
        ]
        t = Table(rows, colWidths=[3 * inch, 3 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        self.story.append(Paragraph(
            "<b>Target Metrics (Post-Remediation):</b>", self.styles['SubsectionTitle']))

        target_suggestions = max(0, len(suggestions) - len(suggestions) // 2)
        rows = [
            ['Metric', 'Target Value'],
            ['Hardening Score', str(target_score) + '/100'],
            ['Risk Level', target_risk],
            ['Active Warnings', '0'],
            ['Pending Suggestions', str(target_suggestions)],
        ]
        t = Table(rows, colWidths=[3 * inch, 3 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        text = (
            'Achieving the target metrics requires completing all critical '
            'remediation actions outlined in the Prioritized Remediation Roadmap. '
            'Regular reassessment is recommended to track progress toward the '
            'target hardening score of <b>' + str(target_score) + '/100</b>.'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_appendices(self, warnings: List, suggestions: List):
        """Section 10 - supplementary data."""
        self.story.append(
            Paragraph("10. APPENDICES", self.styles['SectionTitle']))

        self.story.append(Paragraph(
            "<b>A. Scan Statistics</b>", self.styles['SubsectionTitle']))

        rows = [
            ['Parameter', 'Value'],
            ['Scan Date', _safe(str(self.data.get('audit_date', 'Unknown')))],
            ['Target System', _safe(self.data.get('hostname', 'Unknown'))],
            ['Total Warnings', str(len(warnings))],
            ['Total Suggestions', str(len(suggestions))],
            ['Scan Tool', 'Automated security auditing tool conducted by ANATSECURITY'],
        ]
        t = Table(rows, colWidths=[2.5 * inch, 3.5 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        self.story.append(Paragraph(
            "<b>B. Categories Assessed</b>", self.styles['SubsectionTitle']))

        cats: set = set()
        for w in warnings:
            cat = w['test_id'].split('-')[0] if '-' in w['test_id'] else 'OTHER'
            cats.add(cat)
        for s in suggestions:
            cat = s['test_id'].split('-')[0] if '-' in s['test_id'] else 'OTHER'
            cats.add(cat)

        if cats:
            cat_text = ', '.join(sorted(cats))
            self.story.append(Paragraph(cat_text, self.styles['Normal']))
        else:
            self.story.append(Paragraph("N/A", self.styles['Normal']))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_auditor_signoff(self):
        """Section 11 - auditor sign-off placeholders."""
        self.story.append(
            Paragraph("11. AUDITOR SIGN-OFF", self.styles['SectionTitle']))

        rows = [
            ['Field', 'Value'],
            ['Auditor Name', ''],
            ['Title / Role', ''],
            ['Organization', 'ANATSECURITY'],
            ['Date', ''],
            ['Signature', ''],
        ]
        t = Table(rows, colWidths=[2 * inch, 4 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f7fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 18),
        ]))
        self.story.append(t)
        self.story.append(Spacer(1, 0.15 * inch))

        text = (
            '<font size=8 color="#666666"><i>'
            'By signing this document, the auditor confirms that the findings '
            'presented in this report accurately reflect the results of the '
            'security assessment conducted on the date specified above.'
            '</i></font>'
        )
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_document_metadata(self):
        """Section 12 - document metadata and footer."""
        self.story.append(
            Paragraph("12. DOCUMENT METADATA", self.styles['SectionTitle']))

        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        rows = [
            ['Property', 'Value'],
            ['Document Title', 'System Security Audit Report'],
            ['Report Type', 'Linux OS Hardening Assessment'],
            ['Generation Timestamp', ts],
            ['Document Classification', 'Confidential - Internal Use'],
            ['Generated By', 'ANATSCRAWLER Security Audit System'],
            ['Report Version', '2.0'],
        ]
        t = Table(rows, colWidths=[2.5 * inch, 3.5 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.3 * inch))

        footer = (
            '<font size=8 color="#999999">'
            'Report Generated: ' + ts + '<br/>'
            'Document Classification: Confidential - Internal Use<br/>'
            'Generated by ANATSCRAWLER Security Audit System<br/>'
            '\xa9 ANATSECURITY - All Rights Reserved'
            '</font>'
        )
        self.story.append(Paragraph(footer, self.styles['Normal']))

    # =============================== Build ===============================
    def generate(self, warnings: Optional[List] = None,
                 suggestions: Optional[List] = None) -> str:
        warnings = warnings or []
        suggestions = suggestions or []

        # Prefer Lynis hardening_index when available
        hi = self.data.get('hardening_index')
        if hi is not None:
            try:
                score = int(hi)
            except (ValueError, TypeError):
                score = max(0, min(100, 100 - len(warnings) * 5 - len(suggestions)))
        else:
            score = max(0, min(100, 100 - len(warnings) * 5 - len(suggestions)))

        # Cover Page
        self._section_cover_page()

        # Sections 1-3
        self.story.append(PageBreak())
        self._section_executive_summary(score, warnings, suggestions)
        self._section_audit_scope()
        self._section_system_information()

        # Sections 4-5
        self.story.append(PageBreak())
        self._section_risk_classification(warnings, suggestions)
        self._section_remediation_roadmap(warnings, suggestions)

        # Section 6
        self.story.append(PageBreak())
        self._section_detailed_findings(warnings, suggestions)

        # Sections 7-9
        self.story.append(PageBreak())
        self._section_risk_heat_map(warnings, suggestions)
        self._section_compliance_mapping(warnings, suggestions)
        self._section_before_after(score, warnings, suggestions)

        # Sections 10-12
        self.story.append(PageBreak())
        self._section_appendices(warnings, suggestions)
        self._section_auditor_signoff()
        self._section_document_metadata()

        self.doc.build(self.story)
        return self.output_path



# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Generate PDF report from Linux (Lynis) audit results'
    )
    parser.add_argument('report_file', help='Path to Lynis .dat report file')
    parser.add_argument('-o', '--output', default='audit_report.pdf',
                        help='Output PDF file path')
    parser.add_argument('-H', '--hostname', help='System hostname')
    parser.add_argument('-I', '--ip', help='System IP address')
    parser.add_argument('-O', '--owner', help='System owner name')
    parser.add_argument('-K', '--kernel', help='Kernel version')
    parser.add_argument('-C', '--company', help='Company name')
    parser.add_argument('--ai-cache', help='Path to JSON file with pre-computed AI enrichment data')
    parser.add_argument('--enrich-only', action='store_true',
                        help='Only run AI enrichment and output JSON (no PDF)')

    args = parser.parse_args()

    print(f"Parsing audit report: {args.report_file}")
    parser_obj = LynisReportParser(args.report_file)

    report_data = {
        'hostname': args.hostname or parser_obj.get_value('hostname', 'Unknown'),
        'ip_address': args.ip or parser_obj.get_value('nameserver', 'N/A'),
        'owner_name': args.owner or parser_obj.get_value('auditor', 'Not Specified'),
        'company_name': args.company or '',
        'os_name': parser_obj.get_value('os_name', 'Unknown'),
        'os_version': parser_obj.get_value('os_version', ''),
        'kernel_version': args.kernel or parser_obj.get_value('linux_kernel_release', 'Unknown'),
        'kernel_version_full': args.kernel or parser_obj.get_value('linux_kernel_version_full', 'Unknown'),
        'hardware_platform': parser_obj.get_value('hardware_platform', 'Unknown'),
        'vm': parser_obj.get_value('vm', 'Unknown'),
        'uptime_days': parser_obj.get_value('uptime_in_days', 'Unknown'),
        'service_manager': parser_obj.get_value('service_manager', 'Unknown'),
        'firewall_software': parser_obj.get_value('firewall_software', ''),
        'audit_daemon': parser_obj.get_value('audit_daemon_running', ''),
        'hardening_index': parser_obj.get_value('hardening_index'),
        'audit_date': parser_obj.get_value('report_datetime_start',
                                           datetime.now().isoformat()),
    }

    warnings = parser_obj.get_warnings()
    suggestions = parser_obj.get_suggestions()

    # Load pre-computed AI cache if provided
    if args.ai_cache and os.path.exists(args.ai_cache):
        try:
            with open(args.ai_cache, 'r') as f:
                cached = json.load(f)
            for k, v in cached.items():
                _ai_cache[k] = v
            print(f"Loaded {len(cached)} cached AI enrichments")
        except Exception as e:
            print(f"Warning: Could not load AI cache: {e}", file=sys.stderr)

    # Enrich-only mode: run AI and output JSON
    if args.enrich_only:
        print("Running AI enrichment only (no PDF generation)")
        warn_ai = _ai_enrich_findings(warnings, 'warning')
        sugg_ai = _ai_enrich_findings(suggestions, 'suggestion')
        all_ai = {}
        all_ai.update(warn_ai)
        all_ai.update(sugg_ai)
        output = json.dumps(all_ai, indent=2)
        if args.output and args.output != 'audit_report.pdf':
            with open(args.output, 'w') as f:
                f.write(output)
            print(f"AI enrichment data written to: {args.output}")
        else:
            print(output)
        return

    print(f"Generating PDF report: {args.output}")
    pdf_gen = AuditPDFReport(report_data, args.output)
    try:
        output_file = pdf_gen.generate(warnings, suggestions)
        hi = report_data.get('hardening_index')
        score = (int(hi) if hi is not None
                 else max(0, 100 - len(warnings) * 5 - len(suggestions)))
        print(f"Report generated: {output_file}")
        print(f"  Hardening Score: {score}/100")
        print(f"  Warnings: {len(warnings)}")
        print(f"  Suggestions: {len(suggestions)}")
    except Exception as e:
        print(f"Error generating PDF: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
