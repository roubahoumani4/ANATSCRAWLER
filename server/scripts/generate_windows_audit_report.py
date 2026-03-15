#!/usr/bin/env python3
"""
ANATSCRAWLER Windows OS Hardening Audit Report Generator
Generates comprehensive PDF reports from Windows audit output
matching the structure and depth of the Lynis audit reports.
Compliant with: ISO 27001, NIST, CIS Benchmarks
"""

import argparse
import csv
import io
import json
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
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def _severity_bucket(sev: str) -> str:
    s = sev.strip().lower()
    if s in ("critical",):
        return "critical"
    if s in ("high",):
        return "high"
    if s in ("medium",):
        return "medium"
    return "low"


def _guess_severity_from_text(text: str) -> str:
    t = text.lower()
    critical_kw = ["firewall", "defender", "credential", "admin", "password policy", "lockout", "bitlocker"]
    high_kw = ["uac", "smb", "rdp", "winrm", "tls", "ssl", "encryption", "remote desktop", "ntlm"]
    medium_kw = ["audit", "logging", "registry", "update", "patch", "powershell", "script"]
    if any(k in t for k in critical_kw):
        return "critical"
    if any(k in t for k in high_kw):
        return "high"
    if any(k in t for k in medium_kw):
        return "medium"
    return "low"


def _safe(text: str, max_len: int = 0) -> str:
    """Escape XML-sensitive chars for ReportLab Paragraphs."""
    t = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if max_len and len(t) > max_len:
        t = t[:max_len] + "..."
    return t


def parse_csv_report(csv_text: str) -> Dict:
    """Parse HardeningKitty CSV report into structured data."""
    findings: Dict[str, List[Dict]] = defaultdict(list)
    categories: Dict[str, Dict[str, int]] = defaultdict(lambda: {"passed": 0, "failed": 0})
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
            findings[severity].append({
                "id": finding_id,
                "category": category,
                "name": name,
                "current_value": cur_value,
                "recommended_value": rec_value,
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
            sev = _guess_severity_from_text(line)
            failed += 1
            findings[sev].append({
                "id": "",
                "category": "",
                "name": re.sub(r"\s+", " ", line)[:200],
                "current_value": "",
                "recommended_value": "",
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
# PDF Report Builder – mirrors the Lynis report structure
# ---------------------------------------------------------------------------

class WindowsAuditPDFReport:
    """Generate a comprehensive Windows audit PDF matching Lynis report depth."""

    SEV_COLORS = {
        "critical": colors.HexColor("#742a2a"),
        "high": colors.HexColor("#7c2d12"),
        "medium": colors.HexColor("#92400e"),
        "low": colors.HexColor("#1e3a5f"),
    }
    SEV_BG = {
        "critical": colors.HexColor("#fed7d7"),
        "high": colors.HexColor("#ffedd5"),
        "medium": colors.HexColor("#fef3c7"),
        "low": colors.HexColor("#dbeafe"),
    }

    def __init__(self, output_path: str, hostname: str, ip_address: str,
                 owner_name: str, parsed: Dict):
        self.output_path = output_path
        self.hostname = hostname
        self.ip_address = ip_address
        self.owner_name = owner_name
        self.parsed = parsed
        self.styles = self._create_styles()
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )
        self.story: list = []

    # ------------------------------------------------------------------
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
            "CustomBodyText", parent=styles["Normal"],
            fontSize=10, alignment=TA_JUSTIFY, spaceAfter=6,
        ))
        styles.add(ParagraphStyle(
            "CriticalFinding", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#742a2a"),
            backgroundColor=colors.HexColor("#fed7d7"),
        ))
        styles.add(ParagraphStyle(
            "HighFinding", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#7c2d12"),
            backgroundColor=colors.HexColor("#ffedd5"),
        ))
        return styles

    # ------------------------------------------------------------------
    def _risk_level(self, score: int):
        if score >= 80:
            return "Low", colors.HexColor("#22863a")
        if score >= 60:
            return "Medium", colors.HexColor("#f0ad4e")
        if score >= 40:
            return "High", colors.HexColor("#d9534f")
        return "Critical", colors.HexColor("#cc3333")

    # ------------------------------------------------------------------
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

    # ========================== Sections ==============================
    def _header(self):
        self.story.append(Paragraph(
            "SYSTEM SECURITY AUDIT REPORT", self.styles["ReportTitle"]))
        self.story.append(Paragraph(
            "Windows OS Hardening Assessment", self.styles["ReportSubtitle"]))

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        meta = f"""
        <font size=9>
        <b>Report Generated:</b> {now}<br/>
        <b>System:</b> {_safe(self.hostname)}<br/>
        <b>IP Address:</b> {_safe(self.ip_address)}<br/>
        <b>Owner:</b> {_safe(self.owner_name)}<br/>
        <b>Audit Standard:</b> ISO 27001 / NIST / CIS Benchmarks
        </font>
        """
        self.story.append(Paragraph(meta, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.25 * inch))

        disclaimer = """
        <font size=8 color="#666666">
        <i>This report contains confidential security audit information.
        Unauthorized access, use, or distribution is prohibited.
        This assessment is based on system configuration at the time of audit.</i>
        </font>
        """
        self.story.append(Paragraph(disclaimer, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _executive_summary(self):
        self.story.append(Paragraph(
            "1. EXECUTIVE SUMMARY", self.styles["SectionTitle"]))

        p = self.parsed
        score = p["score"]
        risk, _ = self._risk_level(score)
        crit = len(p["findings"].get("critical", []))
        high = len(p["findings"].get("high", []))
        med = len(p["findings"].get("medium", []))
        low = len(p["findings"].get("low", []))

        rows = [
            ["Metric", "Value", "Status"],
            ["Overall Security Score", f"{score}/100", "Score"],
            ["Risk Level", risk, "Risk"],
            ["Total Checks", str(p["total"]), "Scope"],
            ["Passed Checks", str(p["passed"]), "Passed"],
            ["Failed Checks", str(p["failed"]), "Failed"],
            ["Critical Issues", str(crit), "Critical"],
            ["High Issues", str(high), "High"],
            ["Medium Issues", str(med), "Medium"],
            ["Low Issues", str(low), "Low"],
        ]
        t = Table(rows, colWidths=[2 * inch, 2 * inch, 2 * inch])
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
        This security audit report provides a comprehensive assessment of the Windows system's
        current security posture. The system achieved an overall compliance score of <b>{score}/100</b>,
        indicating a <b>{risk}</b> risk level. The assessment identified <b>{crit + high}</b> critical/high
        issue(s) requiring immediate attention and <b>{med + low}</b> recommendations for further improvement.
        <br/><br/>
        The audit was conducted using an automated Windows hardening assessment tool that evaluates
        system configuration, security controls, and compliance against industry standards including
        ISO 27001, NIST, and CIS Benchmarks for Microsoft Windows.
        """
        self.story.append(Paragraph(narrative, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _system_overview(self):
        self.story.append(Paragraph(
            "2. SYSTEM OVERVIEW", self.styles["SectionTitle"]))

        info = f"""
        <b>System Identification:</b><br/>
        Hostname: {_safe(self.hostname)}<br/>
        IP Address: {_safe(self.ip_address)}<br/>
        Owner: {_safe(self.owner_name)}<br/>
        <br/>
        <b>Operating System:</b><br/>
        Platform: Microsoft Windows<br/>
        <br/>
        <b>Audit Scope:</b><br/>
        Total Configuration Checks: {self.parsed['total']}<br/>
        Categories Evaluated: {len(self.parsed.get('categories', {}))}<br/>
        """
        self.story.append(Paragraph(info, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.2 * inch))

        # Category breakdown table
        cats = self.parsed.get("categories", {})
        if cats:
            self.story.append(Paragraph(
                "<b>Category Breakdown</b>", self.styles["SubsectionTitle"]))
            rows = [["Category", "Passed", "Failed", "Compliance"]]
            for cat in sorted(cats.keys()):
                c = cats[cat]
                p_count = c["passed"]
                f_count = c["failed"]
                t_count = p_count + f_count
                pct = round((p_count / t_count) * 100) if t_count > 0 else 0
                rows.append([_safe(cat, 50), str(p_count), str(f_count), f"{pct}%"])
            t = Table(rows, colWidths=[2.8 * inch, 1.0 * inch, 1.0 * inch, 1.2 * inch])
            t.setStyle(self._std_table_style())
            self.story.append(t)
            self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _critical_findings(self):
        self.story.append(Paragraph(
            "3. CRITICAL FINDINGS", self.styles["SectionTitle"]))

        crit = self.parsed["findings"].get("critical", [])
        high = self.parsed["findings"].get("high", [])
        urgent = crit + high

        if not urgent:
            self.story.append(Paragraph(
                "No critical or high-severity findings identified.",
                self.styles["Normal"]))
        else:
            for idx, f in enumerate(urgent, 1):
                sev = "critical" if idx <= len(crit) else "high"
                sev_label = sev.upper()
                style = self.styles["CriticalFinding"] if sev == "critical" else self.styles["HighFinding"]
                text = f"""
                <b>{idx}. [{sev_label}] {_safe(f.get('id',''))} — {_safe(f.get('name',''), 120)}</b><br/>
                Category: {_safe(f.get('category',''))}<br/>
                Current Value: {_safe(f.get('current_value','N/A'))}<br/>
                <i>Recommendation: Set to {_safe(f.get('recommended_value','recommended value'))}</i>
                """
                self.story.append(Paragraph(text, style))
                self.story.append(Spacer(1, 0.08 * inch))

        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _recommendations(self):
        self.story.append(Paragraph(
            "4. SECURITY RECOMMENDATIONS", self.styles["SectionTitle"]))

        for severity in ["critical", "high", "medium", "low"]:
            items = self.parsed["findings"].get(severity, [])
            if not items:
                continue
            self.story.append(Paragraph(
                f"<b>{severity.title()} Priority ({len(items)} findings)</b>",
                self.styles["SubsectionTitle"]))

            rows = [["ID", "Name", "Current", "Recommended"]]
            for f in items:
                rows.append([
                    _safe(f.get("id", ""), 12),
                    _safe(f.get("name", ""), 60),
                    _safe(f.get("current_value", ""), 30),
                    _safe(f.get("recommended_value", ""), 30),
                ])
            col_w = [0.8 * inch, 2.8 * inch, 1.2 * inch, 1.2 * inch]
            t = Table(rows, colWidths=col_w, repeatRows=1)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                 [colors.white, colors.HexColor("#f7fafc")]),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]))
            self.story.append(t)
            self.story.append(Spacer(1, 0.15 * inch))

    # ------------------------------------------------------------------
    def _security_controls(self):
        self.story.append(Paragraph(
            "5. SECURITY CONTROLS ASSESSMENT", self.styles["SectionTitle"]))

        controls = [
            ["Control Area", "Status", "Notes"],
            ["Windows Firewall", self._control_status("Firewall"), "Inbound/outbound rule enforcement"],
            ["User Account Control (UAC)", self._control_status("UAC"), "Elevation prompt configuration"],
            ["Windows Defender / Antivirus", self._control_status("Defender"), "Real-time protection settings"],
            ["BitLocker / Encryption", self._control_status("BitLocker"), "Drive encryption status"],
            ["Remote Desktop (RDP)", self._control_status("RDP"), "Remote access hardening"],
            ["SMB Protocol Hardening", self._control_status("SMB"), "SMBv1 disabled, signing enforced"],
            ["Audit Policy / Logging", self._control_status("Audit"), "Security event logging"],
            ["Password Policy", self._control_status("Password"), "Complexity, length, history"],
            ["Account Lockout Policy", self._control_status("Lockout"), "Brute-force protection"],
            ["PowerShell Execution Policy", self._control_status("PowerShell"), "Script execution restrictions"],
        ]
        t = Table(controls, colWidths=[2.2 * inch, 1.2 * inch, 2.6 * inch])
        t.setStyle(self._std_table_style())
        self.story.append(t)
        self.story.append(Spacer(1, 0.3 * inch))

    def _control_status(self, keyword: str) -> str:
        """Infer a control's status from findings."""
        kw = keyword.lower()
        for sev in ["critical", "high"]:
            for f in self.parsed["findings"].get(sev, []):
                if kw in (f.get("name", "") + f.get("category", "")).lower():
                    return "Review Required"
        for sev in ["medium", "low"]:
            for f in self.parsed["findings"].get(sev, []):
                if kw in (f.get("name", "") + f.get("category", "")).lower():
                    return "Partial"
        return "Configured"

    # ------------------------------------------------------------------
    def _compliance_section(self):
        self.story.append(Paragraph(
            "6. COMPLIANCE &amp; STANDARDS", self.styles["SectionTitle"]))

        text = """
        <b>Assessment Framework:</b><br/>
        This audit evaluates system compliance against the following standards:<br/>
        &#8226; <b>ISO/IEC 27001</b> — Information Security Management System<br/>
        &#8226; <b>NIST Cybersecurity Framework</b> — Identify, Protect, Detect, Respond, Recover<br/>
        &#8226; <b>CIS Microsoft Windows Benchmarks</b> — Center for Internet Security Best Practices<br/>
        &#8226; <b>Microsoft Security Baselines</b> — Recommended Group Policy settings<br/>
        <br/>
        <b>Control Domains Evaluated:</b><br/>
        &#10003; Account &amp; Password Policies<br/>
        &#10003; User Rights &amp; Privilege Management<br/>
        &#10003; Windows Firewall Configuration<br/>
        &#10003; Audit Policy &amp; Event Logging<br/>
        &#10003; Registry Security Hardening<br/>
        &#10003; Network Protocol Security (SMB, RDP, WinRM)<br/>
        &#10003; Encryption &amp; Credential Protection<br/>
        &#10003; Windows Defender &amp; Antimalware<br/>
        &#10003; PowerShell &amp; Script Execution Policies<br/>
        &#10003; System Services &amp; Scheduled Tasks<br/>
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.2 * inch))

    # ------------------------------------------------------------------
    def _action_plan(self):
        self.story.append(Paragraph(
            "7. REMEDIATION ACTION PLAN", self.styles["SectionTitle"]))

        crit = len(self.parsed["findings"].get("critical", []))
        high = len(self.parsed["findings"].get("high", []))
        med = len(self.parsed["findings"].get("medium", []))

        text = f"""
        <b>Immediate Actions (0-7 days):</b><br/>
        1. Address all {crit} critical findings listed in Section 3<br/>
        2. Review and remediate {high} high-severity issues<br/>
        3. Verify Windows Firewall rules and Defender real-time protection<br/>
        4. Enforce password and account lockout policies via Group Policy<br/>
        <br/>
        <b>Short-term Actions (1-4 weeks):</b><br/>
        1. Remediate {med} medium-severity recommendations from Section 4<br/>
        2. Enable and configure Windows Security Event audit policies<br/>
        3. Disable legacy protocols (SMBv1, LLMNR, NetBIOS)<br/>
        4. Harden Remote Desktop settings and enable NLA<br/>
        <br/>
        <b>Long-term Actions (1-3 months):</b><br/>
        1. Implement remaining low-priority recommendations<br/>
        2. Deploy Microsoft LAPS for local admin password management<br/>
        3. Enable Credential Guard and Device Guard where supported<br/>
        4. Establish continuous monitoring and regular audit schedule<br/>
        <br/>
        <b>Ongoing Maintenance:</b><br/>
        &#8226; Schedule monthly security audits<br/>
        &#8226; Apply Windows security updates within 14 days of release<br/>
        &#8226; Review Group Policy settings quarterly<br/>
        &#8226; Re-run audit to verify remediation effectiveness<br/>
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.3 * inch))

    # ------------------------------------------------------------------
    def _conclusion(self):
        self.story.append(Paragraph(
            "8. CONCLUSION", self.styles["SectionTitle"]))

        score = self.parsed["score"]
        risk, _ = self._risk_level(score)

        text = f"""
        The security audit of <b>{_safe(self.hostname)}</b> reveals a current security posture
        with a compliance score of <b>{score}/100</b>, indicating a <b>{risk}</b> risk level.<br/>
        <br/>
        Out of <b>{self.parsed['total']}</b> configuration checks, <b>{self.parsed['passed']}</b>
        passed and <b>{self.parsed['failed']}</b> require remediation. While the system demonstrates
        several security controls in place, there are areas requiring attention to improve the
        overall security posture.<br/>
        <br/>
        <b>Next Steps:</b><br/>
        1. Distribute this report to authorized personnel<br/>
        2. Establish a remediation timeline based on risk levels<br/>
        3. Assign responsibility for implementing recommendations<br/>
        4. Schedule a follow-up audit in 30-60 days to verify improvements<br/>
        <br/>
        <i>This report should be reviewed regularly and updated with each new audit cycle.</i>
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))
        self.story.append(Spacer(1, 0.4 * inch))

    # ------------------------------------------------------------------
    def _footer(self):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        text = f"""
        <font size=8 color="#999999">
        Report Generated: {ts}<br/>
        Document Classification: Internal Use<br/>
        &#169; ANATSCRAWLER Security Audit System
        </font>
        """
        self.story.append(Paragraph(text, self.styles["Normal"]))

    # ========================== Build =================================
    def generate(self) -> str:
        self._header()
        self._executive_summary()

        self.story.append(PageBreak())
        self._system_overview()
        self._critical_findings()

        self.story.append(PageBreak())
        self._recommendations()

        self.story.append(PageBreak())
        self._security_controls()
        self._compliance_section()

        self.story.append(PageBreak())
        self._action_plan()
        self._conclusion()
        self._footer()

        self.doc.build(self.story)
        return self.output_path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate comprehensive ANATSCRAWLER Windows OS hardening PDF report"
    )
    parser.add_argument("input_file", help="Path to Windows audit output text file")
    parser.add_argument("-o", "--output", default="windows_audit_report.pdf",
                        help="Output PDF file")
    parser.add_argument("-H", "--hostname", required=True, help="System hostname")
    parser.add_argument("-I", "--ip", required=True, help="System IP address")
    parser.add_argument("-O", "--owner", required=True, help="Owner name")

    args = parser.parse_args()

    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        return 1

    raw = input_path.read_text(encoding="utf-8", errors="ignore")

    # Decide which parser to use: if the content looks like CSV, use CSV parser
    first_line = raw.split("\n", 1)[0] if raw else ""
    if "ID" in first_line and "Category" in first_line and "TestResult" in first_line:
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
        parsed=parsed,
    )
    report.generate()

    print(f"Generated report: {args.output}")
    print(f"Score: {parsed['score']}/100  |  Passed: {parsed['passed']}  |  Failed: {parsed['failed']}")
    for sev in ["critical", "high", "medium", "low"]:
        print(f"  {sev.title()}: {len(parsed['findings'].get(sev, []))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
