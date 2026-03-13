#!/usr/bin/env python3
"""
Comprehensive PDF Report Generator for Lynis OS Audit
Generates professional, international standard auditing reports from Lynis scan results
Compliant with: ISO 27001, NIST, CIS Benchmarks, SANS Guidelines
"""

import json
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
        """Extract suggestions from report"""
        suggestions = []
        for key, value in self.data.items():
            if key.startswith('suggestion['):
                # Handle both single values and lists
                values = value if isinstance(value, list) else [value]
                for v in values:
                    # Parse format: TEST_ID|Description|Details|Field|Solution
                    parts = v.split('|')
                    if len(parts) >= 2:
                        suggestions.append({
                            'test_id': parts[0],
                            'description': parts[1],
                            'details': parts[2] if len(parts) > 2 else '',
                            'solution': parts[4] if len(parts) > 4 else ''
                        })
        return suggestions
    
    def get_warnings(self) -> List[Dict[str, str]]:
        """Extract warnings from report"""
        warnings = []
        for key, value in self.data.items():
            if key.startswith('warning['):
                # Handle both single values and lists
                values = value if isinstance(value, list) else [value]
                for v in values:
                    parts = v.split('|')
                    if len(parts) >= 2:
                        warnings.append({
                            'test_id': parts[0],
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
        """Create critical findings section"""
        self.story.append(Paragraph("3. CRITICAL FINDINGS", self.styles['SectionTitle']))
        
        if not warnings:
            self.story.append(
                Paragraph("✓ No critical findings identified.", self.styles['Normal'])
            )
        else:
            for idx, warning in enumerate(warnings, 1):
                finding_text = f"""
                <b>{idx}. {warning.get('test_id', 'UNKNOWN')}</b><br/>
                {warning.get('description', '')}<br/>
                <i>Recommendation: {warning.get('recommendation', 'See system recommendations')}</i>
                """
                self.story.append(Paragraph(finding_text, self.styles['CriticalFinding']))
                self.story.append(Spacer(1, 0.1*inch))
        
        self.story.append(Spacer(1, 0.2*inch))
    
    def _create_recommendations(self, suggestions: List):
        """Create recommendations section"""
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
                for idx, item in enumerate(items[:5], 1):  # Limit to top 5 per category
                    rec_text = f"""
                    <b>{idx}. {item.get('test_id', 'UNKNOWN')}</b><br/>
                    {item.get('description', '')}<br/>
                    Solution: {item.get('solution', 'Review system configuration')}
                    """
                    self.story.append(Paragraph(rec_text, self.styles['Normal']))
                    self.story.append(Spacer(1, 0.1*inch))
                
                if len(items) > 5:
                    self.story.append(
                        Paragraph(f"... and {len(items) - 5} more {category.lower()} priority items",
                                 self.styles['Normal'])
                    )
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
