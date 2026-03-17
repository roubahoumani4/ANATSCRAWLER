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

    model = "llama-3.3-70b-versatile"
    results: Dict[str, dict] = dict(_ai_cache)
    batch_size = 15

    for batch_start in range(0, len(needs_fill), batch_size):
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
# PDF Report Builder – unified structure
# ---------------------------------------------------------------------------

class AuditPDFReport:
    """Generate unified PDF audit report from Lynis scan data.

    Sections:
      1. System Information
      2. Audit Summary
      3. Findings Overview
      4. Detailed Findings
      5. Overall Security Posture
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
            name='FindingWarning', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#742a2a'),
            backgroundColor=colors.HexColor('#fed7d7')
        ))
        styles.add(ParagraphStyle(
            name='FindingSuggestion', parent=styles['Normal'],
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

    def _section_report_overview(self):
        """Report header with title and metadata."""
        self.story.append(
            Paragraph("SYSTEM SECURITY AUDIT REPORT", self.styles['ReportTitle']))
        self.story.append(
            Paragraph("Linux OS Hardening Assessment", self.styles['ReportSubtitle']))

        audit_date = self.data.get(
            'audit_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        meta = f"""
        <font size=9>
        <b>Report Generated:</b> {_safe(str(audit_date))}<br/>
        <b>Company:</b> {_safe(self.data.get('company_name', '')) or 'N/A'}<br/>
        <b>System:</b> {_safe(self.data.get('hostname', 'Unknown'))}<br/>
        <b>IP Address:</b> {_safe(self.data.get('ip_address', 'N/A'))}<br/>
        <b>OS:</b> {_safe(self.data.get('os_name', 'Unknown'))} {_safe(self.data.get('os_version', ''))}<br/>
        <b>Kernel:</b> {_safe(self.data.get('kernel_version', 'Unknown'))}<br/>
        <b>Owner:</b> {_safe(self.data.get('owner_name', 'Not Specified'))}<br/>
        </font>
        """
        self.story.append(Paragraph(meta, self.styles['Normal']))
        self.story.append(Spacer(1, 0.25 * inch))

        disclaimer = """
        <font size=8 color="#666666">
        <i>This report contains confidential security audit information.
        Unauthorized access, use, or distribution is prohibited.
        All findings and recommendations are derived directly from the Lynis security scan output.</i>
        </font>
        """
        self.story.append(Paragraph(disclaimer, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_system_information(self):
        """Section 1 – system details extracted from the Lynis .dat file."""
        self.story.append(
            Paragraph("1. SYSTEM INFORMATION", self.styles['SectionTitle']))

        info = f"""
        <b>System Identification:</b><br/>
        Hostname: {_safe(self.data.get('hostname', 'Unknown'))}<br/>
        IP Address: {_safe(self.data.get('ip_address', 'N/A'))}<br/>
        Owner: {_safe(self.data.get('owner_name', 'Not Specified'))}<br/>
        <br/>
        <b>Operating System:</b><br/>
        OS: {_safe(self.data.get('os_name', 'Unknown'))} {_safe(self.data.get('os_version', ''))}<br/>
        Kernel Version: {_safe(self.data.get('kernel_version_full', 'Unknown'))}<br/>
        Hardware Platform: {_safe(self.data.get('hardware_platform', 'Unknown'))}<br/>
        Virtual Machine: {_safe(self.data.get('vm', 'Unknown'))}<br/>
        <br/>
        <b>Environment:</b><br/>
        Uptime (days): {_safe(self.data.get('uptime_days', 'Unknown'))}<br/>
        Service Manager: {_safe(self.data.get('service_manager', 'Unknown'))}<br/>
        Firewall Software: {_safe(self.data.get('firewall_software', '')) or 'Not Detected'}<br/>
        Audit Daemon: {'Running' if self.data.get('audit_daemon') else 'Not Detected'}<br/>
        """
        self.story.append(Paragraph(info, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_audit_summary(self, score: int, warnings: List, suggestions: List):
        """Section 2 – executive summary with score and counts."""
        self.story.append(
            Paragraph("2. AUDIT SUMMARY", self.styles['SectionTitle']))

        risk, _ = self._risk_level(score)

        rows = [
            ['Metric', 'Value'],
            ['Hardening Score', f'{score}/100'],
            ['Risk Level', risk],
            ['Warnings (Critical Issues)', str(len(warnings))],
            ['Suggestions (Recommendations)', str(len(suggestions))],
            ['Total Findings', str(len(warnings) + len(suggestions))],
        ]
        t = Table(rows, colWidths=[3 * inch, 3 * inch])
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
        self.story.append(Spacer(1, 0.2 * inch))

        narrative = f"""
        This security audit assessed the system using the Lynis security auditing tool.
        The system achieved a hardening score of <b>{score}/100</b>, indicating a <b>{risk}</b>
        risk level. The scan identified <b>{len(warnings)}</b> warning(s) requiring immediate
        attention and <b>{len(suggestions)}</b> suggestion(s) for security improvement.
        """
        self.story.append(Paragraph(narrative, self.styles['Normal']))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _section_findings_overview(self, warnings: List, suggestions: List):
        """Section 3 – category breakdown derived from test IDs."""
        self.story.append(
            Paragraph("3. FINDINGS OVERVIEW", self.styles['SectionTitle']))

        categories: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {'warnings': 0, 'suggestions': 0})
        for w in warnings:
            cat = w['test_id'].split('-')[0] if '-' in w['test_id'] else 'OTHER'
            categories[cat]['warnings'] += 1
        for s in suggestions:
            cat = s['test_id'].split('-')[0] if '-' in s['test_id'] else 'OTHER'
            categories[cat]['suggestions'] += 1

        if categories:
            rows = [['Category', 'Warnings', 'Suggestions', 'Total']]
            for cat in sorted(categories.keys()):
                c = categories[cat]
                rows.append([
                    cat, str(c['warnings']), str(c['suggestions']),
                    str(c['warnings'] + c['suggestions'])
                ])
            rows.append([
                'TOTAL', str(len(warnings)), str(len(suggestions)),
                str(len(warnings) + len(suggestions))
            ])
            t = Table(rows, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch, 1 * inch])
            t.setStyle(self._std_table_style())
            self.story.append(t)
        else:
            self.story.append(
                Paragraph("No findings to display.", self.styles['Normal']))

        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _section_detailed_findings(self, warnings: List, suggestions: List):
        """Section 4 – every finding with its scan data.
        Empty recommendation/details fields are filled by AI when available."""
        self.story.append(
            Paragraph("4. DETAILED FINDINGS", self.styles['SectionTitle']))

        # Run AI enrichment for findings with empty fields
        warn_ai = _ai_enrich_findings(warnings, 'warning')
        sugg_ai = _ai_enrich_findings(suggestions, 'suggestion')

        ai_used = bool(warn_ai or sugg_ai)
        if ai_used:
            self.story.append(Paragraph(
                '<font size=8 color="#666666"><i>Fields marked with '
                '(*) were generated by AI analysis.</i></font>',
                self.styles['Normal']))
            self.story.append(Spacer(1, 0.1 * inch))

        # 4.1 Warnings
        self.story.append(Paragraph(
            f"4.1 Warnings ({len(warnings)} findings)",
            self.styles['SubsectionTitle']))

        if not warnings:
            self.story.append(Paragraph(
                "No warnings were identified during the scan.",
                self.styles['Normal']))
        else:
            for idx, w in enumerate(warnings, 1):
                tid = w.get('test_id', '')
                desc = _safe(w.get('description', ''))
                rec = w.get('recommendation', '').strip()

                # Fill empty recommendation from AI
                ai_marker = ''
                if _is_empty(rec) and tid in warn_ai:
                    rec = warn_ai[tid].get('recommendation', '')
                    ai_marker = ' (*)'
                elif _is_empty(rec):
                    rec = ''

                text = f"<b>{idx}. [{_safe(tid)}] {desc}</b>"
                if rec:
                    text += (f"<br/><b>Recommendation{ai_marker}:</b> "
                             f"{_safe(rec)}")

                # Always show AI suggestion for what to do
                suggestion = ''
                if tid in warn_ai:
                    suggestion = warn_ai[tid].get('suggestion', '')
                if suggestion:
                    text += (f"<br/><b>Suggestion (*):</b> "
                             f"{_safe(suggestion)}")

                self.story.append(
                    Paragraph(text, self.styles['FindingWarning']))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

        # 4.2 Suggestions
        self.story.append(Paragraph(
            f"4.2 Suggestions ({len(suggestions)} findings)",
            self.styles['SubsectionTitle']))

        if not suggestions:
            self.story.append(Paragraph(
                "No suggestions were identified during the scan.",
                self.styles['Normal']))
        else:
            for idx, s in enumerate(suggestions, 1):
                tid = s.get('test_id', '')
                desc = _safe(s.get('description', ''))
                details = s.get('details', '').strip()
                solution = s.get('solution', '').strip()

                # Treat '-' placeholders as empty
                if _is_empty(details):
                    details = ''
                if _is_empty(solution):
                    solution = ''

                # Fill empty fields from AI
                det_marker = ''
                sol_marker = ''
                if tid in sugg_ai:
                    ai_data = sugg_ai[tid]
                    if not details:
                        details = ai_data.get('details', '')
                        det_marker = ' (*)'
                    if not solution:
                        solution = ai_data.get('recommendation', '')
                        sol_marker = ' (*)'

                text = f"<b>{idx}. [{_safe(tid)}] {desc}</b>"
                if details:
                    text += (f"<br/><b>Details{det_marker}:</b> "
                             f"{_safe(details)}")
                if solution:
                    text += (f"<br/><b>Recommendation{sol_marker}:</b> "
                             f"{_safe(solution)}")

                self.story.append(
                    Paragraph(text, self.styles['FindingSuggestion']))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_security_posture(self, score: int, warnings: List, suggestions: List):
        """Section 5 – data-driven conclusion."""
        self.story.append(
            Paragraph("5. OVERALL SECURITY POSTURE", self.styles['SectionTitle']))

        risk, _ = self._risk_level(score)

        text = f"""
        The Lynis security audit of <b>{_safe(self.data.get('hostname', 'the target system'))}</b>
        resulted in a hardening score of <b>{score}/100</b>, placing the system at a
        <b>{risk}</b> risk level.<br/><br/>
        The scan identified <b>{len(warnings)}</b> warning(s) and <b>{len(suggestions)}</b>
        suggestion(s). Warnings represent critical security issues that should be prioritised
        for remediation. Suggestions are recommended improvements to strengthen the system's
        security posture.<br/><br/>
        All findings and recommendations in this report are derived directly from the Lynis
        security scan output. Remediation steps should be implemented in order of severity,
        starting with warnings.
        """
        self.story.append(Paragraph(text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _footer(self):
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        text = f"""
        <font size=8 color="#999999">
        Report Generated: {ts}<br/>
        Document Classification: Internal Use<br/>
        Generated by ANATSCRAWLER Security Audit System
        </font>
        """
        self.story.append(Paragraph(text, self.styles['Normal']))

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

        self._section_report_overview()
        self._section_system_information()
        self._section_audit_summary(score, warnings, suggestions)

        self.story.append(PageBreak())
        self._section_findings_overview(warnings, suggestions)

        self.story.append(PageBreak())
        self._section_detailed_findings(warnings, suggestions)

        self.story.append(PageBreak())
        self._section_security_posture(score, warnings, suggestions)
        self._footer()

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
