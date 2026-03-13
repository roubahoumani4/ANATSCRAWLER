/**
 * Lynis Report PDF Generator Service
 * Integrates with Node.js backend to generate comprehensive audit reports
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

interface LynisReportData {
  reportId: string;
  hostname: string;
  ipAddress: string;
  ownerName: string;
  osName: string;
  osVersion: string;
  kernelVersion: string;
  auditDate: Date;
  logFileContent: string;
  reportFileContent: string;
}

interface GenerateReportOptions {
  outputDir?: string;
  format?: 'pdf' | 'html' | 'json';
  includeRawData?: boolean;
}

export class AuditReportGenerator {
  private pythonScriptPath: string;
  private tempDir: string;

  constructor() {
    // The Python report generator script is deployed to /var/www/anatscrawler/scripts
    // Check both locations for compatibility
    const deployedScriptPath = path.join(__dirname, '..', '..', 'scripts', 'generate_audit_pdf_report.py');
    const localScriptPath = path.join(__dirname, '..', 'scripts', 'generate_audit_pdf_report.py');

    this.pythonScriptPath = fs.existsSync(deployedScriptPath) ? deployedScriptPath : localScriptPath;
    this.tempDir = path.join(__dirname, '..', '..', 'temp');

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if required Python dependencies are installed
   */
  async checkDependencies(): Promise<boolean> {
    try {
      // Use virtual environment Python if available
      const venvPython = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

      const { stdout } = await exec(
        `${pythonCmd} -c "import reportlab; print(reportlab.__version__)"`
      );
      console.log(`✓ ReportLab is installed: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error('✗ ReportLab not found. Install with: pip install reportlab');
      return false;
    }
  }

  /**
   * Save Lynis report data to temporary file
   */
  private async saveTempReportFile(reportContent: string): Promise<string> {
    const tempFile = path.join(
      this.tempDir,
      `lynis_report_${Date.now()}.dat`
    );
    
    await promisify(fs.writeFile)(tempFile, reportContent, 'utf-8');
    return tempFile;
  }

  /**
   * Generate PDF report from Lynis data
   */
  async generatePDFReport(
    lynisReportData: LynisReportData,
    options: GenerateReportOptions = {}
  ): Promise<string> {
    try {
      // Check dependencies
      const depsOk = await this.checkDependencies();
      if (!depsOk) {
        throw new Error('Required dependencies not installed');
      }

      // Save report to temp file
      const tempReportFile = await this.saveTempReportFile(
        lynisReportData.reportFileContent
      );

      // Prepare output path
      const outputDir = options.outputDir || path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(
        outputDir,
        `audit_report_${lynisReportData.reportId}_${Date.now()}.pdf`
      );

      // Build command
      const venvPython = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
      const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';

      console.log(`Generating PDF report: ${outputFile}`);
      console.log(`Using Python: ${pythonExecutable}`);

      // Execute Python script
      return await new Promise((resolve, reject) => {
        const python = spawn(pythonExecutable, [
          this.pythonScriptPath,
          tempReportFile,
          '-o', outputFile,
          '-H', lynisReportData.hostname,
          '-I', lynisReportData.ipAddress,
          '-O', lynisReportData.ownerName
        ]);

        let stdout = '';
        let stderr = '';

        python.stdout?.on('data', (data) => {
          stdout += data.toString();
          console.log(data.toString());
        });

        python.stderr?.on('data', (data) => {
          stderr += data.toString();
          console.error(data.toString());
        });

        python.on('close', (code) => {
          // Clean up temp file
          fs.unlink(tempReportFile, () => {});

          if (code !== 0) {
            reject(new Error(`Python script failed: ${stderr}`));
          } else {
            resolve(outputFile);
          }
        });

        python.on('error', (err) => {
          fs.unlink(tempReportFile, () => {});
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  /**
   * Generate HTML report (alternative format)
   */
  async generateHTMLReport(
    lynisReportData: LynisReportData,
    options: GenerateReportOptions = {}
  ): Promise<string> {
    const outputDir = options.outputDir || path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlContent = this.buildHTMLReport(lynisReportData);
    const outputFile = path.join(
      outputDir,
      `audit_report_${lynisReportData.reportId}.html`
    );

    await promisify(fs.writeFile)(outputFile, htmlContent, 'utf-8');
    return outputFile;
  }

  /**
   * Build HTML report content
   */
  private buildHTMLReport(data: LynisReportData): string {
    const date = new Date(data.auditDate).toLocaleString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Security Audit Report - ${data.hostname}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        header {
            text-align: center;
            border-bottom: 3px solid #1a365d;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #1a365d;
            font-size: 28px;
            margin-bottom: 5px;
        }
        h2 {
            color: #2c5282;
            font-size: 18px;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #cbd5e0;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th {
            background: #1a365d;
            color: white;
            padding: 12px;
            text-align: left;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:hover { background: #f7fafc; }
        .critical { color: #c53030; background: #fed7d7; }
        .high { color: #7c2d12; background: #ffedd5; }
        .medium { color: #744210; background: #feebc8; }
        .meta-info {
            background: #f7fafc;
            padding: 15px;
            border-left: 4px solid #2c5282;
            margin: 20px 0;
        }
        .warning-box {
            border: 1px solid #faf089;
            background: #fffbea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #718096;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔒 System Security Audit Report</h1>
            <p>Lynis Security Assessment - Comprehensive Audit Report</p>
        </header>

        <div class="meta-info">
            <strong>Report Generated:</strong> ${date}<br>
            <strong>System:</strong> ${data.hostname}<br>
            <strong>IP Address:</strong> ${data.ipAddress}<br>
            <strong>Owner:</strong> ${data.ownerName}<br>
            <strong>OS:</strong> ${data.osName} ${data.osVersion}<br>
            <strong>Kernel:</strong> ${data.kernelVersion}
        </div>

        <div class="warning-box">
            <strong>⚠️ Confidentiality Notice:</strong> This report contains sensitive security audit information. 
            Unauthorized access, use, or distribution is prohibited.
        </div>

        <h2>1. Executive Summary</h2>
        <p>
            This security audit report provides a comprehensive assessment of the system's current security posture. 
            The report evaluates the system against industry standards including ISO 27001, NIST, and CIS Benchmarks.
        </p>

        <h2>2. System Overview</h2>
        <table>
            <tr>
                <th>Property</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Hostname</td>
                <td>${data.hostname}</td>
            </tr>
            <tr>
                <td>IP Address</td>
                <td>${data.ipAddress}</td>
            </tr>
            <tr>
                <td>Operating System</td>
                <td>${data.osName} ${data.osVersion}</td>
            </tr>
            <tr>
                <td>Owner</td>
                <td>${data.ownerName}</td>
            </tr>
        </table>

        <h2>3. Compliance & Standards</h2>
        <p>This audit evaluates system compliance against:</p>
        <ul>
            <li><strong>ISO/IEC 27001</strong> - Information Security Management System</li>
            <li><strong>NIST Cybersecurity Framework</strong> - Identify, Protect, Detect, Respond, Recover</li>
            <li><strong>CIS Benchmarks</strong> - Center for Internet Security Best Practices</li>
        </ul>

        <h2>4. Recommendations</h2>
        <p>Please refer to the complete PDF report for detailed findings and recommendations.</p>

        <footer>
            <p>Report generated by ANATSCRAWLER Security Audit System</p>
            <p>© 2024 - All rights reserved. Document Classification: Internal Use</p>
        </footer>
    </div>
</body>
</html>
    `;
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(): Promise<void> {
    try {
      const files = await promisify(fs.readdir)(this.tempDir);
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        await promisify(fs.unlink)(filePath);
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }
}

export default AuditReportGenerator;
