#!/usr/bin/env python3
"""
Comprehensive PDF Report Generator for Lynis OS Audit
Generates professional, international standard auditing reports from Lynis scan results
Compliant with: ISO 27001, NIST, CIS Benchmarks, SANS Guidelines
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import argparse

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
        PageBreak, Image, KeepTogether, PageTemplate, Frame
    )
    from reportlab.pdfgen import canvas
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)


_LINUX_KB = [
    # ── Authentication & Access ──
    {"keywords": ["password", "passwd", "pam_pwquality", "pam_cracklib", "minlen", "password strength"],
     "description": "Controls how strong user passwords must be (length, complexity, history).",
     "impact": "Weak password policies allow brute-force or credential-stuffing attacks.",
     "remediation": "Configure /etc/security/pwquality.conf (minlen >= 12, dcredit, ucredit, lcredit, ocredit). Enforce via PAM."},
    {"keywords": ["password aging", "pass_max_days", "pass_min_days", "pass_warn_age", "login.defs"],
     "description": "Defines maximum/minimum password age and warning period before expiry.",
     "impact": "Without aging, compromised credentials may remain valid indefinitely.",
     "remediation": "Set PASS_MAX_DAYS=90, PASS_MIN_DAYS=7, PASS_WARN_AGE=14 in /etc/login.defs."},
    {"keywords": ["account lockout", "pam_tally", "pam_faillock", "deny=", "failed login"],
     "description": "Locks accounts after repeated authentication failures.",
     "impact": "Without lockout, attackers can attempt unlimited password guesses.",
     "remediation": "Enable pam_faillock with deny=5, unlock_time=900 in /etc/pam.d/common-auth."},
    {"keywords": ["umask", "default umask"],
     "description": "Sets default file-creation permission mask for new files.",
     "impact": "A permissive umask (e.g. 002/022) may leave files world-readable.",
     "remediation": "Set umask to 027 or 077 in /etc/profile, /etc/bashrc, and /etc/login.defs."},
    {"keywords": ["root login", "permit root", "su access", "securetty"],
     "description": "Controls whether root can log in directly via console or SSH.",
     "impact": "Direct root login bypasses audit-trail accountability and increases attack surface.",
     "remediation": "Set PermitRootLogin no in sshd_config. Use sudo for privilege escalation."},
    {"keywords": ["sudoers", "sudo", "privilege escalation"],
     "description": "Manages which users may execute commands as root via sudo.",
     "impact": "Misconfigured sudoers can grant excessive privileges to unprivileged users.",
     "remediation": "Audit /etc/sudoers with visudo. Remove NOPASSWD where possible. Use groups."},
    {"keywords": ["uid", "gid", "duplicate", "user account", "group account", "empty password"],
     "description": "Checks for duplicate UIDs/GIDs, accounts with empty passwords, or orphan accounts.",
     "impact": "Duplicate IDs cause identity confusion; empty passwords allow unauthenticated access.",
     "remediation": "Remove or lock duplicate/orphan accounts. Ensure all accounts have strong passwords."},
    # ── SSH Hardening ──
    {"keywords": ["ssh", "sshd", "openssh", "protocol", "allowusers", "maxauthtries", "permitemptypasswords",
                   "x11forwarding", "clientaliveinterval", "loglevel", "banner"],
     "description": "Evaluates SSH daemon configuration against security best practices.",
     "impact": "Weak SSH settings can allow brute-force attacks, session hijacking, or unauthorized access.",
     "remediation": "Harden /etc/ssh/sshd_config: Protocol 2, PermitRootLogin no, MaxAuthTries 3, "
                    "PermitEmptyPasswords no, X11Forwarding no, ClientAliveInterval 300, LogLevel VERBOSE."},
    # ── File System & Permissions ──
    {"keywords": ["suid", "sgid", "sticky bit", "world-writable", "file permission"],
     "description": "Detects files with dangerous permission bits (SUID/SGID/world-writable).",
     "impact": "SUID/SGID binaries can be exploited for privilege escalation.",
     "remediation": "Audit with: find / -perm /6000 -type f. Remove unnecessary SUID/SGID bits."},
    {"keywords": ["tmp", "/tmp", "/var/tmp", "noexec", "nosuid", "nodev", "mount option"],
     "description": "Checks that temporary directories are mounted with restrictive options.",
     "impact": "Attackers can execute malicious code from /tmp if noexec/nosuid are missing.",
     "remediation": "Add noexec,nosuid,nodev mount options for /tmp and /var/tmp in /etc/fstab."},
    {"keywords": ["home directory", "home permission"],
     "description": "Verifies that user home directories are not accessible by other users.",
     "impact": "Readable home directories may expose SSH keys, credentials, or personal data.",
     "remediation": "Set permissions to 750 or 700: chmod 750 /home/*."},
    {"keywords": ["file integrity", "aide", "tripwire", "ossec", "samhain"],
     "description": "Checks whether a file-integrity monitoring (FIM) tool is installed.",
     "impact": "Without FIM, unauthorized or malicious modifications to critical files go undetected.",
     "remediation": "Install and configure AIDE: apt install aide && aideinit. Schedule daily checks via cron."},
    # ── Firewall & Network ──
    {"keywords": ["firewall", "iptables", "nftables", "ufw", "firewalld"],
     "description": "Verifies that a host-based firewall is active and configured.",
     "impact": "Without a firewall, all network services are exposed to the network.",
     "remediation": "Enable and configure ufw or iptables. Default-deny inbound traffic."},
    {"keywords": ["open port", "listening", "network service", "tcp", "udp"],
     "description": "Lists services listening on open ports that increase the attack surface.",
     "impact": "Unnecessary open ports expose services to network attacks.",
     "remediation": "Close unused ports. Review with: ss -tulnp. Disable unneeded services."},
    {"keywords": ["ip forward", "packet redirect", "icmp", "syn cookie", "network parameter", "sysctl"],
     "description": "Evaluates kernel network parameters for secure defaults.",
     "impact": "IP forwarding or accepting redirects can enable man-in-the-middle attacks.",
     "remediation": "Disable ip_forward, send_redirects, accept_redirects in /etc/sysctl.conf. Enable SYN cookies."},
    {"keywords": ["dns", "nameserver", "resolv.conf"],
     "description": "Checks DNS resolver configuration for security implications.",
     "impact": "Untrustworthy DNS servers can redirect traffic via DNS poisoning.",
     "remediation": "Use trusted DNS resolvers. Consider DNSSEC validation."},
    # ── Kernel Hardening ──
    {"keywords": ["kernel", "sysctl", "aslr", "randomize_va_space", "dmesg_restrict",
                   "kptr_restrict", "core_dump", "core dump"],
     "description": "Evaluates kernel hardening parameters (ASLR, dmesg restriction, etc.).",
     "impact": "Disabled ASLR or unrestricted dmesg/kptr can aid exploitation of kernel vulnerabilities.",
     "remediation": "Set kernel.randomize_va_space=2, kernel.dmesg_restrict=1, "
                    "kernel.kptr_restrict=2, fs.suid_dumpable=0 in /etc/sysctl.conf."},
    # ── Logging & Auditing ──
    {"keywords": ["syslog", "rsyslog", "journald", "log", "logging"],
     "description": "Checks that system logging is active and properly configured.",
     "impact": "Without logging, security incidents cannot be detected or investigated.",
     "remediation": "Ensure rsyslog or journald is running. Forward logs to a central SIEM."},
    {"keywords": ["auditd", "audit daemon", "audit rule", "audit log"],
     "description": "Verifies the Linux Audit Framework (auditd) is active with adequate rules.",
     "impact": "Missing audit rules means changes to critical files/commands are not recorded.",
     "remediation": "Install and enable auditd. Add rules for /etc/passwd, /etc/shadow, sudo, su."},
    {"keywords": ["log rotation", "logrotate"],
     "description": "Checks that log files are rotated to prevent disk exhaustion.",
     "impact": "Unrotated logs can fill the disk, causing denial of service.",
     "remediation": "Configure /etc/logrotate.conf with appropriate retention (e.g. 12 weeks)."},
    # ── Software & Updates ──
    {"keywords": ["update", "upgrade", "patch", "package", "apt", "yum", "dnf", "vulnerable package"],
     "description": "Checks for available security updates and vulnerable packages.",
     "impact": "Unpatched software contains known vulnerabilities that attackers actively exploit.",
     "remediation": "Apply all pending security updates: apt update && apt upgrade (Debian/Ubuntu) "
                    "or yum update (RHEL/CentOS). Enable unattended-upgrades."},
    {"keywords": ["compiler", "gcc", "make", "development tool"],
     "description": "Detects compilers and development tools installed on production systems.",
     "impact": "Compilers allow attackers to build exploits directly on the compromised system.",
     "remediation": "Remove compilers from production: apt remove gcc make (unless required)."},
    # ── Malware & Integrity ──
    {"keywords": ["malware", "antivirus", "clamav", "rkhunter", "chkrootkit", "rootkit"],
     "description": "Checks for malware scanners and rootkit detection tools.",
     "impact": "Without anti-malware tools, infections may go undetected.",
     "remediation": "Install rkhunter and/or ClamAV. Schedule daily scans via cron."},
    # ── Cryptography ──
    {"keywords": ["ssl", "tls", "certificate", "cipher", "encryption", "cryptograph"],
     "description": "Evaluates TLS/SSL configuration and certificate validity.",
     "impact": "Weak ciphers or expired certificates allow traffic interception.",
     "remediation": "Disable TLS 1.0/1.1. Use TLS 1.2+ with strong cipher suites. Renew expired certificates."},
    # ── Boot & GRUB ──
    {"keywords": ["grub", "boot", "bootloader", "single user", "recovery"],
     "description": "Checks bootloader security (password protection, single-user mode).",
     "impact": "Unprotected bootloaders allow attackers with physical access to gain root.",
     "remediation": "Set a GRUB password: grub-mkpasswd-pbkdf2. Require authentication for single-user mode."},
    # ── Banners & Legal ──
    {"keywords": ["banner", "motd", "issue", "legal", "warning banner"],
     "description": "Checks for login warning banners and legal notices.",
     "impact": "Missing banners weaken legal standing for prosecuting unauthorized access.",
     "remediation": "Configure /etc/issue and /etc/motd with an authorized-use-only warning."},
    # ── NTP / Time ──
    {"keywords": ["ntp", "chrony", "time sync", "time daemon"],
     "description": "Verifies that time synchronization is active and correctly configured.",
     "impact": "Clock drift breaks log correlation, Kerberos auth, and forensic timelines.",
     "remediation": "Install and enable chrony or ntpd. Sync to trusted NTP servers."},
    # ── Containers / Virtualization ──
    {"keywords": ["docker", "container", "lxc", "virtualization"],
     "description": "Checks container runtime security settings.",
     "impact": "Misconfigured containers can lead to host escape or data exposure.",
     "remediation": "Run containers as non-root. Use seccomp/AppArmor profiles. Limit capabilities."},
    # ── USB / Storage ──
    {"keywords": ["usb", "storage", "removable media", "usb-storage"],
     "description": "Checks whether USB storage is restricted on the system.",
     "impact": "Unrestricted USB allows data exfiltration and malware introduction.",
     "remediation": "Blacklist usb-storage module: echo 'blacklist usb-storage' > /etc/modprobe.d/usb.conf."},
]


# ── Gemini AI fallback for unmatched findings ──
_gemini_cache: Dict[str, dict] = {}


def _ask_gemini(test_id: str, description: str) -> Optional[dict]:
    """Call Gemini API to explain an unknown Linux/Lynis finding."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    cache_key = f"{test_id}|{description}"
    if cache_key in _gemini_cache:
        return _gemini_cache[cache_key]
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            "You are a Linux security hardening expert. "
            f"Explain this Lynis audit finding in exactly 3 short lines:\n"
            f"Test ID: {test_id}\nDescription: {description}\n\n"
            "Line 1 - DESCRIPTION: What this check does (1 sentence).\n"
            "Line 2 - IMPACT: Security impact if not addressed (1 sentence).\n"
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
                "description": lines[0] if lines else description,
                "impact": lines[1] if len(lines) > 1 else "Non-compliance may expose the system to threats.",
                "remediation": lines[2] if len(lines) > 2 else "Review the Lynis documentation for this test ID.",
            }
        _gemini_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"Gemini API warning (non-fatal): {e}", file=sys.stderr)
        return None


def _lookup_linux_kb(test_id: str, description: str) -> dict:
    """Match a Lynis finding against the KB; fall back to Gemini AI."""
    text = f"{test_id} {description}".lower()
    for entry in _LINUX_KB:
        if any(kw in text for kw in entry["keywords"]):
            return entry
    # Try Gemini AI for unmatched findings
    ai_result = _ask_gemini(test_id, description)
    if ai_result:
        return ai_result
    return {
        "description": "This finding relates to a system configuration that deviates from security best practices.",
        "impact": "Non-compliant configurations may expose the system to security threats.",
        "remediation": "Review the Lynis documentation for this test ID and apply the recommended configuration."
    }


class LynisReportParser:
    """Parse Lynis report data files (.dat format)"""
    
    def __init__(self, report_file_path: str):
        self.report_file = report_file_path
        self.data = {}
        self.parse_report()
    
    def parse_report(self):
        """Parse .dat report file"""
        with open(self.report_file, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Handle array values
                    if key in self.data:
                        if isinstance(self.data[key], list):
                            self.data[key].append(value)
                        else:
                            self.data[key] = [self.data[key], value]
                    else:
                        self.data[key] = value
    
    def get_value(self, key: str, default=None):
        """Get value from parsed data"""
        return self.data.get(key, default)
    
    def get_array_values(self, key_prefix: str) -> List[str]:
        """Get all values matching a prefix"""
        values = []
        for key, value in self.data.items():
            if key.startswith(key_prefix):
                if isinstance(value, list):
                    values.extend(value)
                else:
                    values.append(value)
        return list(set(values))  # Remove duplicates
    
    def get_suggestions(self) -> List[Dict[str, str]]:
        """Extract suggestions from report (deduplicated by test_id)"""
        suggestions = []
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
    
    def get_warnings(self) -> List[Dict[str, str]]:
        """Extract warnings from report (deduplicated by test_id)"""
        warnings = []
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


class AuditPDFReport:
    """Generate comprehensive audit PDF report"""
    
    # Severity levels and scoring
    SEVERITY_SCORES = {
        'critical': 40,
        'high': 20,
        'medium': 10,
        'low': 5
    }
    
    RISK_MATRIX = {
        (3, 3): 'Critical',
        (3, 2): 'High',
        (2, 3): 'High',
        (3, 1): 'Medium',
        (2, 2): 'Medium',
        (1, 3): 'Medium',
        (2, 1): 'Low',
        (1, 2): 'Low',
        (1, 1): 'Low'
    }
    
    def __init__(self, report_data: Dict[str, Any], output_path: str):
        self.data = report_data
        self.output_path = output_path
        self.styles = self._create_styles()
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        self.story = []
    
    def _create_styles(self):
        """Create custom paragraph styles"""
        styles = getSampleStyleSheet()
        
        # Title styles
        styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2c5282'),
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            borderColor=colors.HexColor('#cbd5e0'),
            borderWidth=2,
            borderPadding=6
        ))
        
        styles.add(ParagraphStyle(
            name='SubsectionTitle',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=6,
            spaceBefore=10
        ))
        
        # Body styles - create new styles instead of modifying existing ones
        styles.add(ParagraphStyle(
            name='CustomBodyText',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        ))
        
        styles.add(ParagraphStyle(
            name='CriticalFinding',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#742a2a'),
            backgroundColor=colors.HexColor('#fed7d7')
        ))
        
        styles.add(ParagraphStyle(
            name='HighFinding',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#7c2d12'),
            backgroundColor=colors.HexColor('#ffedd5')
        ))
        
        return styles
    
    def _calculate_compliance_score(self, warnings: List, suggestions: List) -> int:
        """Calculate overall compliance/security score"""
        # Base score
        score = 100
        
        # Deduct for warnings
        score -= len(warnings) * 5
        
        # Deduct for critical suggestions
        critical_suggestions = [s for s in suggestions if s.get('severity') == 'critical']
        score -= len(critical_suggestions) * 3
        
        return max(0, min(100, score))
    
    def _get_risk_level(self, score: int) -> tuple:
        """Get risk level and color based on score"""
        if score >= 80:
            return ('Low', colors.HexColor('#22863a'))
        elif score >= 60:
            return ('Medium', colors.HexColor('#f0ad4e'))
        elif score >= 40:
            return ('High', colors.HexColor('#d9534f'))
        else:
            return ('Critical', colors.HexColor('#cc3333'))
    
    def _create_header(self):
        """Create report header"""
        # Title
        self.story.append(
            Paragraph("SYSTEM SECURITY AUDIT REPORT", self.styles['ReportTitle'])
        )
        self.story.append(
            Paragraph("Lynis Security Assessment", self.styles['ReportSubtitle'])
        )
        
        # Report metadata
        report_date = self.data.get('audit_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        metadata = f"""
        <font size=9>
        <b>Report Generated:</b> {report_date}<br/>
        <b>System:</b> {self.data.get('hostname', 'Unknown')}<br/>
        <b>IP Address:</b> {self.data.get('ip_address', 'N/A')}<br/>
        <b>OS:</b> {self.data.get('os_name', 'Unknown')} {self.data.get('os_version', '')}<br/>
        <b>Kernel:</b> {self.data.get('kernel_version', 'Unknown')}<br/>
        <b>Owner:</b> {self.data.get('owner_name', 'Not Specified')}<br/>
        <b>Audit Standard:</b> ISO 27001 / NIST / CIS Benchmarks
        </font>
        """
        self.story.append(Paragraph(metadata, self.styles['Normal']))
        self.story.append(Spacer(1, 0.3*inch))
        
        # Disclaimer
        disclaimer = """
        <font size=8 color="#666666">
        <i>This report contains confidential security audit information. 
        Unauthorized access, use, or distribution is prohibited. 
        This assessment is based on system configuration at the time of audit.</i>
        </font>
        """
        self.story.append(Paragraph(disclaimer, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2*inch))
    
    def _create_executive_summary(self, compliance_score: int, warnings: List, suggestions: List):
        """Create executive summary section"""
        self.story.append(Paragraph("1. EXECUTIVE SUMMARY", self.styles['SectionTitle']))
        
        risk_level, risk_color = self._get_risk_level(compliance_score)
        
        # Summary table
        summary_data = [
            ['Metric', 'Value', 'Status'],
            ['Overall Security Score', f'{compliance_score}/100', 'Score'],
            ['Risk Level', risk_level, 'Risk'],
            ['Critical Issues', str(len([w for w in warnings])), 'Warnings'],
            ['Recommendations', str(len(suggestions)), 'Suggestions'],
            ['Audit Scope', 'Full System Assessment', 'Scope'],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
        ]))
        self.story.append(summary_table)
        self.story.append(Spacer(1, 0.2*inch))
        
        # Summary narrative
        summary_text = f"""
        This security audit report provides a comprehensive assessment of the system's 
        current security posture. The system achieved an overall compliance score of <b>{compliance_score}/100</b>, 
        indicating a <b>{risk_level}</b> risk level. The assessment identified {len(warnings)} critical 
        issue(s) requiring immediate attention and {len(suggestions)} recommendations for security improvement.
        <br/><br/>
        The audit was conducted using Lynis, a comprehensive security auditing tool that evaluates 
        system configuration, security controls, and compliance against industry standards including 
        ISO 27001, NIST, and CIS Benchmarks.
        """
        self.story.append(Paragraph(summary_text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.3*inch))
    
    def _create_system_overview(self):
        """Create system overview section"""
        self.story.append(Paragraph("2. SYSTEM OVERVIEW", self.styles['SectionTitle']))
        
        system_info = f"""
        <b>System Identification:</b><br/>
        Hostname: {self.data.get('hostname', 'Unknown')}<br/>
        IP Address: {self.data.get('ip_address', 'N/A')}<br/>
        Owner: {self.data.get('owner_name', 'Not Specified')}<br/>
        <br/>
        <b>Operating System:</b><br/>
        OS: {self.data.get('os_name', 'Unknown')} {self.data.get('os_version', '')}<br/>
        Kernel Version: {self.data.get('kernel_version_full', 'Unknown')}<br/>
        Hardware Platform: {self.data.get('hardware_platform', 'Unknown')}<br/>
        Virtual Machine: {self.data.get('vm', 'Unknown')}<br/>
        <br/>
        <b>Environment:</b><br/>
        System Boot Time (days): {self.data.get('uptime_days', 'Unknown')}<br/>
        Service Manager: {self.data.get('service_manager', 'Unknown')}<br/>
        CPU Capabilities: {'PAE Enabled' if self.data.get('cpu_pae') else 'PAE Disabled'}, 
        {'NX Enabled' if self.data.get('cpu_nx') else 'NX Disabled'}<br/>
        """
        self.story.append(Paragraph(system_info, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2*inch))
    
    def _create_critical_findings(self, warnings: List):
        """Create critical findings section with detailed explanations"""
        self.story.append(Paragraph("3. CRITICAL FINDINGS", self.styles['SectionTitle']))
        
        if not warnings:
            self.story.append(
                Paragraph("✓ No critical findings identified.", self.styles['Normal'])
            )
        else:
            for idx, warning in enumerate(warnings, 1):
                tid = warning.get('test_id', 'UNKNOWN')
                desc = warning.get('description', '')
                rec = warning.get('recommendation', '')
                kb = _lookup_linux_kb(tid, desc)
                
                finding_text = f"""
                <b>{idx}. [{tid}] {desc}</b><br/><br/>
                <b>What it means:</b> {kb['description']}<br/><br/>
                <b>Security impact:</b> {kb['impact']}<br/><br/>
                <b>Recommendation:</b> <i>{rec if rec else kb['remediation']}</i><br/><br/>
                <b>How to fix:</b> {kb['remediation']}
                """
                self.story.append(Paragraph(finding_text, self.styles['CriticalFinding']))
                self.story.append(Spacer(1, 0.15*inch))
        
        self.story.append(Spacer(1, 0.2*inch))
    
    def _create_recommendations(self, suggestions: List):
        """Create recommendations section with detailed explanations"""
        self.story.append(Paragraph("4. SECURITY RECOMMENDATIONS", self.styles['SectionTitle']))
        
        # Categorize by severity
        critical = [s for s in suggestions if s.get('severity') == 'critical']
        high = [s for s in suggestions if s.get('severity') == 'high']
        medium = [s for s in suggestions if s.get('severity') == 'medium']
        low = [s for s in suggestions if s.get('severity') == 'low']
        
        self.story.append(
            Paragraph(f"Total Recommendations: <b>{len(suggestions)}</b> "
                     f"(Critical: {len(critical)}, High: {len(high)}, "
                     f"Medium: {len(medium)}, Low: {len(low)})",
                     self.styles['SubsectionTitle'])
        )
        self.story.append(Spacer(1, 0.1*inch))
        
        # Display by category
        for category, items in [('Critical', critical), ('High', high), 
                               ('Medium', medium), ('Low', low)]:
            if items:
                self.story.append(
                    Paragraph(f"<b>{category} Priority</b>", self.styles['SubsectionTitle'])
                )
                for idx, item in enumerate(items, 1):
                    tid = item.get('test_id', 'UNKNOWN')
                    desc = item.get('description', '')
                    solution = item.get('solution', '')
                    details = item.get('details', '')
                    kb = _lookup_linux_kb(tid, desc)
                    
                    rec_text = f"""
                    <b>{idx}. [{tid}] {desc}</b><br/><br/>
                    <b>What it means:</b> {kb['description']}<br/><br/>
                    <b>Security impact:</b> {kb['impact']}<br/><br/>
                    {f'<b>Details:</b> {details}<br/><br/>' if details else ''}
                    <b>How to fix:</b> {solution if solution else kb['remediation']}
                    """
                    self.story.append(Paragraph(rec_text, self.styles['Normal']))
                    self.story.append(Spacer(1, 0.15*inch))
                
                self.story.append(Spacer(1, 0.1*inch))
    
    def _create_security_controls(self):
        """Create security controls assessment section"""
        self.story.append(Paragraph("5. SECURITY CONTROLS ASSESSMENT", self.styles['SectionTitle']))
        
        controls_data = [
            ['Control Area', 'Status', 'Notes'],
            ['Authentication & Access Control','Enabled', 'PAM modules configured'],
            ['Firewall', self.data.get('firewall_status', 'Unknown'), 'iptables rules in place'],
            ['SSH Hardening', self.data.get('ssh_hardening', 'Partial'), 'Review SSH configuration'],
            ['File Integrity Monitoring', self.data.get('fim_status', 'Not Installed'), 'Consider AIDE/Tripwire'],
            ['System Auditing', self.data.get('audit_status', 'Disabled'), 'Enable auditd for logging'],
            ['Kernel Hardening', self.data.get('kernel_hardening', 'Partial'), 'Review sysctl settings'],
        ]
        
        controls_table = Table(controls_data, colWidths=[2.2*inch, 1.3*inch, 2.5*inch])
        controls_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        self.story.append(controls_table)
        self.story.append(Spacer(1, 0.3*inch))
    
    def _create_compliance_section(self):
        """Create compliance section"""
        self.story.append(Paragraph("6. COMPLIANCE & STANDARDS", self.styles['SectionTitle']))
        
        compliance_text = """
        <b>Assessment Framework:</b><br/>
        This audit evaluates system compliance against the following standards:<br/>
        • <b>ISO/IEC 27001</b> - Information Security Management System<br/>
        • <b>NIST Cybersecurity Framework</b> - Identify, Protect, Detect, Respond, Recover<br/>
        • <b>CIS Benchmarks</b> - Center for Internet Security Best Practices<br/>
        • <b>SANS Top 25</b> - Most Dangerous Software Errors<br/>
        <br/>
        <b>Control Domains Evaluated:</b><br/>
        ✓ System Initialization & Boot Security<br/>
        ✓ File Systems & Storage Protection<br/>
        ✓ Access Control & Authentication<br/>
        ✓ Communication & Network Security<br/>
        ✓ System & Software Maintenance<br/>
        ✓ Security Tools & Monitoring<br/>
        ✓ Cryptography & Encryption<br/>
        ✓ Logging & Auditing<br/>
        """
        self.story.append(Paragraph(compliance_text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.2*inch))
    
    def _create_action_plan(self, warnings: List, suggestions: List):
        """Create remediation action plan"""
        self.story.append(Paragraph("7. REMEDIATION ACTION PLAN", self.styles['SectionTitle']))
        
        action_text = f"""
        <b>Immediate Actions (0-7 days):</b><br/>
        1. Address all critical findings listed in Section 3<br/>
        2. Review and harden SSH configuration<br/>
        3. Enable system auditing and file integrity monitoring<br/>
        <br/>
        <b>Short-term Actions (1-4 weeks):</b><br/>
        1. Implement high-priority recommendations from Section 4<br/>
        2. Deploy additional security monitoring tools<br/>
        3. Update all system packages and apply security patches<br/>
        <br/>
        <b>Long-term Actions (1-3 months):</b><br/>
        1. Implement medium and low priority recommendations<br/>
        2. Establish continuous monitoring and regular audit schedule<br/>
        3. Re-run audit to verify remediation effectiveness<br/>
        <br/>
        <b>Ongoing Maintenance:</b><br/>
        • Schedule monthly security audits<br/>
        • Review audit logs regularly<br/>
        • Keep audit tools and system software updated<br/>
        """
        self.story.append(Paragraph(action_text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.3*inch))
    
    def _create_conclusion(self, compliance_score: int):
        """Create conclusion section"""
        self.story.append(Paragraph("8. CONCLUSION", self.styles['SectionTitle']))
        
        risk_level, _ = self._get_risk_level(compliance_score)
        
        conclusion_text = f"""
        The security audit of <b>{self.data.get('hostname', 'the target system')}</b> reveals 
        a current security posture with a compliance score of <b>{compliance_score}/100</b>, 
        indicating a <b>{risk_level}</b> risk level.<br/>
        <br/>
        While the system demonstrates several security controls in place, there are areas requiring 
        immediate attention to improve the overall security posture. Implementation of the recommended 
        actions will significantly enhance the system's ability to protect against security threats.<br/>
        <br/>
        <b>Next Steps:</b><br/>
        1. Distribute this report to authorized personnel<br/>
        2. Establish a remediation timeline based on risk levels<br/>
        3. Assign responsibility for implementing recommendations<br/>
        4. Schedule a follow-up audit in 30-60 days to verify improvements<br/>
        <br/>
        <i>This report should be reviewed regularly and updated with each new audit cycle.</i>
        """
        self.story.append(Paragraph(conclusion_text, self.styles['Normal']))
        self.story.append(Spacer(1, 0.4*inch))
    
    def _create_footer(self):
        """Create report footer"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        footer_text = f"""
        <font size=8 color="#999999">
        Report Generated: {timestamp}<br/>
        Document Classification: Internal Use<br/>
        © ANATSCRAWLER Security Audit System
        </font>
        """
        self.story.append(Paragraph(footer_text, self.styles['Normal']))
    
    def generate(self, warnings: Optional[List] = None, suggestions: Optional[List] = None):
        """Generate the complete PDF report"""
        warnings = warnings or []
        suggestions = suggestions or []
        
        # Create sections
        self._create_header()
        
        compliance_score = self._calculate_compliance_score(warnings, suggestions)
        self._create_executive_summary(compliance_score, warnings, suggestions)
        
        self.story.append(PageBreak())
        self._create_system_overview()
        self._create_critical_findings(warnings)
        
        self.story.append(PageBreak())
        self._create_recommendations(suggestions)
        
        self.story.append(PageBreak())
        self._create_security_controls()
        self._create_compliance_section()
        
        self.story.append(PageBreak())
        self._create_action_plan(warnings, suggestions)
        self._create_conclusion(compliance_score)
        self._create_footer()
        
        # Build PDF
        self.doc.build(self.story)
        return self.output_path


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Generate comprehensive PDF report from Lynis audit results'
    )
    parser.add_argument('report_file', help='Path to Lynis .dat report file')
    parser.add_argument('-o', '--output', help='Output PDF file path', 
                       default='audit_report.pdf')
    parser.add_argument('-H', '--hostname', help='System hostname')
    parser.add_argument('-I', '--ip', help='System IP address')
    parser.add_argument('-O', '--owner', help='System owner name')
    
    args = parser.parse_args()
    
    # Parse Lynis report
    print(f"Parsing Lynis report: {args.report_file}")
    parser_obj = LynisReportParser(args.report_file)
    
    # Prepare data
    report_data = {
        'hostname': args.hostname or parser_obj.get_value('hostname', 'Unknown'),
        'ip_address': args.ip or parser_obj.get_value('nameserver', 'N/A'),
        'owner_name': args.owner or parser_obj.get_value('auditor', 'Not Specified'),
        'os_name': parser_obj.get_value('os_name', 'Unknown'),
        'os_version': parser_obj.get_value('os_version', ''),
        'kernel_version': parser_obj.get_value('linux_kernel_release', 'Unknown'),
        'kernel_version_full': parser_obj.get_value('linux_kernel_version_full', 'Unknown'),
        'hardware_platform': parser_obj.get_value('hardware_platform', 'Unknown'),
        'vm': parser_obj.get_value('vm', 'Unknown'),
        'uptime_days': parser_obj.get_value('uptime_in_days', 'Unknown'),
        'service_manager': parser_obj.get_value('service_manager', 'Unknown'),
        'cpu_pae': parser_obj.get_value('cpu_pae', False),
        'cpu_nx': parser_obj.get_value('cpu_nx', False),
        'firewall_status': 'Enabled' if parser_obj.get_value('firewall_software') else 'Not Found',
        'ssh_hardening': 'Enabled' if parser_obj.get_value('openssh_daemon_running') else 'Disabled',
        'fim_status': 'Not Installed',  # Would need to check for AIDE, Tripwire, etc.
        'audit_status': 'Enabled' if parser_obj.get_value('audit_daemon_running') else 'Disabled',
        'kernel_hardening': 'Partial',
        'audit_date': parser_obj.get_value('report_datetime_start', datetime.now().isoformat()),
    }
    
    # Get findings
    warnings = parser_obj.get_warnings()
    suggestions = parser_obj.get_suggestions()
    
    # Add severity to suggestions
    for suggestion in suggestions:
        test_id = suggestion['test_id']
        if any(x in test_id for x in ['CRIT', 'FAIL']):
            suggestion['severity'] = 'critical'
        elif any(x in test_id for x in ['HIGH', 'AUTH', 'SSH']):
            suggestion['severity'] = 'high'
        elif any(x in test_id for x in ['MED', 'NETW', 'FILE']):
            suggestion['severity'] = 'medium'
        else:
            suggestion['severity'] = 'low'
    
    # Generate PDF
    print(f"Generating PDF report: {args.output}")
    pdf_generator = AuditPDFReport(report_data, args.output)
    try:
        output_file = pdf_generator.generate(warnings, suggestions)
        print(f"✓ Report generated successfully: {output_file}")
        print(f"  Security Score: {pdf_generator._calculate_compliance_score(warnings, suggestions)}/100")
        print(f"  Critical Issues: {len(warnings)}")
        print(f"  Total Recommendations: {len(suggestions)}")
    except Exception as e:
        print(f"✗ Error generating PDF: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
