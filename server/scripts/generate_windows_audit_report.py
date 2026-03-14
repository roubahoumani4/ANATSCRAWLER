#!/usr/bin/env python3
"""
ANATSCRAWLER Windows OS Hardening Audit Report Generator
Builds a PDF report from Windows audit output.
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)


def _severity_for_line(line: str) -> str:
    text = line.lower()
    critical_keys = ["firewall", "defender", "credential", "admin", "password policy", "lockout"]
    high_keys = ["uac", "smb", "rdp", "winrm", "tls", "ssl", "encryption"]
    medium_keys = ["audit", "logging", "registry", "update", "patch"]

    if any(k in text for k in critical_keys):
        return "critical"
    if any(k in text for k in high_keys):
        return "high"
    if any(k in text for k in medium_keys):
        return "medium"
    return "low"


def parse_output(raw_output: str) -> Dict:
    findings: Dict[str, List[str]] = {
        "critical": [],
        "high": [],
        "medium": [],
        "low": [],
    }

    passed = 0
    for line in raw_output.splitlines():
        line = line.strip()
        if not line:
            continue

        if "[PASS]" in line:
            passed += 1
        elif "[FAIL]" in line or "FAILED" in line.upper():
            sev = _severity_for_line(line)
            findings[sev].append(line)

    score = 100
    score -= 15 * len(findings["critical"])
    score -= 10 * len(findings["high"])
    score -= 5 * len(findings["medium"])
    score -= 2 * len(findings["low"])
    score = max(0, min(100, score))

    return {
        "findings": findings,
        "passed": passed,
        "score": score,
        "total_failed": sum(len(v) for v in findings.values()),
    }


def build_report(
    output_file: str,
    hostname: str,
    ip_address: str,
    owner_name: str,
    parsed: Dict,
):
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#1a365d"),
        spaceAfter=8,
    )
    section_style = ParagraphStyle(
        "section",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#2c5282"),
        spaceAfter=8,
        spaceBefore=10,
    )

    doc = SimpleDocTemplate(
        output_file,
        pagesize=A4,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )

    story = []
    story.append(Paragraph("ANATSCRAWLER Windows OS Hardening Audit Report", title_style))
    story.append(Paragraph("Executive Security Assessment", styles["Heading3"]))
    story.append(Spacer(1, 0.18 * inch))

    meta = [
        ["Report Date", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Hostname", hostname],
        ["IP Address", ip_address],
        ["Owner", owner_name],
        ["Security Score", f"{parsed['score']}/100"],
        ["Failed Checks", str(parsed["total_failed"])],
        ["Passed Checks", str(parsed["passed"])],
    ]
    meta_table = Table(meta, colWidths=[2.0 * inch, 4.8 * inch])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#1a365d")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
                ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, colors.HexColor("#f7fafc")]),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(meta_table)

    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Findings Overview", section_style))

    summary = [
        ["Severity", "Count"],
        ["Critical", str(len(parsed["findings"]["critical"]))],
        ["High", str(len(parsed["findings"]["high"]))],
        ["Medium", str(len(parsed["findings"]["medium"]))],
        ["Low", str(len(parsed["findings"]["low"]))],
    ]
    summary_table = Table(summary, colWidths=[3.4 * inch, 3.4 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ]
        )
    )
    story.append(summary_table)

    for severity in ["critical", "high", "medium", "low"]:
        items = parsed["findings"][severity]
        if not items:
            continue

        story.append(Spacer(1, 0.18 * inch))
        story.append(Paragraph(f"{severity.title()} Findings", section_style))

        rows = [["Finding", "Recommendation"]]
        for line in items[:20]:
            cleaned = re.sub(r"\s+", " ", line)
            rows.append([
                cleaned[:130],
                "Apply the recommended hardening control and validate configuration.",
            ])

        table = Table(rows, colWidths=[3.9 * inch, 2.9 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e0")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(table)

    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Compliance Context", section_style))
    story.append(
        Paragraph(
            "This report aligns findings with common enterprise hardening objectives under ISO 27001, NIST, and CIS-aligned practices.",
            styles["BodyText"],
        )
    )

    doc.build(story)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate ANATSCRAWLER Windows OS hardening PDF report"
    )
    parser.add_argument("input_file", help="Path to Windows audit output text file")
    parser.add_argument("-o", "--output", default="windows_audit_report.pdf", help="Output PDF file")
    parser.add_argument("-H", "--hostname", required=True, help="System hostname")
    parser.add_argument("-I", "--ip", required=True, help="System IP address")
    parser.add_argument("-O", "--owner", required=True, help="Owner name")

    args = parser.parse_args()

    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        return 1

    raw_output = input_path.read_text(encoding="utf-8", errors="ignore")
    parsed = parse_output(raw_output)

    build_report(
        output_file=args.output,
        hostname=args.hostname,
        ip_address=args.ip,
        owner_name=args.owner,
        parsed=parsed,
    )

    print(f"Generated report: {args.output}")
    print(f"Score: {parsed['score']}/100")
    print(f"Critical: {len(parsed['findings']['critical'])}")
    print(f"High: {len(parsed['findings']['high'])}")
    print(f"Medium: {len(parsed['findings']['medium'])}")
    print(f"Low: {len(parsed['findings']['low'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
