# 🚀 PDF Audit Report Generator - Quick Start Guide

This guide will help you set up and use the comprehensive PDF report generator for Lynis OS audit results.

## 5-Minute Setup

### 1. Install Python Dependencies

```bash
cd server/scripts
pip install -r requirements_pdf_report.txt
```

**Verify installation:**
```bash
python3 -c "import reportlab; print('✓ Setup successful!')"
```

### 2. Generate Your First Report

**From command line:**
```bash
python3 generate_audit_pdf_report.py \
  /path/to/lynis-report.dat \
  -o my_audit_report.pdf \
  -H server-name \
  -I 192.168.1.100 \
  -O "Owner Name"
```

**That's it!** Your PDF report is ready to view.

---

## 📊 What You Get

The generated report includes:

- ✓ **Executive Summary** - Security score and key metrics
- ✓ **System Overview** - Hardware and OS details
- ✓ **Critical Findings** - Issues needing immediate attention
- ✓ **Recommendations** - Prioritized by risk level
- ✓ **Compliance Assessment** - ISO 27001, NIST alignment
- ✓ **Action Plan** - Clear remediation steps
- ✓ **Professional Format** - Ready for executives and auditors

---

## 🔗 REST API Integration

After installing, the following endpoints are available:

### Generate PDF Report
```bash
curl -X POST \
  http://localhost:3000/api/v1/os-audit/reports/generate-pdf/REPORT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o report.pdf
```

### List All Reports
```bash
curl -X GET \
  http://localhost:3000/api/v1/os-audit/reports/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Report Details
```bash
curl -X GET \
  http://localhost:3000/api/v1/os-audit/reports/REPORT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bulk Generate Multiple Reports
```bash
curl -X POST \
  http://localhost:3000/api/v1/os-audit/reports/bulk-generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIds": ["report-1", "report-2", "report-3"]
  }'
```

---

## 🎯 Usage Examples

### Example 1: Weekly Automated Reports

```bash
# Add to crontab for weekly reports
0 7 * * 1 python3 /opt/anatscrawler/generate_audit_pdf_report.py \
  /var/log/lynis-report.dat \
  -o /reports/audit_$(date +\%Y\%m\%d).pdf
```

### Example 2: Monthly Compliance Review

```bash
#!/bin/bash
# Generate reports for all servers and archive

SERVERS=("prod-server-01" "prod-server-02" "staging-server")
REPORT_DIR="/secure/reports/$(date +%Y-%m)"
mkdir -p $REPORT_DIR

for server in "${SERVERS[@]}"; do
  python3 generate_audit_pdf_report.py \
    /var/log/lynis-report.dat \
    -o "$REPORT_DIR/audit_${server}_$(date +%Y%m%d).pdf" \
    -H "$server"
done

echo "✓ Generated reports in $REPORT_DIR"
```

### Example 3: Automated Email Distribution

```bash
# After generating report, email to stakeholders
python3 generate_audit_pdf_report.py \
  /var/log/lynis-report.dat \
  -o /tmp/report.pdf \
  -H "$(hostname)"

# Email report
mail -s "Security Audit Report - $(date +%Y-%m-%d)" \
  security-team@company.com \
  < /tmp/report.pdf
```

---

## 📈 Report Scoring Explained

### Security Score (0-100)

```
Starting Score: 100 points

Deductions:
- Warning Found: -5 points
- Critical Issue: -3 points
- High Priority: -2 points
- Medium Priority: -1 point
```

### Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 80-100 | Low | Maintain current controls |
| 60-79 | Medium | Plan improvements |
| 40-59 | High | Urgent remediation needed |
| 0-39 | Critical | Immediate action required |

---

## 🔍 Sample Report Output

```
SYSTEM SECURITY AUDIT REPORT
Lynis Security Assessment

Report Generated: 2024-03-13 15:16:00
System: guacamole
IP Address: 192.168.1.101
OS: Ubuntu 24.04.3 LTS
Kernel: 6.8.0-88-generic

EXECUTIVE SUMMARY
─────────────────
Overall Security Score: 72/100
Risk Level: MEDIUM
Critical Issues: 3
Recommendations: 24

CRITICAL FINDINGS
─────────────────
1. SSH-7408: Consider hardening SSH configuration
2. AUTH-9262: Install PAM module for password strength
3. KRNL-5830: Reboot system to apply kernel hardening

RECOMMENDATIONS (Priority)
─────────────────────────
Critical (3):
  • Improve SSH hardening
  • Enhance authentication mechanisms
  • Apply kernel security patches

High (8):
  • Update sysctl settings
  • Strengthen firewall rules
  ...

[Full report continues with compliance sections, action plan, etc.]
```

---

## ⚠️ Troubleshooting

### Python Module Not Found

```bash
# Solution: Install missing dependencies
pip install reportlab --upgrade
```

### Permission Denied

```bash
# Solution: Fix file permissions
chmod +x generate_audit_pdf_report.py
sudo chmod 644 /var/log/lynis-report.dat
```

### API Returns 404

```bash
# Solution: Verify report exists and you own it
curl -X GET \
  http://localhost:3000/api/v1/os-audit/reports/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

See **[COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md](./COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md)** for detailed documentation and troubleshooting.

---

## 📚 Full Documentation

For complete documentation including:
- Advanced configuration options
- Batch processing
- Custom styling
- Integration guides
- Troubleshooting

👉 **Read: [COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md](./COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md)**

---

## 🎓 Next Steps

1. ✅ **[Setup](./COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md#installation)** - Follow installation guide
2. ✅ **Generate First Report** - Try command line example above
3. ✅ **Integrate with API** - Connect to your frontend
4. ✅ **Automate** - Set up cron jobs for regular reports
5. ✅ **Archive** - Store reports securely for compliance

---

## 💡 Tips

- **PDF Size**: ~150-300 KB per report
- **Generation Time**: ~2-5 seconds per report
- **Bulk Processing**: Can generate 10+ reports in ~30 seconds
- **Storage**: Store in secure, encrypted location
- **Retention**: Typically keep for 1-3 years for compliance

---

## 🤝 Support

- **Issues?** Check [Troubleshooting](./COMPREHENSIVE_PDF_AUDIT_REPORT_GUIDE.md#troubleshooting)
- **Questions?** See [FAQ](#faq) below
- **Bugs?** Report in project issue tracker

---

## ❓ FAQ

**Q: Can I customize the report template?**  
A: Yes! Edit `generate_audit_pdf_report.py` and modify the `_create_*` methods in the `AuditPDFReport` class.

**Q: How do I generate reports for multiple systems?**  
A: Use the bulk endpoint at `/api/v1/os-audit/reports/bulk-generate` or loop over servers in a script.

**Q: Are reports encrypted?**  
A: Currently stored as plain PDF. Implement encryption at the storage layer for sensitive environments.

**Q: Can I export to other formats?**  
A: Yes! HTML format supported via `/api/v1/os-audit/reports/generate-html/:reportId`. JSON easily possible too.

**Q: How often should I run audits?**  
A: Recommended: Monthly for production systems, weekly for critical infrastructure, after security updates.

---

**Version**: 1.0.0  
**Last Updated**: 2024-03-13  
**Maintained By**: ANATSCRAWLER Security Team
