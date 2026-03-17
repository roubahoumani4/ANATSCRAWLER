#!/usr/bin/env python3
"""
PDF Report Generator for Windows OS Audit (HardeningKitty)
Uses AI (Gemini) as the primary analysis engine for finding interpretation.
No hardcoded knowledge base — all analysis is AI-generated.
Report structure mirrors the Linux/Lynis report for consistency.
"""

import argparse
import csv
import io
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
    )
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe(text: str, max_len: int = 0) -> str:
    """Escape XML-sensitive chars for ReportLab Paragraphs."""
    if not text:
        return ""
    t = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if max_len and len(t) > max_len:
        t = t[:max_len] + "..."
    return t


def _severity_bucket(sev: str) -> str:
    s = sev.strip().lower()
    if s in ("critical",):
        return "critical"
    if s in ("high",):
        return "high"
    if s in ("medium",):
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# AI Analysis Engine — Gemini as the primary interpreter for all findings
# ---------------------------------------------------------------------------

_ai_cache: Dict[str, dict] = {}


def _analyze_with_ai(findings: List[Dict]) -> Dict[str, dict]:
    """Batch-analyse Windows findings using Gemini AI.

    Returns a dict keyed by finding name with analysis results:
      {description, security_impact, recommended_fix, security_recommendation}
    Gracefully returns empty dict when the API key is missing or on errors.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or not findings:
        return {}

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
    except Exception as e:
        print(f"AI initialisation failed: {e}", file=sys.stderr)
        return {}

    results: Dict[str, dict] = {}
    batch_size = 15

    for batch_start in range(0, len(findings), batch_size):
        batch = findings[batch_start:batch_start + batch_size]

        # Filter out already-cached items
        uncached: List[Dict] = []
        for f in batch:
            cache_key = f.get("name", "")
            if cache_key in _ai_cache:
                results[cache_key] = _ai_cache[cache_key]
            else:
                uncached.append(f)

        if not uncached:
            continue

        # Build prompt
        findings_text = ""
        for j, f in enumerate(uncached, 1):
            sev = f.get('severity', '') or 'unknown'
            result = f.get('result', '') or ''
            findings_text += (
                f"\n{j}. Setting: {f.get('name', 'Unknown')}\n"
                f"   Category: {f.get('category', 'Unknown')}\n"
                f"   Severity: {sev}\n"
                f"   Current Value: {f.get('current_value', 'N/A')}\n"
                f"   Recommended Value: {f.get('recommended_value', 'N/A')}\n"
            )
            if result:
                findings_text += f"   Scan Result: {result}\n"

        prompt = (
            "You are a Windows security hardening expert. Analyse these Windows "
            "security audit findings from a HardeningKitty scan. These settings "
            "FAILED the compliance check. Pay attention to the Severity level "
            "of each finding — critical and high findings need urgent, detailed "
            "remediation steps, while medium and low findings need clear "
            "explanations of what the setting does and why it matters.\n\n"
            f"FINDINGS:{findings_text}\n\n"
            "For each finding provide Windows-specific analysis. Include Group "
            "Policy paths, PowerShell commands, or registry keys as applicable.\n\n"
            "Respond with a JSON array where each object has:\n"
            "{\n"
            '  "index": <finding number>,\n'
            '  "description": "<what this setting controls and why it matters, '
            '2-3 sentences>",\n'
            '  "security_impact": "<specific security risk if misconfigured, '
            '1-2 sentences>",\n'
            '  "recommended_fix": "<specific Windows fix: Group Policy path, '
            'PowerShell command, or registry key with exact values, '
            '2-4 sentences>",\n'
            '  "security_recommendation": "<best practice summary, 1 sentence>"\n'
            "}\n\n"
            "Respond ONLY with a valid JSON array. No markdown, no extra text."
        )

        try:
            resp = model.generate_content(prompt)
            text = resp.text.strip()

            # Strip markdown code fence if present
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\s*", "", text)
                text = re.sub(r"\s*```$", "", text)

            parsed = json.loads(text)
            if isinstance(parsed, list):
                for entry in parsed:
                    idx = entry.get("index", 0)
                    if 1 <= idx <= len(uncached):
                        name = uncached[idx - 1].get("name", "")
                        result = {
                            "description": entry.get("description", ""),
                            "security_impact": entry.get("security_impact", ""),
                            "recommended_fix": entry.get("recommended_fix", ""),
                            "security_recommendation": entry.get(
                                "security_recommendation", ""),
                        }
                        results[name] = result
                        _ai_cache[name] = result
        except json.JSONDecodeError as e:
            batch_num = batch_start // batch_size + 1
            print(f"AI response parse error (batch {batch_num}): {e}",
                  file=sys.stderr)
        except Exception as e:
            batch_num = batch_start // batch_size + 1
            print(f"AI analysis error (batch {batch_num}): {e}",
                  file=sys.stderr)

    return results


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_csv_report(csv_text: str) -> Dict:
    """Parse HardeningKitty CSV report into structured data."""
    findings: Dict[str, List[Dict]] = defaultdict(list)
    categories: Dict[str, Dict[str, int]] = defaultdict(
        lambda: {"passed": 0, "failed": 0})
    seen_ids: set = set()
    passed = 0
    failed = 0
    total = 0

    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        total += 1
        test_result = (row.get("TestResult") or "").strip()
        severity = _severity_bucket(row.get("Severity") or "medium")
        category = row.get("Category") or "Uncategorized"
        name = row.get("Name") or ""
        rec_value = row.get("RecommendedValue") or ""
        cur_value = row.get("DefaultValue") or ""
        finding_id = row.get("ID") or ""

        if test_result == "Passed":
            passed += 1
            categories[category]["passed"] += 1
        else:
            failed += 1
            categories[category]["failed"] += 1

            # Deduplication for ASR, Policy, and Intune
            def get_dedup_key(i: str, n: str) -> str:
                nl = n.lower()
                if "asr" in nl or "attack surface reduction" in nl:
                    m = re.search(
                        r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-'
                        r'[0-9a-f]{4}-[0-9a-f]{12})', nl)
                    if m:
                        return "asr_" + m.group(1)
                if "intune" in nl or "policy" in nl:
                    return re.sub(r'[^a-z0-9]', '', nl)
                return i or n

            dedup_key = get_dedup_key(finding_id, name)
            if dedup_key in seen_ids:
                continue
            seen_ids.add(dedup_key)
            findings[severity].append({
                "id": finding_id,
                "category": category,
                "name": name,
                "severity": severity,
                "current_value": cur_value,
                "recommended_value": rec_value,
                "result": (row.get("Result") or "").strip(),
                "method": row.get("Method") or "",
            })

    score = round((passed / total) * 100) if total > 0 else 0
    return {
        "findings": dict(findings),
        "categories": dict(categories),
        "passed": passed,
        "failed": failed,
        "total": total,
        "score": score,
    }


def parse_console_output(raw_output: str) -> Dict:
    """Fallback parser when CSV is not available."""
    findings: Dict[str, List[Dict]] = defaultdict(list)
    passed = 0
    failed = 0

    for line in raw_output.splitlines():
        line = line.strip()
        if not line:
            continue
        if "[PASS]" in line:
            passed += 1
        elif "[FAIL]" in line or "FAILED" in line.upper():
            failed += 1
            # Classify severity from keywords in the line
            t = line.lower()
            if any(k in t for k in [
                "firewall", "defender", "credential", "admin",
                "password", "lockout", "bitlocker"
            ]):
                sev = "critical"
            elif any(k in t for k in [
                "uac", "smb", "rdp", "winrm", "tls", "encryption", "ntlm"
            ]):
                sev = "high"
            elif any(k in t for k in [
                "audit", "logging", "registry", "update", "patch", "powershell"
            ]):
                sev = "medium"
            else:
                sev = "low"
            findings[sev].append({
                "id": "",
                "category": "",
                "name": re.sub(r"\s+", " ", line)[:200],
                "severity": sev,
                "current_value": "",
                "recommended_value": "",
                "result": "",
                "method": "",
            })

    total = passed + failed
    score = round((passed / total) * 100) if total > 0 else 0
    return {
        "findings": dict(findings),
        "categories": {},
        "passed": passed,
        "failed": failed,
        "total": total,
        "score": score,
    }


# ---------------------------------------------------------------------------
# PDF Report Builder – unified structure mirroring the Lynis report
# ---------------------------------------------------------------------------

class WindowsAuditPDFReport:
    """Generate unified PDF audit report from HardeningKitty data with AI analysis.

    Sections:
      1. System Information
      2. Audit Summary
      3. Findings Overview
      4. Detailed Findings  (AI-enriched)
      5. Overall Security Posture
    """

    def __init__(self, output_path: str, hostname: str, ip_address: str,
                 owner_name: str, parsed: Dict, kernel_version: str = 'Unknown',
                 company_name: str = ''):
        self.output_path = output_path
        self.hostname = hostname
        self.ip_address = ip_address
        self.owner_name = owner_name
        self.kernel_version = kernel_version
        self.company_name = company_name
        self.parsed = parsed
        self.ai_results: Dict[str, dict] = {}
        self.styles = self._create_styles()
        self.doc = SimpleDocTemplate(
            output_path, pagesize=A4,
            rightMargin=0.75 * inch, leftMargin=0.75 * inch,
            topMargin=0.75 * inch, bottomMargin=0.75 * inch,
        )
        self.story: list = []

    # ------------------------------------------------------------------ styles
    def _create_styles(self):
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            "ReportTitle", parent=styles["Heading1"],
            fontSize=24, textColor=colors.HexColor("#1a365d"),
            spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold",
        ))
        styles.add(ParagraphStyle(
            "ReportSubtitle", parent=styles["Heading2"],
            fontSize=14, textColor=colors.HexColor("#2c5282"),
            spaceAfter=12, alignment=TA_CENTER,
        ))
        styles.add(ParagraphStyle(
            "SectionTitle", parent=styles["Heading2"],
            fontSize=14, textColor=colors.HexColor("#1a365d"),
            spaceAfter=6, spaceBefore=12, fontName="Helvetica-Bold",
            borderColor=colors.HexColor("#cbd5e0"), borderWidth=2, borderPadding=6,
        ))
        styles.add(ParagraphStyle(
            "SubsectionTitle", parent=styles["Heading3"],
            fontSize=12, textColor=colors.HexColor("#2d3748"),
            spaceAfter=6, spaceBefore=10,
        ))
        styles.add(ParagraphStyle(
            "FindingCritical", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#742a2a"),
            backgroundColor=colors.HexColor("#fed7d7"),
        ))
        styles.add(ParagraphStyle(
            "FindingHigh", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#7c2d12"),
            backgroundColor=colors.HexColor("#ffedd5"),
        ))
        styles.add(ParagraphStyle(
            "FindingMedium", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#92400e"),
            backgroundColor=colors.HexColor("#fef3c7"),
        ))
        styles.add(ParagraphStyle(
            "FindingLow", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#1e3a5f"),
            backgroundColor=colors.HexColor("#dbeafe"),
        ))
        return styles

    def _risk_level(self, score: int):
        if score >= 80:
            return "Low", colors.HexColor("#22863a")
        if score >= 60:
            return "Medium", colors.HexColor("#f0ad4e")
        if score >= 40:
            return "High", colors.HexColor("#d9534f")
        return "Critical", colors.HexColor("#cc3333")

    def _std_table_style(self):
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f7fafc")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ])

    # ------------------------------------------------------------------ AI
    def _run_ai_analysis(self):
        """Send all failed findings to the AI for batch analysis."""
        all_findings: List[Dict] = []
        for sev in ["critical", "high", "medium", "low"]:
            all_findings.extend(self.parsed["findings"].get(sev, []))

        if all_findings:
            print(f"Analysing {len(all_findings)} findings with AI...")
            self.ai_results = _analyze_with_ai(all_findings)
            print(f"AI analysis complete: "
                  f"{len(self.ai_results)}/{len(all_findings)} findings enriched")

    def _get_finding_analysis(self, finding: Dict) -> Dict[str, str]:
        """Return AI analysis for a finding, empty strings when unavailable."""
        ai = self.ai_results.get(finding.get("name", ""), {})
        return {
            "description": ai.get("description", ""),
            "security_impact": ai.get("security_impact", ""),
            "recommended_fix": ai.get("recommended_fix", ""),
            "security_recommendation": ai.get("security_recommendation", ""),
        }

    def _get_warnings(self) -> List[Dict]:
        """Critical + High findings = Warnings (matching Lynis)."""
        return (self.parsed["findings"].get("critical", [])
                + self.parsed["findings"].get("high", []))

    def _get_suggestions(self) -> List[Dict]:
        """Medium + Low findings = Suggestions (matching Lynis)."""
        return (self.parsed["findings"].get("medium", [])
                + self.parsed["findings"].get("low", []))

    # ========================== Sections ==============================

    def _section_report_overview(self):
        """Report header with title and metadata."""
        self.story.append(Paragraph(
            "SYSTEM SECURITY AUDIT REPORT", self.styles["ReportTitle"]))
        self.story.append(Paragraph(
            "Windows OS Hardening Assessment", self.styles["ReportSubtitle"]))

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        meta = f"""
        <font size=9>
        <b>Report Generated:</b> {now}<br/>
        <b>Company:</b> {_safe(self.company_name) or 'N/A'}<br/>
        <b>System:</b> {_safe(self.hostname)}<br/>
        <b>IP Address:</b> {_safe(self.ip_address)}<br/>
        <b>OS Version:</b> {_safe(self.kernel_version)}<br/>
        <b>Owner:</b> {_safe(self.owner_name)}<br/>
        </font>
        """
        self.story.append(Paragraph(meta, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.25 * inch))

        ai_note = ("Findings are enriched with AI-generated analysis."
                   if self.ai_results
                   else "AI analysis unavailable; showing raw scan data.")
        disclaimer = f"""
        <font size=8 color="#666666">
        <i>This report contains confidential security audit information.
        Unauthorized access, use, or distribution is prohibited.
        {ai_note}</i>
        </font>
        """
        self.story.append(Paragraph(disclaimer, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_system_information(self):
        """Section 1 – system details and category breakdown."""
        self.story.append(Paragraph(
            "1. SYSTEM INFORMATION", self.styles["SectionTitle"]))

        info = f"""
        <b>System Identification:</b><br/>
        Hostname: {_safe(self.hostname)}<br/>
        IP Address: {_safe(self.ip_address)}<br/>
        Owner: {_safe(self.owner_name)}<br/>
        <br/>
        <b>Operating System:</b><br/>
        Platform: Microsoft Windows<br/>
        OS Version: {_safe(self.kernel_version)}<br/>
        <br/>
        <b>Audit Scope:</b><br/>
        Total Configuration Checks: {self.parsed['total']}<br/>
        Categories Evaluated: {len(self.parsed.get('categories', {}))}<br/>
        """
        self.story.append(Paragraph(info, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.2 * inch))

        cats = self.parsed.get("categories", {})
        if cats:
            self.story.append(Paragraph(
                "<b>Category Breakdown</b>", self.styles["SubsectionTitle"]))
            rows = [["Category", "Passed", "Failed", "Compliance"]]
            for cat in sorted(cats.keys()):
                c = cats[cat]
                t_count = c["passed"] + c["failed"]
                pct = round((c["passed"] / t_count) * 100) if t_count > 0 else 0
                rows.append([
                    _safe(cat, 50), str(c["passed"]),
                    str(c["failed"]), f"{pct}%"
                ])
            t = Table(rows, colWidths=[2.8 * inch, 1.0 * inch,
                                       1.0 * inch, 1.2 * inch])
            t.setStyle(self._std_table_style())
            self.story.append(t)
            self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_audit_summary(self):
        """Section 2 – executive summary with score and counts."""
        self.story.append(Paragraph(
            "2. AUDIT SUMMARY", self.styles["SectionTitle"]))

        p = self.parsed
        score = p["score"]
        risk, _ = self._risk_level(score)
        warnings = self._get_warnings()
        suggestions = self._get_suggestions()

        rows = [
            ["Metric", "Value"],
            ["Compliance Score", f"{score}/100"],
            ["Risk Level", risk],
            ["Total Checks", str(p["total"])],
            ["Passed", str(p["passed"])],
            ["Failed", str(p["failed"])],
            ["Warnings (Critical Issues)", str(len(warnings))],
            ["Suggestions (Recommendations)", str(len(suggestions))],
        ]
        t = Table(rows, colWidths=[3 * inch, 3 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f7fafc")]),
        ]))
        self.story.append(t)
        self.story.append(Spacer(1, 0.2 * inch))

        narrative = f"""
        This security audit assessed the Windows system using the HardeningKitty tool.
        The system achieved a compliance score of <b>{score}/100</b>, indicating a
        <b>{risk}</b> risk level. The scan identified <b>{len(warnings)}</b> warning(s)
        requiring immediate attention and <b>{len(suggestions)}</b> suggestion(s) for
        security improvement.
        """
        self.story.append(Paragraph(narrative, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _section_findings_overview(self):
        """Section 3 – warnings vs suggestions breakdown."""
        self.story.append(Paragraph(
            "3. FINDINGS OVERVIEW", self.styles["SectionTitle"]))

        warnings = self._get_warnings()
        suggestions = self._get_suggestions()

        rows = [
            ["Category", "Warnings", "Suggestions", "Total"],
        ]

        # Group by category
        cats: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {'warnings': 0, 'suggestions': 0})
        for f in warnings:
            cat = f.get('category', 'Uncategorized') or 'Uncategorized'
            cats[cat]['warnings'] += 1
        for f in suggestions:
            cat = f.get('category', 'Uncategorized') or 'Uncategorized'
            cats[cat]['suggestions'] += 1

        for cat in sorted(cats.keys()):
            c = cats[cat]
            rows.append([
                _safe(cat, 50), str(c['warnings']), str(c['suggestions']),
                str(c['warnings'] + c['suggestions'])
            ])
        rows.append([
            'TOTAL', str(len(warnings)), str(len(suggestions)),
            str(len(warnings) + len(suggestions))
        ])

        t = Table(rows, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch, 1 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _section_detailed_findings(self):
        """Section 4 – Warnings + Suggestions layout matching the Lynis report.
        AI provides recommendation and details for each finding."""
        self.story.append(Paragraph(
            "4. DETAILED FINDINGS", self.styles["SectionTitle"]))

        ai_used = bool(self.ai_results)
        if ai_used:
            self.story.append(Paragraph(
                '<font size=8 color="#666666"><i>Fields marked with '
                '(*) were generated by AI analysis.</i></font>',
                self.styles["Normal"]))
            self.story.append(Spacer(1, 0.1 * inch))

        warnings = self._get_warnings()
        suggestions = self._get_suggestions()

        # 4.1 Warnings (critical + high)
        self.story.append(Paragraph(
            f"4.1 Warnings ({len(warnings)} findings)",
            self.styles["SubsectionTitle"]))

        if not warnings:
            self.story.append(Paragraph(
                "No warnings were identified during the scan.",
                self.styles["Normal"]))
        else:
            for idx, f in enumerate(warnings, 1):
                ai = self._get_finding_analysis(f)
                name = _safe(f.get("name", ""), 120)
                fid = _safe(f.get("id", ""))
                result = f.get("result", "").strip()

                text = f"<b>{idx}. [{fid}] {name}</b>"

                # Result from CSV scan
                if result:
                    text += (f"<br/><b>Result:</b> "
                             f"{_safe(result, 200)}")

                # Details from AI
                desc = ai.get("description", "")
                impact = ai.get("security_impact", "")
                detail_text = ". ".join(filter(None, [desc, impact]))
                if detail_text:
                    text += (f"<br/><b>Details (*):</b> "
                             f"{_safe(detail_text)}")

                # Suggestion from AI
                rec = ai.get("recommended_fix", "")
                if rec:
                    text += (f"<br/><b>Suggestion (*):</b> "
                             f"{_safe(rec)}")

                self.story.append(
                    Paragraph(text, self.styles["FindingCritical"]))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

        # 4.2 Suggestions (medium + low)
        self.story.append(Paragraph(
            f"4.2 Suggestions ({len(suggestions)} findings)",
            self.styles["SubsectionTitle"]))

        if not suggestions:
            self.story.append(Paragraph(
                "No suggestions were identified during the scan.",
                self.styles["Normal"]))
        else:
            for idx, f in enumerate(suggestions, 1):
                ai = self._get_finding_analysis(f)
                name = _safe(f.get("name", ""), 120)
                fid = _safe(f.get("id", ""))
                result = f.get("result", "").strip()

                text = f"<b>{idx}. [{fid}] {name}</b>"

                # Result from CSV scan
                if result:
                    text += (f"<br/><b>Result:</b> "
                             f"{_safe(result, 200)}")

                # Details from AI description + security_impact
                details = ai.get("description", "")
                impact = ai.get("security_impact", "")
                detail_text = ". ".join(filter(None, [details, impact]))
                if detail_text:
                    text += (f"<br/><b>Details (*):</b> "
                             f"{_safe(detail_text)}")

                # Suggestion from AI
                rec = ai.get("recommended_fix", "")
                if rec:
                    text += (f"<br/><b>Suggestion (*):</b> "
                             f"{_safe(rec)}")

                self.story.append(
                    Paragraph(text, self.styles["FindingLow"]))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _section_security_posture(self):
        """Section 5 – data-driven conclusion."""
        self.story.append(Paragraph(
            "5. OVERALL SECURITY POSTURE", self.styles["SectionTitle"]))

        score = self.parsed["score"]
        risk, _ = self._risk_level(score)
        warnings = self._get_warnings()
        suggestions = self._get_suggestions()

        ai_note = (
            "Findings have been enriched with AI-generated security analysis, "
            "including descriptions, impact assessments, and Windows-specific "
            "remediation steps."
            if self.ai_results
            else "AI analysis was not available for this report. Findings show "
                 "raw scan data only."
        )

        text = f"""
        The HardeningKitty security audit of <b>{_safe(self.hostname)}</b> resulted
        in a compliance score of <b>{score}/100</b>, placing the system at a
        <b>{risk}</b> risk level.<br/><br/>
        The scan identified <b>{len(warnings)}</b> warning(s) and
        <b>{len(suggestions)}</b> suggestion(s). Warnings represent critical security
        issues that should be prioritised for remediation. Suggestions are recommended
        improvements to strengthen the system's security posture.<br/><br/>
        {ai_note}
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _footer(self):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        text = f"""
        <font size=8 color="#999999">
        Report Generated: {ts}<br/>
        Document Classification: Internal Use<br/>
        Generated by ANATSCRAWLER Security Audit System
        </font>
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))

    # ========================== Build =================================
    def generate(self) -> str:
        # Run AI analysis before building the PDF
        self._run_ai_analysis()

        self._section_report_overview()
        self._section_system_information()
        self._section_audit_summary()

        self.story.append(PageBreak())
        self._section_findings_overview()

        self.story.append(PageBreak())
        self._section_detailed_findings()

        self.story.append(PageBreak())
        self._section_security_posture()
        self._footer()

        self.doc.build(self.story)
        return self.output_path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate PDF report from Windows (HardeningKitty) audit results"
    )
    parser.add_argument("input_file",
                        help="Path to Windows audit output text file")
    parser.add_argument("-o", "--output", default="windows_audit_report.pdf",
                        help="Output PDF file")
    parser.add_argument("-H", "--hostname", required=True,
                        help="System hostname")
    parser.add_argument("-I", "--ip", required=True,
                        help="System IP address")
    parser.add_argument("-O", "--owner", required=True,
                        help="Owner name")
    parser.add_argument("-K", "--kernel", default="Unknown",
                        help="Kernel/OS version")
    parser.add_argument("-C", "--company", default="",
                        help="Company name")

    args = parser.parse_args()

    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        return 1

    raw = input_path.read_text(encoding="utf-8", errors="ignore")

    first_line = raw.split("\n", 1)[0] if raw else ""
    if ("ID" in first_line and "Category" in first_line
            and "TestResult" in first_line):
        print("Detected CSV report format")
        parsed = parse_csv_report(raw)
    else:
        print("Using console output parser (fallback)")
        parsed = parse_console_output(raw)

    report = WindowsAuditPDFReport(
        output_path=args.output,
        hostname=args.hostname,
        ip_address=args.ip,
        owner_name=args.owner,
        kernel_version=args.kernel,
        company_name=args.company,
        parsed=parsed,
    )
    report.generate()

    print(f"Generated report: {args.output}")
    print(f"Score: {parsed['score']}/100  |  "
          f"Passed: {parsed['passed']}  |  Failed: {parsed['failed']}")
    for sev in ["critical", "high", "medium", "low"]:
        count = len(parsed["findings"].get(sev, []))
        print(f"  {sev.title()}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
