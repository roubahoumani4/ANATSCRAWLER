/**
 * Audit Report PDF Generator Service
 * Supports background pre-generation for both Linux (Lynis) and Windows (HardeningKitty).
 * AI enrichment runs asynchronously after scan submission so PDFs are ready for instant download.
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
  companyName?: string;
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
  aiCachePath?: string;  // Path to pre-computed AI enrichment JSON
}

export class AuditReportGenerator {
  private pythonScriptPath: string;
  private windowsPythonScriptPath: string;
  private tempDir: string;
  private reportsDir: string;

  constructor() {
    const deployedScriptPath = path.join(__dirname, '..', '..', 'scripts', 'generate_audit_pdf_report.py');
    const localScriptPath = path.join(__dirname, '..', 'scripts', 'generate_audit_pdf_report.py');
    const deployedWindowsScriptPath = path.join(__dirname, '..', '..', 'scripts', 'generate_windows_audit_report.py');
    const localWindowsScriptPath = path.join(__dirname, '..', 'scripts', 'generate_windows_audit_report.py');

    this.pythonScriptPath = fs.existsSync(deployedScriptPath) ? deployedScriptPath : localScriptPath;
    this.windowsPythonScriptPath = fs.existsSync(deployedWindowsScriptPath)
      ? deployedWindowsScriptPath
      : localWindowsScriptPath;
    this.tempDir = path.join(__dirname, '..', '..', 'temp');
    this.reportsDir = path.join(__dirname, '..', 'reports');

    for (const dir of [this.tempDir, this.reportsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private getPythonExecutable(): string {
    const venvPython = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
    return fs.existsSync(venvPython) ? venvPython : 'python3';
  }

  /**
   * Check if required Python dependencies are installed
   */
  async checkDependencies(): Promise<boolean> {
    try {
      const pythonCmd = this.getPythonExecutable();
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

  private async saveTempReportFile(reportContent: string): Promise<string> {
    const tempFile = path.join(
      this.tempDir,
      `lynis_report_${Date.now()}.dat`
    );
    await promisify(fs.writeFile)(tempFile, reportContent, 'utf-8');
    return tempFile;
  }

  private async saveTempWindowsOutputFile(outputContent: string): Promise<string> {
    const tempFile = path.join(
      this.tempDir,
      `windows_audit_output_${Date.now()}.txt`
    );
    await promisify(fs.writeFile)(tempFile, outputContent, 'utf-8');
    return tempFile;
  }

  /**
   * Run AI enrichment only (without PDF generation) and return the cache file path.
   * Used during background pre-processing after scan submission.
   */
  async runAiEnrichment(
    reportData: LynisReportData,
    isWindows: boolean
  ): Promise<string> {
    const pythonExecutable = this.getPythonExecutable();
    const aiCacheFile = path.join(this.tempDir, `ai_cache_${reportData.reportId}_${Date.now()}.json`);

    const inputContent = isWindows
      ? (reportData.reportFileContent || reportData.logFileContent)
      : reportData.reportFileContent;

    const tempInputFile = isWindows
      ? await this.saveTempWindowsOutputFile(inputContent)
      : await this.saveTempReportFile(inputContent);

    const scriptPath = isWindows ? this.windowsPythonScriptPath : this.pythonScriptPath;

    const args = [
      scriptPath,
      tempInputFile,
      '-o', aiCacheFile,
      '-H', reportData.hostname,
      '-I', reportData.ipAddress,
      '-O', reportData.ownerName,
      '-K', reportData.kernelVersion || 'Unknown',
      '-C', reportData.companyName || '',
      '--enrich-only'
    ];

    console.log(`[AI-ENRICH] Starting AI enrichment for report ${reportData.reportId} (${isWindows ? 'Windows' : 'Linux'})`);

    return new Promise((resolve, reject) => {
      const python = spawn(pythonExecutable, args, {
        env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
      });

      let stdout = '';
      let stderr = '';

      python.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`[AI-ENRICH] ${data.toString().trim()}`);
      });

      python.stderr?.on('data', (data) => {
        stderr += data.toString();
        // Log chunking/rate limit info at info level
        const msg = data.toString().trim();
        if (msg.includes('[CHUNK]') || msg.includes('[ENRICH]')) {
          console.log(`[AI-ENRICH] ${msg}`);
        } else {
          console.error(`[AI-ENRICH] ${msg}`);
        }
      });

      python.on('close', (code) => {
        fs.unlink(tempInputFile, () => {});
        if (code !== 0) {
          reject(new Error(`AI enrichment failed (exit ${code}): ${stderr}`));
        } else {
          resolve(aiCacheFile);
        }
      });

      python.on('error', (err) => {
        fs.unlink(tempInputFile, () => {});
        reject(err);
      });
    });
  }

  /**
   * Generate PDF report from Lynis data
   */
  async generatePDFReport(
    lynisReportData: LynisReportData,
    options: GenerateReportOptions = {}
  ): Promise<string> {
    try {
      const depsOk = await this.checkDependencies();
      if (!depsOk) {
        throw new Error('Required dependencies not installed');
      }

      const tempReportFile = await this.saveTempReportFile(
        lynisReportData.reportFileContent
      );

      const outputDir = options.outputDir || this.reportsDir;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(
        outputDir,
        `audit_report_${lynisReportData.reportId}_${Date.now()}.pdf`
      );

      const pythonExecutable = this.getPythonExecutable();

      console.log(`[PDF-GEN] Generating PDF report: ${outputFile}`);

      const args = [
        this.pythonScriptPath,
        tempReportFile,
        '-o', outputFile,
        '-H', lynisReportData.hostname,
        '-I', lynisReportData.ipAddress,
        '-O', lynisReportData.ownerName,
        '-K', lynisReportData.kernelVersion || 'Unknown',
        '-C', lynisReportData.companyName || ''
      ];

      // Use pre-computed AI cache if available
      if (options.aiCachePath && fs.existsSync(options.aiCachePath)) {
        args.push('--ai-cache', options.aiCachePath);
        console.log(`[PDF-GEN] Using pre-computed AI cache: ${options.aiCachePath}`);
      }

      return await new Promise((resolve, reject) => {
        const python = spawn(pythonExecutable, args, {
          env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
        });

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
      console.error('[PDF-GEN] Error generating PDF report:', error);
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
    const outputDir = options.outputDir || this.reportsDir;
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
   * Generate PDF report from Windows audit output
   */
  async generateWindowsPDFReport(
    reportData: LynisReportData,
    windowsOutputContent: string,
    options: GenerateReportOptions = {}
  ): Promise<string> {
    try {
      const depsOk = await this.checkDependencies();
      if (!depsOk) {
        throw new Error('Required dependencies not installed');
      }

      const tempOutputFile = await this.saveTempWindowsOutputFile(windowsOutputContent);

      const outputDir = options.outputDir || this.reportsDir;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(
        outputDir,
        `audit_report_${reportData.reportId}_${Date.now()}.pdf`
      );

      const pythonExecutable = this.getPythonExecutable();

      console.log(`[PDF-GEN] Generating Windows PDF report: ${outputFile}`);

      const args = [
        this.windowsPythonScriptPath,
        tempOutputFile,
        '-o', outputFile,
        '-H', reportData.hostname,
        '-I', reportData.ipAddress,
        '-O', reportData.ownerName,
        '-K', reportData.kernelVersion || 'Unknown',
        '-C', reportData.companyName || '',
      ];

      // Use pre-computed AI cache if available
      if (options.aiCachePath && fs.existsSync(options.aiCachePath)) {
        args.push('--ai-cache', options.aiCachePath);
        console.log(`[PDF-GEN] Using pre-computed AI cache: ${options.aiCachePath}`);
      }

      return await new Promise((resolve, reject) => {
        const python = spawn(pythonExecutable, args, {
          env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
        });

        let stderr = '';

        python.stdout?.on('data', (data) => {
          console.log(data.toString());
        });

        python.stderr?.on('data', (data) => {
          stderr += data.toString();
          console.error(data.toString());
        });

        python.on('close', (code) => {
          fs.unlink(tempOutputFile, () => {});
          if (code !== 0) {
            reject(new Error(`Windows Python script failed: ${stderr}`));
          } else {
            resolve(outputFile);
          }
        });

        python.on('error', (err) => {
          fs.unlink(tempOutputFile, () => {});
          reject(err);
        });
      });
    } catch (error) {
      console.error('[PDF-GEN] Error generating Windows PDF report:', error);
      throw error;
    }
  }

  /**
   * Background PDF pre-generation pipeline:
   * 1. Run AI enrichment (chunked for large datasets)
   * 2. Generate PDF using cached AI results
   * 3. Store result in database
   *
   * This runs asynchronously after report submission, so the PDF is ready
   * when the user clicks Download.
   */
  async backgroundGeneratePDF(
    reportData: LynisReportData,
    isWindows: boolean,
    windowsOutputContent: string,
    onStatusUpdate: (status: string, pdfPath?: string, error?: string) => Promise<void>
  ): Promise<void> {
    let aiCachePath: string | undefined;

    try {
      // Step 1: Update status to processing
      await onStatusUpdate('processing');
      console.log(`[BG-PDF] Starting background PDF generation for ${reportData.reportId}`);

      // Step 2: Run AI enrichment
      console.log(`[BG-PDF] Step 1/2: AI enrichment...`);
      try {
        aiCachePath = await this.runAiEnrichment(reportData, isWindows);
        console.log(`[BG-PDF] AI enrichment complete, cache at: ${aiCachePath}`);
      } catch (aiErr) {
        console.warn(`[BG-PDF] AI enrichment failed, proceeding without AI: ${aiErr}`);
        // Continue — PDF will be generated with raw scan data only
      }

      // Step 3: Generate PDF with AI cache
      console.log(`[BG-PDF] Step 2/2: Generating PDF...`);
      const outputDir = this.reportsDir;
      const options: GenerateReportOptions = { outputDir, aiCachePath };

      let pdfPath: string;
      if (isWindows) {
        pdfPath = await this.generateWindowsPDFReport(
          reportData, windowsOutputContent, options
        );
      } else {
        pdfPath = await this.generatePDFReport(reportData, options);
      }

      console.log(`[BG-PDF] PDF generated successfully: ${pdfPath}`);

      // Step 4: Update status to completed
      await onStatusUpdate('completed', pdfPath);

      // Cleanup AI cache file
      if (aiCachePath && fs.existsSync(aiCachePath)) {
        fs.unlink(aiCachePath, () => {});
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[BG-PDF] PDF generation failed: ${errMsg}`);
      await onStatusUpdate('failed', undefined, errMsg);

      if (aiCachePath && fs.existsSync(aiCachePath)) {
        fs.unlink(aiCachePath, () => {});
      }
    }
  }

  /**
   * Check if a pre-generated PDF exists and is valid
   */
  isPdfReady(pdfFilePath: string | undefined | null): boolean {
    if (!pdfFilePath) return false;
    try {
      const stat = fs.statSync(pdfFilePath);
      return stat.isFile() && stat.size > 0;
    } catch {
      return false;
    }
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

        <h2>3. Detailed Findings</h2>
        <p>Please refer to the complete PDF report for detailed findings, analysis, and recommendations.</p>

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
