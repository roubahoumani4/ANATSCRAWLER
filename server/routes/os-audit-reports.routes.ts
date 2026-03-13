/**
 * OS Audit Report Generation Routes
 * Endpoints for generating PDF audit reports from Lynis scan results
 */

import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import authenticate from '../middleware/auth';
import { OSAuditReport } from '../models/OSAuditReport';
import AuditReportGenerator from '../services/auditReportGenerator';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * @route POST /api/v1/os-audit/reports/generate-pdf/:reportId
 * @desc Generate PDF report from audit results
 * @access Private - Requires authentication
 */
router.post(
  '/reports/generate-pdf/:reportId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?._id || req.user?.id;

      // Find the audit report
      const auditReport = await OSAuditReport.findOne({
        reportId,
        owner: userId
      });

      if (!auditReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      // Generate PDF report
      const generator = new AuditReportGenerator();

      const reportData = {
        reportId: auditReport.reportId,
        hostname: auditReport.machineName,
        ipAddress: auditReport.ipAddress,
        ownerName: auditReport.ownerName,
        osName: auditReport.operatingSystem || 'Unknown',
        osVersion: 'Unknown',
        kernelVersion: 'Unknown',
        auditDate: auditReport.auditDate,
        logFileContent: auditReport.logFileContent || '',
        reportFileContent: auditReport.reportFileContent || ''
      };

      const outputDir = path.join(__dirname, '..', 'reports');
      const pdfPath = await generator.generatePDFReport(reportData, {
        outputDir
      });

      // Return PDF file
      res.download(pdfPath, `audit_report_${reportId}.pdf`, (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
        }
        // Optionally cleanup file after download
        // fs.unlink(pdfPath, () => {});
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route POST /api/v1/os-audit/reports/generate-html/:reportId
 * @desc Generate HTML report from audit results
 * @access Private - Requires authentication
 */
router.post(
  '/reports/generate-html/:reportId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?._id || req.user?.id;

      // Find the audit report
      const auditReport = await OSAuditReport.findOne({
        reportId,
        owner: userId
      });

      if (!auditReport) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      // Generate HTML report
      const generator = new AuditReportGenerator();

      const reportData = {
        reportId: auditReport.reportId,
        hostname: auditReport.machineName,
        ipAddress: auditReport.ipAddress,
        ownerName: auditReport.ownerName,
        osName: auditReport.operatingSystem || 'Unknown',
        osVersion: 'Unknown',
        kernelVersion: 'Unknown',
        auditDate: auditReport.auditDate,
        logFileContent: auditReport.logFileContent || '',
        reportFileContent: auditReport.reportFileContent || ''
      };

      const outputDir = path.join(__dirname, '..', 'reports');
      const htmlPath = await generator.generateHTMLReport(reportData, {
        outputDir
      });

      // Return HTML file
      res.download(htmlPath, `audit_report_${reportId}.html`);
    } catch (error) {
      console.error('Error generating HTML report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate HTML report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route GET /api/v1/os-audit/reports/list
 * @desc List all available audit reports for user
 * @access Private - Requires authentication
 */
router.get(
  '/reports/list',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?._id || req.user?.id;

      const reports = await OSAuditReport.find({ owner: userId })
        .sort({ auditDate: -1 })
        .select('reportId machineName ipAddress auditDate auditScore')
        .limit(100);

      res.json({
        success: true,
        count: reports.length,
        reports
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reports'
      });
    }
  }
);

/**
 * @route GET /api/v1/os-audit/reports/:reportId
 * @desc Get specific audit report details
 * @access Private - Requires authentication
 */
router.get(
  '/reports/:reportId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reportId } = req.params;
      const userId = req.user?._id || req.user?.id;

      const report = await OSAuditReport.findOne({
        reportId,
        owner: userId
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      res.json({
        success: true,
        report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve report'
      });
    }
  }
);

/**
 * @route POST /api/v1/os-audit/reports/bulk-generate
 * @desc Generate PDF reports for multiple audit results
 * @access Private - Requires authentication
 */
router.post(
  '/reports/bulk-generate',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reportIds } = req.body;
      const userId = req.user?._id || req.user?.id;

      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'reportIds array is required'
        });
      }

      const reports = await OSAuditReport.find({
        reportId: { $in: reportIds },
        owner: userId
      });

      if (reports.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No matching reports found'
        });
      }

      const generator = new AuditReportGenerator();
      const outputDir = path.join(__dirname, '..', 'reports');
      const generatedReports: Array<{reportId: string; machineName: string; pdfPath: string; size: number}> = [];

      for (const auditReport of reports) {
        try {
          const reportData = {
            reportId: auditReport.reportId,
            hostname: auditReport.machineName,
            ipAddress: auditReport.ipAddress,
            ownerName: auditReport.ownerName,
            osName: auditReport.operatingSystem || 'Unknown',
            osVersion: 'Unknown',
            kernelVersion: 'Unknown',
            auditDate: auditReport.auditDate,
            logFileContent: auditReport.logFileContent || '',
            reportFileContent: auditReport.reportFileContent || ''
          };

          const pdfPath = await generator.generatePDFReport(reportData, {
            outputDir
          });

          generatedReports.push({
            reportId: auditReport.reportId,
            machineName: auditReport.machineName,
            pdfPath,
            size: fs.statSync(pdfPath).size
          });
        } catch (error) {
          console.error(`Error generating PDF for ${auditReport.reportId}:`, error);
        }
      }

      res.json({
        success: true,
        generated: generatedReports.length,
        reports: generatedReports
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate reports'
      });
    }
  }
);

export default router;
