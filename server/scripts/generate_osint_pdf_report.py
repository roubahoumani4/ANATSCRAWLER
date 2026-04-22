#!/usr/bin/env python3
"""
Professional OSINT / Vulnerability-Assessment PDF Report Generator
==================================================================

Reads all artifact JSON files produced by `osint_pro.py` in a target
output directory (e.g. `osint_example.com/`) and renders a single,
professionally formatted PDF suitable for client delivery.

Usage:
    generate_osint_pdf_report.py <output_dir> [--out <file.pdf>]

The script is intentionally self-contained: it depends only on
reportlab (Pillow is optional — used to preserve the ANAT logo's
aspect ratio). When a particular artifact is missing or empty, that
section is simply skipped instead of producing an empty page.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch, mm
    from reportlab.platypus import (
        Image,
        KeepTogether,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab", file=sys.stderr)
    sys.exit(2)


# ---------------------------------------------------------------------------
# ANAT brand palette
# ---------------------------------------------------------------------------
BRAND_GOLD = colors.HexColor("#B8985A")   # matches anatlogo.png
BRAND_DARK = colors.HexColor("#0F1114")
BRAND_GREY = colors.HexColor("#4A4A4A")
BRAND_LIGHT_BG = colors.HexColor("#F6F3EC")
BRAND_LINE = colors.HexColor("#D9CFB8")

SEV_COLORS = {
    "CRITICAL": colors.HexColor("#B91C1C"),
    "HIGH": colors.HexColor("#EA580C"),
    "MEDIUM": colors.HexColor("#CA8A04"),
    "LOW": colors.HexColor("#2563EB"),
    "INFO": colors.HexColor("#6B7280"),
}
SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _safe(text: Any, max_len: int = 0) -> str:
    """XML-escape for ReportLab Paragraph."""
    if text is None:
        return ""
    t = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if max_len and len(t) > max_len:
        t = t[: max_len - 1] + "…"
    return t


def _load_json(path: Path) -> Optional[Any]:
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            return json.load(f)
    except Exception:
        return None


def _join_any(value: Any, sep: str = ", ") -> str:
    """Render a list/tuple/scalar as a comma-separated string regardless of
    whether the items are strings, dicts, or other objects. Returns empty
    string for falsy/None."""
    if value is None or value == "":
        return ""
    if isinstance(value, (list, tuple, set)):
        parts = []
        for item in value:
            if item is None or item == "":
                continue
            if isinstance(item, dict):
                # prefer common human-readable keys
                pick = (
                    item.get("name")
                    or item.get("protocol")
                    or item.get("cipher")
                    or item.get("version")
                    or item.get("value")
                )
                parts.append(str(pick) if pick else json.dumps(item, default=str))
            else:
                parts.append(str(item))
        return sep.join(parts)
    return str(value)


def _find_logo() -> Optional[str]:
    here = Path(__file__).resolve().parent
    candidates = [
        os.environ.get("ANAT_LOGO"),
        # Logo shipped alongside this script (preferred in prod)
        str(here / "anatlogo.png"),
        str(here.parent / "anatlogo.png"),
        # Dev repo layouts
        "/var/www/anatscrawler/current/client/src/assets/anatlogo.png",
        "/var/www/anatscrawler/client/src/assets/anatlogo.png",
        str(here.parent.parent / "client" / "src" / "assets" / "anatlogo.png"),
        str(here.parent / "client" / "src" / "assets" / "anatlogo.png"),
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return None


LOGO_PATH = _find_logo()


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
def _build_styles() -> Dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    s: Dict[str, ParagraphStyle] = {}

    s["CoverTitle"] = ParagraphStyle(
        name="CoverTitle", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=26, leading=32,
        alignment=TA_CENTER, textColor=BRAND_DARK, spaceAfter=6,
    )
    s["CoverSubtitle"] = ParagraphStyle(
        name="CoverSubtitle", parent=base["Normal"],
        fontName="Helvetica", fontSize=13, leading=16,
        alignment=TA_CENTER, textColor=BRAND_GOLD, spaceAfter=18,
    )
    s["CoverMeta"] = ParagraphStyle(
        name="CoverMeta", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        alignment=TA_CENTER, textColor=BRAND_GREY,
    )
    s["H1"] = ParagraphStyle(
        name="H1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=16, leading=20,
        textColor=BRAND_DARK, spaceBefore=6, spaceAfter=8,
        borderPadding=0,
    )
    s["H2"] = ParagraphStyle(
        name="H2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=12, leading=16,
        textColor=BRAND_GOLD, spaceBefore=10, spaceAfter=4,
    )
    s["H3"] = ParagraphStyle(
        name="H3", parent=base["Heading3"],
        fontName="Helvetica-Bold", fontSize=10.5, leading=14,
        textColor=BRAND_DARK, spaceBefore=6, spaceAfter=2,
    )
    s["Body"] = ParagraphStyle(
        name="Body", parent=base["Normal"],
        fontName="Helvetica", fontSize=9.5, leading=13,
        textColor=BRAND_DARK, alignment=TA_JUSTIFY, spaceAfter=4,
    )
    s["BodySmall"] = ParagraphStyle(
        name="BodySmall", parent=s["Body"],
        fontSize=8.5, leading=11,
    )
    s["Mono"] = ParagraphStyle(
        name="Mono", parent=base["Normal"],
        fontName="Courier", fontSize=8, leading=10,
        textColor=BRAND_DARK,
    )
    s["Cell"] = ParagraphStyle(
        name="Cell", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5, leading=11,
        textColor=BRAND_DARK,
    )
    s["CellBold"] = ParagraphStyle(
        name="CellBold", parent=s["Cell"],
        fontName="Helvetica-Bold",
    )
    s["Footer"] = ParagraphStyle(
        name="Footer", parent=base["Normal"],
        fontName="Helvetica", fontSize=8, leading=10,
        textColor=BRAND_GREY, alignment=TA_CENTER,
    )
    return s


STYLES = _build_styles()


# ---------------------------------------------------------------------------
# Page decoration (header / footer)
# ---------------------------------------------------------------------------
def _header_footer(canvas, doc, target: str):
    canvas.saveState()
    page_w, page_h = A4

    # Header bar
    canvas.setFillColor(BRAND_DARK)
    canvas.rect(0, page_h - 24 * mm, page_w, 24 * mm, stroke=0, fill=1)

    # Logo
    if LOGO_PATH:
        try:
            canvas.drawImage(
                LOGO_PATH,
                12 * mm, page_h - 22 * mm,
                width=18 * mm, height=18 * mm,
                preserveAspectRatio=True, mask="auto",
            )
        except Exception:
            pass

    # Brand text
    canvas.setFillColor(BRAND_GOLD)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(36 * mm, page_h - 13 * mm, "ANAT SECURITY")
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(36 * mm, page_h - 18 * mm, "OSINT & Vulnerability Assessment Report")

    # Right-aligned target
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(page_w - 12 * mm, page_h - 13 * mm, f"Target: {target}")
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(page_w - 12 * mm, page_h - 18 * mm,
                           datetime.now().strftime("%B %d, %Y"))

    # Footer line
    canvas.setStrokeColor(BRAND_GOLD)
    canvas.setLineWidth(0.5)
    canvas.line(12 * mm, 15 * mm, page_w - 12 * mm, 15 * mm)

    canvas.setFillColor(BRAND_GREY)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(12 * mm, 10 * mm, "CONFIDENTIAL — For Authorised Recipient Only")
    canvas.drawRightString(page_w - 12 * mm, 10 * mm, f"Page {canvas.getPageNumber()}")

    canvas.restoreState()


# ---------------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------------
AVAILABLE_WIDTH = A4[0] - 24 * mm  # with 12 mm side margins


def _kv_table(rows: List[Tuple[str, Any]], col_widths: Optional[List[float]] = None) -> Table:
    data = []
    for k, v in rows:
        data.append([
            Paragraph(_safe(k), STYLES["CellBold"]),
            Paragraph(_safe(v) if v not in (None, "", []) else "<i>—</i>", STYLES["Cell"]),
        ])
    if not col_widths:
        col_widths = [AVAILABLE_WIDTH * 0.28, AVAILABLE_WIDTH * 0.72]
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.25, BRAND_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _grid_table(header: List[str], rows: List[List[Any]],
                col_widths: Optional[List[float]] = None,
                severity_col: Optional[int] = None) -> Table:
    if not rows:
        rows = [["—"] * len(header)]
    header_style = ParagraphStyle(
        name="GridHeader", parent=STYLES["CellBold"],
        textColor=colors.white,
    )
    data = [[Paragraph(_safe(h), header_style) for h in header]]
    for r in rows:
        data.append([
            Paragraph(_safe(c) if c not in (None, "", []) else "—", STYLES["Cell"])
            for c in r
        ])
    if not col_widths:
        col_widths = [AVAILABLE_WIDTH / len(header)] * len(header)
    t = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, BRAND_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG]),
    ]
    if severity_col is not None:
        for idx, r in enumerate(rows, start=1):
            sev = str(r[severity_col]).upper().strip() if severity_col < len(r) else ""
            c = SEV_COLORS.get(sev)
            if c:
                style.append(("BACKGROUND", (severity_col, idx), (severity_col, idx), c))
                style.append(("TEXTCOLOR", (severity_col, idx), (severity_col, idx), colors.white))
                style.append(("FONTNAME", (severity_col, idx), (severity_col, idx), "Helvetica-Bold"))
                style.append(("ALIGN", (severity_col, idx), (severity_col, idx), "CENTER"))
    t.setStyle(TableStyle(style))
    return t


def _section_title(story: list, number: str, title: str):
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>{number}. {_safe(title)}</b>", STYLES["H1"]))
    story.append(Spacer(1, 4))


def _sub_title(story: list, text: str):
    story.append(Paragraph(_safe(text), STYLES["H2"]))


def _body(story: list, text: str, raw_html: bool = False):
    """Append a body paragraph. Set raw_html=True when `text` already
    contains safe inline HTML (<b>, <i>, <font>) that must not be escaped."""
    story.append(Paragraph(text if raw_html else _safe(text), STYLES["Body"]))


# ---------------------------------------------------------------------------
# Data aggregation
# ---------------------------------------------------------------------------
class ReportData:
    """Loads every artifact in the output directory into a single dict."""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.complete: Dict[str, Any] = _load_json(output_dir / "complete_results.json") or {}
        self.artifacts = {
            "whois": self._load("whois_detailed.json"),
            "dns": self._load("dns_analysis.json"),
            "subdomains": self._load("subdomains_comprehensive.json"),
            "ports": self._load("port_scanning.json"),
            "ssl": self._load("ssl_analysis.json"),
            "web": self._load("web_analysis.json"),
            "waf": self._load("waf_detection.json"),
            "ip_geo": self._load("ip_geolocation.json"),
            "business": self._load("business_intelligence.json"),
            "social": self._load("social_media.json"),
            "email": self._load("email_patterns.json"),
            "tech": self._load("technology_stack.json"),
            "cloud": self._load("cloud_infrastructure.json"),
            "js": self._load("javascript_libraries.json"),
            "sql": self._load("sql_injection.json"),
            "amass": self._load("amass.json"),
            "breach": self._load("breach_analysis.json"),
        }

    def _load(self, name: str) -> Any:
        return _load_json(self.output_dir / name)

    @property
    def target(self) -> str:
        return str(self.complete.get("metadata", {}).get("target")
                   or self.output_dir.name.replace("osint_", ""))

    @property
    def scan_date(self) -> str:
        ts = self.complete.get("metadata", {}).get("scan_time")
        if ts:
            try:
                return datetime.fromisoformat(ts).strftime("%B %d, %Y %H:%M UTC")
            except Exception:
                return ts
        return datetime.now().strftime("%B %d, %Y %H:%M UTC")

    @property
    def risk_level(self) -> str:
        return str(self.complete.get("executive_summary", {}).get("risk_level") or "MEDIUM").upper()

    @property
    def vulnerabilities(self) -> List[Dict[str, Any]]:
        vulns = self.complete.get("vulnerabilities") or []
        # Sort: CRITICAL → HIGH → MEDIUM → LOW → INFO
        def sort_key(v: Dict[str, Any]):
            sev = str(v.get("severity", "INFO")).upper()
            return SEV_ORDER.index(sev) if sev in SEV_ORDER else len(SEV_ORDER)
        return sorted(vulns, key=sort_key)


# ---------------------------------------------------------------------------
# Section renderers
# ---------------------------------------------------------------------------
def _render_cover(story: list, data: ReportData):
    story.append(Spacer(1, 30 * mm))

    if LOGO_PATH:
        try:
            img = Image(LOGO_PATH, width=55 * mm, height=55 * mm, kind="proportional")
            img.hAlign = "CENTER"
            story.append(img)
            story.append(Spacer(1, 10 * mm))
        except Exception:
            pass

    story.append(Paragraph("OSINT &amp; VULNERABILITY<br/>ASSESSMENT REPORT",
                           STYLES["CoverTitle"]))
    story.append(Paragraph("Comprehensive Attack-Surface Intelligence",
                           STYLES["CoverSubtitle"]))

    story.append(Spacer(1, 10 * mm))

    meta = [
        ("Target", data.target),
        ("Assessment Date", data.scan_date),
        ("Overall Risk Rating", data.risk_level),
        ("Classification", data.complete.get("metadata", {}).get(
            "report_classification", "Client Investigation")),
        ("Report Revision", data.complete.get("metadata", {}).get("revision", "2.0")),
        ("Generated By", "ANAT Security Attack Surface Intelligence Platform"),
    ]
    cover_key_style = ParagraphStyle(
        name="CoverKey", parent=STYLES["CellBold"],
        textColor=colors.white,
    )
    t = Table(
        [[Paragraph(_safe(k), cover_key_style),
          Paragraph(_safe(v), STYLES["Cell"])] for k, v in meta],
        colWidths=[60 * mm, 90 * mm],
        hAlign="CENTER",
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BRAND_DARK),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("BACKGROUND", (1, 0), (1, -1), BRAND_LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.3, BRAND_GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    story.append(Spacer(1, 25 * mm))
    story.append(Paragraph(
        "This document contains confidential information intended solely for "
        "the authorised recipient. Unauthorised review, disclosure or "
        "distribution is strictly prohibited.",
        STYLES["CoverMeta"]))
    story.append(PageBreak())


def _severity_counts(vulns: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = {s: 0 for s in SEV_ORDER}
    for v in vulns:
        sev = str(v.get("severity", "INFO")).upper()
        counts[sev] = counts.get(sev, 0) + 1
    return counts


def _render_executive_summary(story: list, data: ReportData):
    _section_title(story, "1", "Executive Summary")

    vulns = data.vulnerabilities
    counts = _severity_counts(vulns)
    ports = (data.artifacts.get("ports") or {}).get("open_ports") or []
    subs = len((data.complete.get("subdomains") or {}).get("common_subdomains") or []) \
        or len((data.artifacts.get("subdomains") or {}).get("common_subdomains") or [])
    if not subs:
        subs = len((data.artifacts.get("amass") or {}).get("hosts") or [])
    ips = len((data.complete.get("network_infrastructure") or {}).get("ip_geolocation") or {})
    amass = data.artifacts.get("amass") or {}

    _body(story,
          f"This report presents the findings of an open-source intelligence (OSINT) "
          f"and passive vulnerability assessment conducted against "
          f"<b>{_safe(data.target)}</b>. The assessment enumerates externally "
          f"observable infrastructure, identifies exposed services, evaluates "
          f"configuration and cryptographic posture, and correlates findings "
          f"against live vulnerability databases.",
          raw_html=True)

    story.append(Spacer(1, 4))
    _sub_title(story, "Key Metrics")
    story.append(_grid_table(
        ["Metric", "Value"],
        [
            ["Overall Risk Rating", data.risk_level],
            ["Total Findings", str(len(vulns))],
            ["Critical", str(counts.get("CRITICAL", 0))],
            ["High", str(counts.get("HIGH", 0))],
            ["Medium", str(counts.get("MEDIUM", 0))],
            ["Low / Informational",
             str(counts.get("LOW", 0) + counts.get("INFO", 0))],
            ["Subdomains Discovered", str(subs)],
            ["Unique IPs", str(ips)],
            ["Open Services", str(len(ports))],
            ["Amass Hosts", str((amass.get("summary") or {}).get("hosts", 0))],
        ],
        col_widths=[AVAILABLE_WIDTH * 0.45, AVAILABLE_WIDTH * 0.55],
    ))

    if any(counts.values()):
        _sub_title(story, "Severity Distribution")
        rows = [[sev, str(counts[sev])] for sev in SEV_ORDER if counts.get(sev)]
        story.append(_grid_table(
            ["Severity", "Count"], rows,
            col_widths=[AVAILABLE_WIDTH * 0.5, AVAILABLE_WIDTH * 0.5],
            severity_col=0,
        ))

    top = [v for v in vulns if str(v.get("severity", "")).upper() in ("CRITICAL", "HIGH")][:5]
    if top:
        _sub_title(story, "Top Findings")
        for v in top:
            sev = str(v.get("severity", "")).upper()
            colour = SEV_COLORS.get(sev, BRAND_GREY).hexval()[2:]
            title = f"<font color='#{colour}'><b>[{sev}]</b></font> {_safe(v.get('type', 'Finding'))}"
            story.append(Paragraph(title, STYLES["H3"]))
            desc = v.get("description") or v.get("recommendation") or ""
            if desc:
                _body(story, desc)

    story.append(PageBreak())


def _render_vulnerabilities(story: list, data: ReportData):
    vulns = data.vulnerabilities
    if not vulns:
        _section_title(story, "2", "Vulnerability Findings")
        _body(story, "No vulnerabilities were identified during this assessment.")
        return

    _section_title(story, "2", "Vulnerability Findings")
    _body(story, "Findings are sorted by descending severity. Each entry includes "
                 "the affected asset, a short description, and — where the scan "
                 "produced one — the recommended remediation.")

    # Summary table
    rows = []
    for i, v in enumerate(vulns, 1):
        rows.append([
            str(i),
            str(v.get("severity", "INFO")).upper(),
            v.get("type", "Unknown"),
            v.get("service") or v.get("host") or v.get("port") or data.target,
        ])
    story.append(_grid_table(
        ["#", "Severity", "Finding", "Asset"],
        rows,
        col_widths=[AVAILABLE_WIDTH * 0.06, AVAILABLE_WIDTH * 0.14,
                    AVAILABLE_WIDTH * 0.50, AVAILABLE_WIDTH * 0.30],
        severity_col=1,
    ))

    story.append(Spacer(1, 8))
    _sub_title(story, "Detailed Findings")
    for i, v in enumerate(vulns, 1):
        sev = str(v.get("severity", "INFO")).upper()
        colour = SEV_COLORS.get(sev, BRAND_GREY).hexval()[2:]
        block: List[Any] = []
        block.append(Paragraph(
            f"<b>{i}. </b><font color='#{colour}'><b>[{sev}]</b></font> "
            f"<b>{_safe(v.get('type', 'Finding'))}</b>",
            STYLES["H3"]))
        kv = [
            ("Asset", v.get("service") or v.get("host") or v.get("port") or data.target),
            ("Description", v.get("description")),
            ("Evidence", v.get("evidence") or v.get("banner")),
            ("CVE / Reference", _join_any(v.get("cves")) or v.get("cve")),
            ("Recommendation", v.get("recommendation") or v.get("remediation")),
        ]
        kv = [(k, val) for k, val in kv if val]
        if kv:
            block.append(_kv_table(kv))
        block.append(Spacer(1, 6))
        story.append(KeepTogether(block))

    story.append(PageBreak())


def _render_recon(story: list, data: ReportData):
    _section_title(story, "3", "Reconnaissance")

    # --- 3.1 WHOIS ---
    whois = data.artifacts.get("whois") or \
        (data.complete.get("domain_information") or {}).get("whois") or {}
    if whois:
        _sub_title(story, "3.1 WHOIS / Domain Registration")
        registrar = (whois.get("registrar") or {}).get("name") if isinstance(whois.get("registrar"), dict) else whois.get("registrar")
        dates = whois.get("dates") or {}
        registrant = whois.get("registrant") or {}
        ns = whois.get("name_servers") or []
        rows = [
            ("Domain", whois.get("domain") or data.target),
            ("Registrar", registrar),
            ("Registrant", registrant.get("name") or registrant.get("organization")),
            ("Registrant Country", registrant.get("country")),
            ("Created", dates.get("created") or dates.get("creation_date")),
            ("Updated", dates.get("updated") or dates.get("updated_date")),
            ("Expires", dates.get("expires") or dates.get("expiration_date")),
            ("Name Servers", _join_any(ns)),
            ("Status", _join_any(whois.get("status"))),
        ]
        story.append(_kv_table([(k, v) for k, v in rows if v]))
        story.append(Spacer(1, 6))

    # --- 3.2 DNS ---
    dns = data.artifacts.get("dns") or \
        (data.complete.get("domain_information") or {}).get("dns") or {}
    records = dns.get("records") or {}
    if records:
        _sub_title(story, "3.2 DNS Records")
        rows = []
        for rtype in ("A", "AAAA", "MX", "NS", "TXT", "SOA", "CNAME"):
            vals = records.get(rtype)
            if not vals:
                continue
            if isinstance(vals, list):
                for v in vals:
                    rows.append([rtype, str(v)])
            else:
                rows.append([rtype, str(vals)])
        if rows:
            story.append(_grid_table(
                ["Type", "Value"], rows,
                col_widths=[AVAILABLE_WIDTH * 0.15, AVAILABLE_WIDTH * 0.85],
            ))
        analysis = dns.get("analysis") or {}
        if analysis.get("spf_analysis") or analysis.get("dkim") or analysis.get("dmarc"):
            _sub_title(story, "3.2.1 Email Authentication Posture")
            rows = []
            if analysis.get("spf_record"):
                spf_a = analysis.get("spf_analysis") or {}
                rows.append(("SPF", analysis.get("spf_record")))
                if spf_a:
                    rows.append(("SPF Analysis",
                                 f"{spf_a.get('policy_strength', '?')} — "
                                 f"{spf_a.get('description', '')} "
                                 f"(risk: {spf_a.get('risk', '?')})"))
            if analysis.get("dmarc") or analysis.get("dmarc_record"):
                rows.append(("DMARC", analysis.get("dmarc") or analysis.get("dmarc_record")))
            if analysis.get("dkim"):
                rows.append(("DKIM", str(analysis.get("dkim"))))
            if rows:
                story.append(_kv_table(rows))

    # --- 3.3 Subdomain enumeration ---
    sub_data = data.artifacts.get("subdomains") or data.complete.get("subdomains") or {}
    common = sub_data.get("common_subdomains") or []
    amass = data.artifacts.get("amass") or {}
    if common or amass.get("hosts"):
        _sub_title(story, "3.3 Subdomain Enumeration")
        rows = []
        for s in common[:200]:
            rows.append([s.get("subdomain"), s.get("ip") or "—", s.get("source", "bruteforce")])
        # merge in amass
        for h in (amass.get("hosts") or [])[:200]:
            ip = ", ".join(a.get("ip", "") for a in (h.get("addresses") or []) if a.get("ip")) or "—"
            src = ", ".join(h.get("sources") or []) or "amass"
            rows.append([h.get("name"), ip, src])
        # dedupe
        seen = set()
        uniq_rows = []
        for r in rows:
            key = (r[0], r[1])
            if key in seen:
                continue
            seen.add(key)
            uniq_rows.append(r)
        story.append(_grid_table(
            ["Subdomain", "IP(s)", "Source"],
            uniq_rows[:120],
            col_widths=[AVAILABLE_WIDTH * 0.45, AVAILABLE_WIDTH * 0.35, AVAILABLE_WIDTH * 0.20],
        ))
        if len(uniq_rows) > 120:
            _body(story, f"<i>… and {len(uniq_rows) - 120} additional host(s) omitted for brevity.</i>", raw_html=True)

    # --- 3.4 IP / Geo ---
    ip_geo = data.artifacts.get("ip_geo") or \
        (data.complete.get("network_infrastructure") or {}).get("ip_geolocation") or {}
    if ip_geo:
        _sub_title(story, "3.4 Network Infrastructure")
        rows = []
        for ip, meta in (ip_geo.items() if isinstance(ip_geo, dict) else []):
            if not isinstance(meta, dict):
                continue
            rows.append([
                ip,
                meta.get("hostname"),
                f"{meta.get('city', '')}, {meta.get('country', '')}".strip(", "),
                meta.get("org") or meta.get("asn"),
            ])
        if rows:
            story.append(_grid_table(
                ["IP", "Hostname", "Location", "ASN / Organisation"], rows,
                col_widths=[AVAILABLE_WIDTH * 0.22, AVAILABLE_WIDTH * 0.28,
                            AVAILABLE_WIDTH * 0.22, AVAILABLE_WIDTH * 0.28],
            ))

    story.append(PageBreak())


def _render_attack_surface(story: list, data: ReportData):
    _section_title(story, "4", "Attack Surface")

    # --- 4.1 Open ports ---
    ports_data = data.artifacts.get("ports") or {}
    open_ports = ports_data.get("open_ports") or \
        (data.complete.get("port_scanning") or {}).get("open_ports") or []
    if open_ports:
        _sub_title(story, "4.1 Open Ports and Services")
        rows = []
        for p in open_ports:
            rows.append([
                p.get("port"), p.get("service"),
                p.get("product") or p.get("banner", "")[:60],
                p.get("version") or "",
                p.get("state", "open"),
            ])
        story.append(_grid_table(
            ["Port", "Service", "Product / Banner", "Version", "State"], rows,
            col_widths=[AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.16,
                        AVAILABLE_WIDTH * 0.40, AVAILABLE_WIDTH * 0.22,
                        AVAILABLE_WIDTH * 0.14],
        ))

    # --- 4.2 WAF ---
    waf = data.artifacts.get("waf") or data.complete.get("waf_detection") or {}
    if waf:
        _sub_title(story, "4.2 Web Application Firewall")
        detected = waf.get("detected") or waf.get("waf_detected")
        rows = [
            ("WAF Detected", "Yes" if detected else "No"),
            ("Product", waf.get("product") or waf.get("waf")),
            ("Manufacturer", waf.get("manufacturer")),
            ("Detection Method", waf.get("method")),
            ("Confidence", waf.get("confidence")),
        ]
        story.append(_kv_table([(k, v) for k, v in rows if v not in (None, "")]))

    # --- 4.3 SSL / TLS ---
    ssl = data.artifacts.get("ssl") or data.complete.get("ssl_certificates") or {}
    if ssl:
        _sub_title(story, "4.3 SSL / TLS Analysis")
        # structure varies; render per host/port
        if isinstance(ssl, dict):
            for host, info in list(ssl.items())[:5]:
                if not isinstance(info, dict):
                    continue
                story.append(Paragraph(f"<b>{_safe(host)}</b>", STYLES["H3"]))
                cert = info.get("certificate") or info.get("cert") or {}
                rows = [
                    ("Subject", cert.get("subject") or cert.get("common_name")),
                    ("Issuer", cert.get("issuer")),
                    ("Valid From", cert.get("not_before") or cert.get("valid_from")),
                    ("Valid Until", cert.get("not_after") or cert.get("valid_until")),
                    ("Signature Algorithm", cert.get("signature_algorithm")),
                    ("Key Strength", cert.get("key_strength") or cert.get("public_key")),
                    ("SANs", _join_any(cert.get("san"))),
                    ("Protocols", _join_any(info.get("protocols"))),
                    ("Weak Ciphers", _join_any(info.get("weak_ciphers"))),
                ]
                rows = [(k, v) for k, v in rows if v]
                if rows:
                    story.append(_kv_table(rows))
                story.append(Spacer(1, 4))

    # --- 4.4 Web technologies ---
    tech = data.artifacts.get("tech") or {}
    web = data.artifacts.get("web") or data.complete.get("web_technologies") or {}
    tech_list = []
    if isinstance(tech, dict):
        tech_list = tech.get("technologies") or tech.get("stack") or []
    analyzed_urls = web.get("analyzed_urls") if isinstance(web, dict) else []
    if tech_list or analyzed_urls:
        _sub_title(story, "4.4 Technology Stack")
        rows = []
        if isinstance(tech_list, list):
            for t in tech_list:
                if isinstance(t, dict):
                    rows.append([t.get("name"), t.get("category") or t.get("type"), t.get("version")])
                else:
                    rows.append([str(t), "", ""])
        if rows:
            story.append(_grid_table(
                ["Technology", "Category", "Version"], rows,
                col_widths=[AVAILABLE_WIDTH * 0.45, AVAILABLE_WIDTH * 0.35,
                            AVAILABLE_WIDTH * 0.20],
            ))
        if analyzed_urls:
            rows = []
            for u in analyzed_urls[:25]:
                if not isinstance(u, dict):
                    continue
                rows.append([
                    u.get("url"),
                    u.get("status_code") or u.get("status"),
                    u.get("server") or u.get("headers", {}).get("Server", "") if isinstance(u.get("headers"), dict) else "",
                    _join_any(u.get("technologies")),
                ])
            if rows:
                story.append(Spacer(1, 4))
                story.append(_grid_table(
                    ["URL", "Status", "Server", "Technologies"], rows,
                    col_widths=[AVAILABLE_WIDTH * 0.38, AVAILABLE_WIDTH * 0.10,
                                AVAILABLE_WIDTH * 0.22, AVAILABLE_WIDTH * 0.30],
                ))

    # --- 4.5 JavaScript libraries ---
    js = data.artifacts.get("js") or {}
    if js:
        libs = js.get("libraries") or js.get("findings") or []
        if isinstance(libs, list) and libs:
            _sub_title(story, "4.5 JavaScript Libraries (Retire.js)")
            rows = []
            for l in libs:
                if not isinstance(l, dict):
                    continue
                vulns = l.get("vulnerabilities") or []
                sev = ""
                if vulns and isinstance(vulns, list):
                    sev = str(vulns[0].get("severity", "")).upper() if isinstance(vulns[0], dict) else ""
                rows.append([
                    l.get("component") or l.get("name"),
                    l.get("version"),
                    sev or "—",
                    str(len(vulns)),
                ])
            story.append(_grid_table(
                ["Library", "Version", "Severity", "# Vulns"], rows,
                col_widths=[AVAILABLE_WIDTH * 0.40, AVAILABLE_WIDTH * 0.20,
                            AVAILABLE_WIDTH * 0.20, AVAILABLE_WIDTH * 0.20],
                severity_col=2,
            ))

    # --- 4.6 Cloud ---
    cloud = data.artifacts.get("cloud") or data.complete.get("cloud_infrastructure") or {}
    cloud_rows = []
    if isinstance(cloud, dict):
        providers = cloud.get("providers") or cloud.get("detected") or {}
        if isinstance(providers, dict):
            for name, info in providers.items():
                detected = (info.get("detected") if isinstance(info, dict) else info)
                cloud_rows.append([name, "Yes" if detected else "No",
                                   (info.get("evidence") if isinstance(info, dict) else "") or ""])
        elif isinstance(providers, list):
            for p in providers:
                cloud_rows.append([p, "Yes", ""])
    if cloud_rows:
        _sub_title(story, "4.6 Cloud Infrastructure")
        story.append(_grid_table(
            ["Provider", "Detected", "Evidence"], cloud_rows,
            col_widths=[AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.15,
                        AVAILABLE_WIDTH * 0.60],
        ))

    story.append(PageBreak())


def _render_intelligence(story: list, data: ReportData):
    _section_title(story, "5", "Open-Source Intelligence")

    # 5.1 Business
    biz = data.artifacts.get("business") or data.complete.get("business_intelligence") or {}
    if biz:
        _sub_title(story, "5.1 Business Intelligence")
        rows = [
            ("Organisation", biz.get("organization") or biz.get("name")),
            ("Industry", biz.get("industry")),
            ("Country", biz.get("country")),
            ("Headquarters", biz.get("headquarters") or biz.get("address")),
            ("Website", biz.get("website") or data.target),
            ("Description", biz.get("description")),
        ]
        rows = [(k, v) for k, v in rows if v]
        if rows:
            story.append(_kv_table(rows))

    # 5.2 Social media
    social = data.artifacts.get("social") or data.complete.get("social_media") or {}
    if social:
        _sub_title(story, "5.2 Social Media Footprint")
        rows = []
        for plat, info in (social.items() if isinstance(social, dict) else []):
            if isinstance(info, dict):
                url = info.get("url") or info.get("profile")
                status = info.get("found") or info.get("exists")
                rows.append([plat, url or "—", "Found" if status else "Not found"])
            elif info:
                rows.append([plat, str(info), "—"])
        if rows:
            story.append(_grid_table(
                ["Platform", "URL", "Status"], rows,
                col_widths=[AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.55,
                            AVAILABLE_WIDTH * 0.20],
            ))

    # 5.3 Email patterns
    email = data.artifacts.get("email") or {}
    if email:
        _sub_title(story, "5.3 Email Patterns &amp; Harvested Addresses")
        rows = [
            ("Pattern", email.get("pattern")),
            ("Confidence", email.get("confidence")),
            ("Sources", _join_any(email.get("sources"))),
        ]
        rows = [(k, v) for k, v in rows if v]
        if rows:
            story.append(_kv_table(rows))
        addrs = email.get("emails") or email.get("addresses") or []
        if isinstance(addrs, list) and addrs:
            rows = [[a] for a in addrs[:40]]
            story.append(Spacer(1, 4))
            story.append(_grid_table(["Discovered Email"], rows,
                                     col_widths=[AVAILABLE_WIDTH]))
            if len(addrs) > 40:
                _body(story, f"<i>… {len(addrs) - 40} additional email(s) omitted.</i>", raw_html=True)

    # 5.4 Breach data
    breach = data.artifacts.get("breach") or data.complete.get("breach_data") or {}
    breach_list = []
    if isinstance(breach, dict):
        breach_list = breach.get("breaches") or breach.get("findings") or []
    if breach_list:
        _sub_title(story, "5.4 Data Breach Exposure")
        rows = []
        for b in breach_list:
            if not isinstance(b, dict):
                continue
            rows.append([
                b.get("name") or b.get("source"),
                b.get("date") or b.get("breach_date"),
                b.get("pwn_count") or b.get("count"),
                _join_any(b.get("data_classes")),
            ])
        story.append(_grid_table(
            ["Breach", "Date", "Count", "Compromised Data"], rows,
            col_widths=[AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.15,
                        AVAILABLE_WIDTH * 0.15, AVAILABLE_WIDTH * 0.45],
        ))


def _sql_has_findings(sql: Dict[str, Any]) -> bool:
    if not isinstance(sql, dict):
        return False
    findings = sql.get("findings") or []
    if isinstance(findings, list) and len(findings) > 0:
        return True
    summary = sql.get("summary") or {}
    if isinstance(summary, dict):
        for key in ("vulnerable", "injectable", "findings", "vulnerabilities"):
            if summary.get(key):
                return True
    return False


def _render_sql_injection(story: list, data: ReportData, section_no: str):
    """Only render if there is something to report (per user requirement)."""
    sql = data.artifacts.get("sql") or data.complete.get("sql_injection") or {}
    if not _sql_has_findings(sql):
        return False
    _section_title(story, section_no, "SQL Injection Analysis")
    summary = sql.get("summary") or {}
    kv_rows = []
    for k, v in summary.items():
        kv_rows.append((k.replace("_", " ").title(), v))
    if kv_rows:
        story.append(_kv_table(kv_rows))

    findings = sql.get("findings") or []
    if findings:
        story.append(Spacer(1, 4))
        _sub_title(story, f"Detected Injection Points ({len(findings)})")
        for i, f in enumerate(findings, 1):
            if not isinstance(f, dict):
                continue
            story.append(Paragraph(
                f"<b>{i}. {_safe(f.get('url') or f.get('target'))}</b>",
                STYLES["H3"]))
            rows = [
                ("Parameter", f.get("parameter")),
                ("Method", f.get("method")),
                ("DBMS", f.get("dbms")),
                ("Techniques", ", ".join(t.get("type", "") for t in f.get("techniques", []) if isinstance(t, dict))),
                ("Payload", f.get("payload")),
            ]
            rows = [(k, v) for k, v in rows if v]
            if rows:
                story.append(_kv_table(rows))
            story.append(Spacer(1, 4))
    story.append(PageBreak())
    return True


def _render_amass(story: list, data: ReportData, section_no: str):
    amass = data.artifacts.get("amass") or {}
    if not amass or not amass.get("hosts"):
        return False
    _section_title(story, section_no, "Amass Attack-Surface Map")
    summary = amass.get("summary") or {}
    kv_rows = [
        ("Mode", amass.get("mode")),
        ("Timeout (minutes)", amass.get("timeout_minutes")),
        ("Hosts Discovered", summary.get("hosts")),
        ("New Subdomains", summary.get("new_subdomains")),
        ("Unique IPs", summary.get("ips")),
        ("Unique ASNs", summary.get("asns")),
    ]
    story.append(_kv_table([(k, v) for k, v in kv_rows if v not in (None, "")]))

    hosts = amass.get("hosts") or []
    asns = amass.get("asns") or []
    if hosts:
        _sub_title(story, "Hosts")
        rows = []
        for h in hosts[:150]:
            ips = ", ".join(a.get("ip", "") for a in (h.get("addresses") or []) if a.get("ip"))
            asn = ", ".join(sorted({str(a.get("asn")) for a in (h.get("addresses") or []) if a.get("asn")}))
            rows.append([h.get("name"), ips or "—", asn or "—",
                         ", ".join(h.get("sources") or []) or "—"])
        story.append(_grid_table(
            ["Host", "IPs", "ASN", "Sources"], rows,
            col_widths=[AVAILABLE_WIDTH * 0.35, AVAILABLE_WIDTH * 0.22,
                        AVAILABLE_WIDTH * 0.13, AVAILABLE_WIDTH * 0.30],
        ))
        if len(hosts) > 150:
            _body(story, f"<i>… {len(hosts) - 150} additional host(s) omitted.</i>", raw_html=True)
    if asns:
        _sub_title(story, "Discovered Autonomous Systems")
        story.append(_grid_table(
            ["ASN"], [[a] for a in asns],
            col_widths=[AVAILABLE_WIDTH],
        ))
    story.append(PageBreak())
    return True


def _render_recommendations(story: list, data: ReportData, section_no: str):
    vulns = data.vulnerabilities
    recs: List[Tuple[str, str]] = []
    seen = set()
    for v in vulns:
        r = v.get("recommendation") or v.get("remediation")
        if not r:
            continue
        key = (str(v.get("severity", "INFO")).upper(), r.strip())
        if key in seen:
            continue
        seen.add(key)
        recs.append(key)

    _section_title(story, section_no, "Remediation Recommendations")
    if not recs:
        _body(story, "No explicit remediation steps were produced for the findings in this "
                     "assessment. Follow industry best practices (CIS / OWASP / NIST SP 800-53) "
                     "to harden the exposed services identified above.")
        return

    rows = [[sev, rec] for sev, rec in recs]
    story.append(_grid_table(
        ["Priority", "Recommendation"], rows,
        col_widths=[AVAILABLE_WIDTH * 0.18, AVAILABLE_WIDTH * 0.82],
        severity_col=0,
    ))


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def build_pdf(output_dir: Path, out_path: Path) -> Path:
    data = ReportData(output_dir)

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=30 * mm,
        bottomMargin=18 * mm,
        title=f"OSINT Assessment Report — {data.target}",
        author="ANAT Security",
    )

    story: List[Any] = []

    # Cover page (no header)
    _render_cover(story, data)

    # Body sections (with header/footer)
    _render_executive_summary(story, data)
    _render_vulnerabilities(story, data)
    _render_recon(story, data)
    _render_attack_surface(story, data)
    _render_intelligence(story, data)

    # Conditional sections
    next_no = 6
    if _render_sql_injection(story, data, str(next_no)):
        next_no += 1
    if _render_amass(story, data, str(next_no)):
        next_no += 1

    _render_recommendations(story, data, str(next_no))

    # Build: cover uses a different template, but for simplicity we apply
    # the same header/footer on all pages (cover will still look good since
    # the logo in the header plus the big centred logo are complementary).
    # If strictly no-header on cover is desired, split into PageTemplates.

    def _on_page(canvas, doc_):
        _header_footer(canvas, doc_, data.target)

    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    return out_path


def main():
    ap = argparse.ArgumentParser(description="Generate professional OSINT PDF report.")
    ap.add_argument("output_dir", help="Path to the osint_<target> directory")
    ap.add_argument("--out", help="Output PDF path", default=None)
    args = ap.parse_args()

    out_dir = Path(args.output_dir).resolve()
    if not out_dir.is_dir():
        print(f"Error: {out_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    target = out_dir.name.replace("osint_", "")
    default_name = f"OSINT_REPORT_{target}.pdf"
    out_path = Path(args.out) if args.out else (out_dir / default_name)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    pdf = build_pdf(out_dir, out_path)
    print(str(pdf))


if __name__ == "__main__":
    main()
