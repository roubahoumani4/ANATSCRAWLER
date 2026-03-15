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


# ---------------------------------------------------------------------------
# Knowledge base: maps categories / setting names to human-readable
# explanations, impact descriptions, and remediation guidance.
# Matching is keyword-based so it works for any HardeningKitty finding.
# ---------------------------------------------------------------------------

_WINDOWS_KB: list[dict] = [
    # --- Account & Password Policies ---
    {
        "keywords": ["account lockout duration"],
        "description": "Defines how long an account stays locked after exceeding failed login attempts.",
        "impact": "Too short a duration allows brute-force attacks to retry quickly.",
        "remediation": "Set via Group Policy: Computer Configuration > Policies > Windows Settings > Security Settings > Account Policies > Account Lockout Policy. Recommended: 15 minutes or more.",
    },
    {
        "keywords": ["account lockout threshold"],
        "description": "Number of failed logon attempts before the account is locked.",
        "impact": "A high or disabled threshold makes brute-force attacks feasible.",
        "remediation": "Set to 10 or fewer failed attempts via Group Policy > Account Lockout Policy.",
    },
    {
        "keywords": ["reset account lockout counter"],
        "description": "Time after which the failed-logon counter resets to zero.",
        "impact": "If too short, attackers can space attempts to avoid lockout.",
        "remediation": "Set to at least 15 minutes via Group Policy > Account Lockout Policy.",
    },
    {
        "keywords": ["store passwords using reversible encryption"],
        "description": "Controls whether Windows stores passwords in a reversible (recoverable) format.",
        "impact": "Reversible encryption is nearly as insecure as plaintext; any compromise of the SAM database exposes all passwords.",
        "remediation": "Ensure this policy is Disabled in Group Policy > Password Policy.",
    },
    {
        "keywords": ["administrator account lockout"],
        "description": "Whether the built-in Administrator account is subject to lockout.",
        "impact": "If not lockable, the Administrator account can be brute-forced indefinitely.",
        "remediation": "Enable via Group Policy or net accounts command.",
    },
    {
        "keywords": ["block microsoft accounts"],
        "description": "Prevents users from adding or logging in with Microsoft accounts.",
        "impact": "Microsoft accounts bypass local password policies and may sync credentials externally.",
        "remediation": "Set to 'Users can't add or log on with Microsoft accounts' via Security Options.",
    },
    # --- User Rights Assignment ---
    {
        "keywords": ["access this computer from the network"],
        "description": "Determines which users/groups can connect to the computer over the network.",
        "impact": "Excessive access allows unauthorized remote connections and lateral movement.",
        "remediation": "Restrict to Administrators only via Group Policy > User Rights Assignment.",
    },
    {
        "keywords": ["allow log on locally"],
        "description": "Controls which users can interactively log on at the console.",
        "impact": "Allowing too many accounts increases the attack surface for local exploitation.",
        "remediation": "Limit to Users and Administrators via Group Policy > User Rights Assignment.",
    },
    {
        "keywords": ["debug programs"],
        "description": "Grants the ability to attach a debugger to any process, including system processes.",
        "impact": "An attacker with this right can extract credentials from memory (e.g., LSASS) or inject code into privileged processes.",
        "remediation": "Remove all entries or restrict to Administrators only via Group Policy > User Rights Assignment.",
    },
    {
        "keywords": ["deny access to this computer from the network"],
        "description": "Explicitly denies network logon to specified accounts/groups.",
        "impact": "Without deny rules, compromised guest or local accounts can be used for lateral movement.",
        "remediation": "Add Guests and 'NT AUTHORITY\\Local account' to the deny list via Group Policy.",
    },
    {
        "keywords": ["deny log on as a batch job"],
        "description": "Prevents specified accounts from logging on as a batch job (scheduled tasks).",
        "impact": "Unrestricted batch logon rights let attackers schedule persistent malicious tasks.",
        "remediation": "Add Guests to the deny list via Group Policy > User Rights Assignment.",
    },
    {
        "keywords": ["deny log on as a service"],
        "description": "Prevents specified accounts from registering a process as a service.",
        "impact": "An attacker could install a malicious service running under a privileged account.",
        "remediation": "Add Guests to the deny list via Group Policy > User Rights Assignment.",
    },
    {
        "keywords": ["deny log on through remote desktop"],
        "description": "Prevents specified accounts from connecting via RDP.",
        "impact": "Without deny rules, compromised accounts can be used for remote access.",
        "remediation": "Add Guests and 'NT AUTHORITY\\Local account' to the deny list via Group Policy.",
    },
    # --- Security Options ---
    {
        "keywords": ["do not require ctrl+alt+del"],
        "description": "Controls whether Ctrl+Alt+Del is required before the logon screen.",
        "impact": "Without it, a spoofed login screen could capture credentials.",
        "remediation": "Set to Disabled (i.e., require Ctrl+Alt+Del) via Security Options.",
    },
    {
        "keywords": ["don't display last signed-in", "don't display username"],
        "description": "Controls whether the last logged-in username is shown on the logon screen.",
        "impact": "Displaying usernames gives attackers valid account names for targeted attacks.",
        "remediation": "Enable these settings via Group Policy > Security Options > Interactive logon.",
    },
    {
        "keywords": ["digitally sign communications"],
        "description": "Requires SMB packet signing between client and server.",
        "impact": "Without signing, SMB traffic can be intercepted or modified (man-in-the-middle).",
        "remediation": "Enable 'always' for both client and server via Group Policy > Security Options.",
    },
    {
        "keywords": ["anonymous enumeration of sam"],
        "description": "Controls whether anonymous users can enumerate SAM accounts and shares.",
        "impact": "Anonymous enumeration reveals valid usernames and share names to attackers.",
        "remediation": "Set both 'Do not allow anonymous enumeration' policies to Enabled.",
    },
    {
        "keywords": ["storage of passwords and credentials for network"],
        "description": "Controls caching of network authentication credentials.",
        "impact": "Cached credentials can be extracted and used for pass-the-hash attacks.",
        "remediation": "Set to Enabled (do not allow storage) via Group Policy > Security Options.",
    },
    {
        "keywords": ["restrict clients allowed to make remote calls to sam"],
        "description": "Restricts which accounts can remotely query the SAM database.",
        "impact": "Unrestricted SAM access allows attackers to enumerate all local accounts remotely.",
        "remediation": "Set to 'O:BAG:BAD:(A;;RC;;;BA)' (Administrators only) via Group Policy.",
    },
    {
        "keywords": ["lan manager authentication level"],
        "description": "Determines the challenge/response authentication protocol used for network logons.",
        "impact": "LM and NTLMv1 are weak and susceptible to offline cracking attacks.",
        "remediation": "Set to level 5 (Send NTLMv2 response only, refuse LM & NTLM) via Security Options.",
    },
    {
        "keywords": ["minimum session security for ntlm"],
        "description": "Defines minimum security requirements for NTLM SSP-based connections.",
        "impact": "Without 128-bit encryption and NTLMv2 session security, traffic is vulnerable to interception.",
        "remediation": "Enable 'Require NTLMv2 session security' and 'Require 128-bit encryption'.",
    },
    {
        "keywords": ["restrict ntlm"],
        "description": "Controls auditing and restriction of NTLM authentication traffic.",
        "impact": "NTLM is vulnerable to relay attacks; unrestricted use exposes the network to credential theft.",
        "remediation": "Enable auditing of all NTLM traffic first, then progressively restrict via Group Policy.",
    },
    {
        "keywords": ["allow system to be shut down without"],
        "description": "Controls whether the system can be shut down without requiring logon.",
        "impact": "Allows anyone with physical access to shut down the system, causing denial of service.",
        "remediation": "Set to Disabled via Group Policy > Security Options.",
    },
    {
        "keywords": ["admin approval mode"],
        "description": "Controls whether the built-in Administrator runs in Admin Approval Mode (UAC).",
        "impact": "Without it, the built-in Administrator bypasses all UAC prompts, increasing malware risk.",
        "remediation": "Set to Enabled via Group Policy > Security Options > User Account Control.",
    },
    {
        "keywords": ["behavior of the elevation prompt for admin"],
        "description": "Determines what happens when an admin needs elevated privileges.",
        "impact": "Auto-elevation without prompting allows malware to silently gain admin privileges.",
        "remediation": "Set to 'Prompt for consent on the secure desktop' via UAC settings.",
    },
    {
        "keywords": ["behavior of the elevation prompt for standard"],
        "description": "Determines what happens when a standard user needs elevated privileges.",
        "impact": "Allowing auto-deny or no prompt can either frustrate users or bypass security.",
        "remediation": "Set to 'Automatically deny elevation requests' via UAC settings.",
    },
    {
        "keywords": ["do not store lan manager hash"],
        "description": "Prevents Windows from storing the weak LAN Manager hash of passwords.",
        "impact": "LM hashes are trivially crackable; storing them exposes all passwords.",
        "remediation": "Ensure this is Enabled via Group Policy > Security Options.",
    },
    # --- Windows Firewall ---
    {
        "keywords": ["enablefirewall"],
        "description": "Controls whether Windows Firewall is active for the given profile (Domain/Private/Public).",
        "impact": "A disabled firewall exposes all network services to direct attack.",
        "remediation": "Enable the firewall for all profiles via Group Policy or Windows Security settings.",
    },
    {
        "keywords": ["inbound connections"],
        "description": "Default action for unsolicited inbound network connections.",
        "impact": "Allowing inbound connections by default exposes services to exploitation.",
        "remediation": "Set to 'Block' for all profiles in Windows Firewall advanced settings.",
    },
    {
        "keywords": ["outbound connections"],
        "description": "Default action for outgoing network connections.",
        "impact": "Unrestricted outbound traffic allows malware to communicate with C2 servers.",
        "remediation": "Consider blocking outbound by default and whitelisting required applications.",
    },
    {
        "keywords": ["log size limit"],
        "description": "Maximum size (KB) for the Windows Firewall log file.",
        "impact": "Small log files roll over quickly, destroying evidence needed for incident investigation.",
        "remediation": "Set to at least 16384 KB (16 MB) for all profiles via Group Policy.",
    },
    {
        "keywords": ["log dropped packets"],
        "description": "Whether the firewall logs blocked (dropped) network packets.",
        "impact": "Without logging, blocked attack attempts go undetected.",
        "remediation": "Enable dropped-packet logging for all profiles via Group Policy.",
    },
    {
        "keywords": ["log successful connections"],
        "description": "Whether the firewall logs allowed connections.",
        "impact": "Without connection logging, legitimate but suspicious traffic cannot be reviewed.",
        "remediation": "Enable successful-connection logging for all profiles via Group Policy.",
    },
    # --- Audit Policy ---
    {
        "keywords": ["credential validation"],
        "description": "Audits authentication events where credentials are validated.",
        "impact": "Without this audit, failed logon attempts and credential attacks go undetected.",
        "remediation": "Set to 'Success and Failure' via Advanced Audit Policy Configuration.",
    },
    {
        "keywords": ["dpapi activity"],
        "description": "Audits Data Protection API operations (credential encryption/decryption).",
        "impact": "DPAPI is used to protect stored credentials; unaudited access hides credential theft.",
        "remediation": "Set to 'Success and Failure' via Advanced Audit Policy Configuration.",
    },
    {
        "keywords": ["process creation"],
        "description": "Audits the creation of new processes on the system.",
        "impact": "Without process auditing, malware execution and suspicious commands go unlogged.",
        "remediation": "Set to 'Success' via Advanced Audit Policy; also enable command-line logging.",
    },
    {
        "keywords": ["security group management"],
        "description": "Audits changes to security groups (adding/removing members).",
        "impact": "Unaudited group changes allow silent privilege escalation.",
        "remediation": "Set to at least 'Success' via Advanced Audit Policy Configuration.",
    },
    {
        "keywords": ["plug and play events"],
        "description": "Audits when Plug and Play devices are connected.",
        "impact": "Unaudited USB/device connections can introduce malware or data exfiltration.",
        "remediation": "Set to 'Success' via Advanced Audit Policy Configuration.",
    },
    # --- SMB / Features ---
    {
        "keywords": ["smbv1"],
        "description": "Controls whether the legacy SMBv1 protocol is enabled.",
        "impact": "SMBv1 is vulnerable to EternalBlue (WannaCry/NotPetya) and other critical exploits.",
        "remediation": "Disable SMBv1 via: Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol.",
    },
    # --- HardeningKitty Block rules ---
    {
        "keywords": ["hardeningkitty-block"],
        "description": "Application execution control rules that block potentially dangerous executables.",
        "impact": "Without execution blocking, attackers can use living-off-the-land binaries (LOLBins) for code execution.",
        "remediation": "Deploy Application Control Policies (AppLocker or WDAC) to restrict executable access.",
    },
    # --- Windows Update / WSUS ---
    {
        "keywords": ["windows update", "wsus"],
        "description": "Configuration for automatic Windows Update or WSUS patching.",
        "impact": "Unpatched systems are vulnerable to known exploits with public attack tools.",
        "remediation": "Enable automatic updates or configure WSUS via Group Policy.",
    },
    # --- Credential Guard / Device Guard ---
    {
        "keywords": ["credential guard", "lsa protection"],
        "description": "Virtualization-based security protecting credentials from extraction.",
        "impact": "Without Credential Guard, tools like Mimikatz can extract plaintext passwords from memory.",
        "remediation": "Enable Credential Guard via Group Policy > Device Guard settings (requires VBS-capable hardware).",
    },
]


# ── Gemini AI fallback for unmatched findings ──
_gemini_cache: Dict[str, dict] = {}


def _ask_gemini(name: str, category: str) -> Optional[dict]:
    """Call Gemini API to explain an unknown Windows finding."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    cache_key = f"{category}|{name}"
    if cache_key in _gemini_cache:
        return _gemini_cache[cache_key]
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            "You are a Windows security hardening expert. "
            f"Explain this Windows audit finding in exactly 3 short lines:\n"
            f"Category: {category}\nSetting: {name}\n\n"
            "Line 1 - DESCRIPTION: What this setting does (1 sentence).\n"
            "Line 2 - IMPACT: Security impact if misconfigured (1 sentence).\n"
            "Line 3 - REMEDIATION: How to fix it (1 sentence).\n\n"
            "Reply ONLY with 3 lines, no labels, no extra text."
        )
        resp = model.generate_content(prompt)
        lines = [l.strip() for l in resp.text.strip().splitlines() if l.strip()]
        if len(lines) >= 3:
            result = {
                "description": lines[0],
                "impact": lines[1],
                "remediation": lines[2],
            }
        else:
            result = {
                "description": lines[0] if lines else name,
                "impact": lines[1] if len(lines) > 1 else "Non-compliance may weaken security.",
                "remediation": lines[2] if len(lines) > 2 else "Apply the recommended value via Group Policy.",
            }
        _gemini_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"Gemini API warning (non-fatal): {e}", file=sys.stderr)
        return None


def _lookup_kb(name: str, category: str) -> dict:
    """Find the best matching knowledge-base entry; fall back to Gemini AI."""
    text = (name + " " + category).lower()
    for entry in _WINDOWS_KB:
        if any(kw in text for kw in entry["keywords"]):
            return entry
    # Try Gemini AI for unmatched findings
    ai_result = _ask_gemini(name, category)
    if ai_result:
        return ai_result
    return {
        "description": "This setting controls a Windows security configuration parameter.",
        "impact": "Non-compliance may weaken the system's security posture.",
        "remediation": "Review the CIS Microsoft Windows Benchmark for the recommended value and apply via Group Policy or registry.",
    }


def parse_csv_report(csv_text: str) -> Dict:
    """Parse HardeningKitty CSV report into structured data."""
    findings: Dict[str, List[Dict]] = defaultdict(list)
    categories: Dict[str, Dict[str, int]] = defaultdict(lambda: {"passed": 0, "failed": 0})
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
            # Deduplicate by ID (or by name if ID is empty)
            dedup_key = finding_id or name
            if dedup_key in seen_ids:
                continue
            seen_ids.add(dedup_key)
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
                kb = _lookup_kb(f.get("name", ""), f.get("category", ""))
                text = f"""
                <b>{idx}. [{sev_label}] {_safe(f.get('id',''))} — {_safe(f.get('name',''), 120)}</b><br/>
                <b>Category:</b> {_safe(f.get('category',''))}<br/>
                <b>What it means:</b> {_safe(kb['description'])}<br/>
                <b>Security impact:</b> {_safe(kb['impact'])}<br/>
                <b>Current Value:</b> {_safe(f.get('current_value','N/A'))}
                &nbsp;&nbsp;|&nbsp;&nbsp;<b>Recommended:</b> {_safe(f.get('recommended_value','N/A'))}<br/>
                <b>How to fix:</b> <i>{_safe(kb['remediation'])}</i>
                """
                self.story.append(Paragraph(text, style))
                self.story.append(Spacer(1, 0.1 * inch))

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

            for idx, f in enumerate(items, 1):
                kb = _lookup_kb(f.get("name", ""), f.get("category", ""))
                name = _safe(f.get("name", ""), 100)
                fid = _safe(f.get("id", ""), 12)
                cur = _safe(f.get("current_value", "N/A"), 40)
                rec = _safe(f.get("recommended_value", "N/A"), 40)
                text = f"""
                <b>{idx}. [{fid}] {name}</b><br/>
                {_safe(kb['description'])}<br/>
                <font color="#555555">Current: {cur} &#8594; Recommended: {rec}</font><br/>
                <i>Fix: {_safe(kb['remediation'])}</i>
                """
                self.story.append(Paragraph(text, self.styles["Normal"]))
                self.story.append(Spacer(1, 0.06 * inch))

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
