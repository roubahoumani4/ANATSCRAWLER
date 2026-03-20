import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authenticate from '../middleware/auth';
import { OSAuditMachine, IOSAuditMachine } from '../models/OSAuditMachine';
import { OSAuditReport, IOSAuditReport } from '../models/OSAuditReport';
import { InstallationPackage } from '../models/InstallationPackage';
import AuditReportGenerator from '../services/auditReportGenerator';

const router = Router();

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * @route POST /api/v1/os-audit/machines/register
 * @desc Register a new machine for OS audit
 * @access Private - Requires authentication
 */
router.post('/machines/register', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineName, ipAddress, ownerName, operatingSystem, machineHostname, osType, companyName } = req.body;
    const userId = req.user?._id || req.user?.id;

    // Validation
    if (!ownerName) {
      return res.status(400).json({
        success: false,
        error: 'ownerName is required'
      });
    }

    // Check if machine already exists for this IP (skip placeholder IPs)
    if (ipAddress && ipAddress !== '0.0.0.0') {
      const existingMachine = await OSAuditMachine.findOne({
        ipAddress,
        owner: userId
      });

      if (existingMachine) {
        return res.status(409).json({
          success: false,
          error: 'Machine with this IP address already registered'
        });
      }
    }

    // Create new machine
    const machineId = uuidv4();
    const agentInstallationToken = uuidv4();

    const newMachine = new OSAuditMachine({
      machineId,
      owner: userId,
      ownerName,
      machineName: machineName || 'Pending Agent Audit',
      machineHostname: machineHostname || '',
      ipAddress: ipAddress || '0.0.0.0',
      operatingSystem: operatingSystem || '',
      companyName: companyName || '',
      osType: osType === 'windows' ? 'windows' : 'linux',
      agentInstallationToken,
      agentStatus: 'pending'
    });

    const savedMachine = await newMachine.save();

    console.log('✅ Machine registered:');
    console.log('  Machine ID:', savedMachine.machineId);
    console.log('  Token:', savedMachine.agentInstallationToken);
    console.log('  Name:', savedMachine.machineName);
    console.log('  Owner ID:', savedMachine.owner);

    res.status(201).json({
      success: true,
      message: 'Machine registered successfully',
      machine: savedMachine,
      agentInstallationToken
    });
  } catch (error: any) {
    console.error('Error registering machine:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register machine'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/machines
 * @desc Get all machines for the authenticated user
 * @access Private - Requires authentication
 */
router.get('/machines', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const machines = await OSAuditMachine.find({ owner: userId })
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      machines
    });
  } catch (error: any) {
    console.error('Error fetching machines:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch machines'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/machines/:machineId
 * @desc Get a specific machine details
 * @access Private - Requires authentication
 */
router.get('/machines/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const machine = await OSAuditMachine.findOne({
      _id: machineId,
      owner: userId
    });

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    res.json({
      success: true,
      machine
    });
  } catch (error: any) {
    console.error('Error fetching machine:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch machine'
    });
  }
});

/**
 * @route PUT /api/v1/os-audit/machines/:machineId
 * @desc Update machine details
 * @access Private - Requires authentication
 */
router.put('/machines/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?._id || req.user?.id;
    const { machineName, ownerName, operatingSystem, machineHostname, osType } = req.body;

    const machine = await OSAuditMachine.findOneAndUpdate(
      { _id: machineId, owner: userId },
      {
        $set: {
          machineName,
          ownerName,
          operatingSystem,
          machineHostname,
          osType,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine updated successfully',
      machine
    });
  } catch (error: any) {
    console.error('Error updating machine:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update machine'
    });
  }
});

/**
 * @route DELETE /api/v1/os-audit/machines/:machineId
 * @desc Delete a machine registration
 * @access Private - Requires authentication
 */
router.delete('/machines/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const result = await OSAuditMachine.deleteOne({
      _id: machineId,
      owner: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    // Also delete all associated reports
    await OSAuditReport.deleteMany({
      machine: machineId
    });

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting machine:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete machine'
    });
  }
});

/**
 * @route POST /api/v1/os-audit/reports
 * @desc Submit an audit report from the agent
 * @access Public (with token validation)
 */
router.post('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      agentInstallationToken, 
      machineName, 
      ipAddress, 
      ownerName,
      companyName,
      auditData 
    } = req.body;

    // Validate token
    if (!agentInstallationToken) {
      return res.status(400).json({
        success: false,
        error: 'Agent installation token is required'
      });
    }

    // Log incoming token for debugging
    console.log('🔍 Audit report submission:');
    console.log('  Token received:', agentInstallationToken);
    console.log('  Token type:', typeof agentInstallationToken);
    console.log('  Token length:', agentInstallationToken.length);
    console.log('  Machine name:', machineName);
    console.log('  IP address:', ipAddress);

    // Find machine by token + machineName to uniquely identify each machine
    // This allows multiple machines to share the same package token
    const trimmedToken = String(agentInstallationToken).trim();
    let machine: any = null;

    if (machineName) {
      machine = await OSAuditMachine.findOne({
        agentInstallationToken: trimmedToken,
        machineName: machineName
      });
    }

    // Also try matching by token + IP if machineName didn't match
    if (!machine && ipAddress && ipAddress !== '0.0.0.0') {
      machine = await OSAuditMachine.findOne({
        agentInstallationToken: trimmedToken,
        ipAddress: ipAddress
      });
    }

    // If still not found, check if this token is from an InstallationPackage
    // and auto-register a new machine (allows unlimited machines per company)
    if (!machine) {
      console.log('🔍 Checking InstallationPackage for token...');
      const pkg = await InstallationPackage.findOne({
        agentToken: String(agentInstallationToken).trim()
      }).populate('company');

      if (pkg) {
        console.log('✅ Found InstallationPackage:', pkg.name);
        const pkgCompanyName = (pkg.company as any)?.name || companyName || '';
        const newMachineId = uuidv4();
        const newAgentToken = String(agentInstallationToken).trim();

        const newMachine = new OSAuditMachine({
          machineId: newMachineId,
          owner: pkg.owner,
          ownerName: ownerName || 'Agent',
          machineName: machineName || 'Pending Agent Audit',
          machineHostname: auditData?.hostname || machineName || '',
          ipAddress: ipAddress || '0.0.0.0',
          operatingSystem: auditData?.operatingSystem || '',
          companyName: pkgCompanyName,
          osType: pkg.osType || 'linux',
          agentInstallationToken: newAgentToken,
          agentStatus: 'active',
          agentInstalledDate: new Date()
        });

        machine = await newMachine.save();
        console.log('✅ Auto-registered machine:', machine.machineName, 'for company:', pkgCompanyName);

        // Increment download count
        await InstallationPackage.updateOne({ _id: pkg._id }, { $inc: { downloadCount: 1 } });
      }
    }

    if (!machine) {
      // Log all registered tokens for debugging
      const allMachines = await OSAuditMachine.find({}).select('machineId agentInstallationToken machineName');
      console.error('❌ Machine not found with token:', agentInstallationToken);
      console.log('📋 Registered machines in database:');
      allMachines.forEach(m => {
        console.log(`   - ${m.machineName}: token="${m.agentInstallationToken}" (length=${m.agentInstallationToken?.length})`);
      });

      // Check if token exists at all in any field
      const tokenExists = allMachines.some(m => m.agentInstallationToken === agentInstallationToken);
      console.log(`   Token exists in database: ${tokenExists}`);

      return res.status(404).json({
        success: false,
        error: 'Invalid agent installation token',
        debug: process.env.NODE_ENV === 'development' ? { 
          tokenReceived: agentInstallationToken,
          registeredCount: allMachines.length 
        } : undefined
      });
    }

    console.log('✅ Machine found:', machine.machineName);

    // Update machine with agent-collected system info
    if (machineName && machineName !== 'Pending Agent Audit') {
      machine.machineName = machineName;
    }
    if (ipAddress && ipAddress !== '0.0.0.0') {
      machine.ipAddress = ipAddress;
    }
    if (auditData?.operatingSystem) {
      machine.operatingSystem = auditData.operatingSystem;
    }
    if (auditData?.hostname) {
      machine.machineHostname = auditData.hostname;
    }
    if (machine.agentStatus !== 'active') {
      machine.agentStatus = 'active';
      machine.agentInstalledDate = new Date();
    }
    await machine.save();

    // Validate audit data
    if (!auditData) {
      return res.status(400).json({
        success: false,
        error: 'auditData is required'
      });
    }

    // Parse score to ensure it's a valid number
    let auditScore = 0;
    if (auditData.auditScore !== undefined && auditData.auditScore !== null) {
      const score = parseInt(String(auditData.auditScore), 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        auditScore = score;
      }
    }

    // Parse warnings and suggestions
    const warnings = parseInt(String(auditData.warnings || 0), 10) || 0;
    const suggestions = parseInt(String(auditData.suggestions || 0), 10) || 0;

    // Create audit report
    const reportId = `report_${uuidv4()}`;

    const newReport = new OSAuditReport({
      reportId,
      machine: machine._id,
      owner: machine.owner,
      machineName: machineName || machine.machineName,
      ipAddress: ipAddress || machine.ipAddress,
      ownerName: machine.ownerName,
      companyName: machine.companyName || '',
      hostname: auditData?.hostname || machineName || machine.machineName,
      kernelVersion: auditData?.kernelVersion || 'Unknown',
      operatingSystem: auditData?.operatingSystem || 'Unknown',
      osType: machine.osType || 'linux',
      auditScore: auditScore,
      warnings: warnings,
      suggestions: suggestions,
      systemHardening: auditScore,
      findings: auditData?.findings || [],
      sections: auditData?.sections || {},
      rawReport: auditData?.rawReport || '',
      lynisLogFile: auditData?.lynisLogFile || '/var/log/lynis.log',
      lynisReportFile: auditData?.lynisReportFile || '/var/log/lynis-report.dat',
      logFileContent: auditData?.logFileContent || '',
      reportFileContent: auditData?.reportFileContent || '',
      status: 'completed',
      lynisVersion: auditData?.lynisVersion || 'unknown',
      auditDuration: parseInt(String(auditData?.auditDuration || 0), 10) || 0
    });

    const savedReport = await newReport.save();

    // Update machine with last audit date
    machine.lastAuditDate = new Date();
    await machine.save();

    // --- Background PDF pre-generation ---
    // Fire-and-forget: AI enrichment → PDF generation runs asynchronously
    // so the PDF is ready when the user clicks "Download PDF"
    const isWindows = (machine.osType === 'windows');
    const reportDataForPdf = {
      reportId: savedReport.reportId,
      hostname: savedReport.hostname || savedReport.machineName,
      ipAddress: savedReport.ipAddress,
      ownerName: savedReport.ownerName,
      companyName: (savedReport as any).companyName || '',
      osName: savedReport.operatingSystem || 'Unknown',
      osVersion: 'Unknown',
      kernelVersion: (savedReport as any).kernelVersion || 'Unknown',
      auditDate: savedReport.auditDate,
      logFileContent: savedReport.logFileContent || '',
      reportFileContent: savedReport.reportFileContent || ''
    };
    const windowsContent = isWindows
      ? (savedReport.reportFileContent || savedReport.logFileContent || (savedReport as any).rawReport || '')
      : '';

    const generator = new AuditReportGenerator();
    generator.backgroundGeneratePDF(
      reportDataForPdf,
      isWindows,
      windowsContent,
      async (status: string, pdfPath?: string, error?: string) => {
        try {
          const update: any = { pdfGenerationStatus: status };
          if (pdfPath) update.pdfFilePath = pdfPath;
          if (error) update.pdfGenerationError = error;
          await OSAuditReport.updateOne(
            { reportId: savedReport.reportId },
            { $set: update }
          );
          console.log(`[BG-PDF] Report ${savedReport.reportId} status → ${status}`);
        } catch (dbErr) {
          console.error(`[BG-PDF] Failed to update report status: ${dbErr}`);
        }
      }
    ).catch((err) => {
      console.error(`[BG-PDF] Unhandled error for ${savedReport.reportId}:`, err);
    });

    res.status(201).json({
      success: true,
      message: 'Audit report submitted successfully',
      report: savedReport
    });
  } catch (error: any) {
    console.error('Error submitting audit report:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body keys:', Object.keys(req.body));
    console.error('auditData keys:', Object.keys(req.body?.auditData || {}));
    console.error('Request body size:', JSON.stringify(req.body).length, 'bytes');
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit audit report',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports/:machineId
 * @desc Get all audit reports for a specific machine
 * @access Private - Requires authentication
 */
router.get('/reports/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Verify machine belongs to user
    const machine = await OSAuditMachine.findOne({
      _id: machineId,
      owner: userId
    });

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    const reports = await OSAuditReport.find({ machine: machineId })
      .sort({ auditDate: -1 });

    res.json({
      success: true,
      reports,
      machineInfo: {
        machineName: machine.machineName,
        ipAddress: machine.ipAddress,
        ownerName: machine.ownerName
      }
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports/latest/:machineId
 * @desc Get the latest audit report for a machine
 * @access Private - Requires authentication
 */
router.get('/reports/latest/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { machineId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Verify machine belongs to user
    const machine = await OSAuditMachine.findOne({
      _id: machineId,
      owner: userId
    });

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    const report = await OSAuditReport.findOne({ machine: machineId })
      .sort({ auditDate: -1 });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'No reports found for this machine'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('Error fetching latest report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports/details/:reportId
 * @desc Get a specific audit report details
 * @access Private - Requires authentication
 */
router.get('/reports/details/:reportId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const report = await OSAuditReport.findOne({
      _id: reportId,
      owner: userId
    }).populate('machine');

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
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch report'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports
 * @desc Get all audit reports for the authenticated user
 * @access Private - Requires authentication
 */
router.get('/reports', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const reports = await OSAuditReport.find({ owner: userId })
      .sort({ auditDate: -1 })
      .limit(limit)
      .skip(offset)
      .populate('machine', 'machineName ipAddress ownerName');

    const total = await OSAuditReport.countDocuments({ owner: userId });

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

/**
 * @route POST /api/v1/os-audit/agent/heartbeat
 * @desc Agent heartbeat to confirm it's active
 * @access Public (with token validation)
 */
router.post('/agent/heartbeat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentInstallationToken } = req.body;

    if (!agentInstallationToken) {
      return res.status(400).json({
        success: false,
        error: 'Agent installation token is required'
      });
    }

    // Try to find machine with expanded logging
    let machine = await OSAuditMachine.findOne({
      agentInstallationToken: agentInstallationToken
    });

    if (!machine) {
      machine = await OSAuditMachine.findOne({
        agentInstallationToken: String(agentInstallationToken).trim()
      });
    }

    if (!machine) {
      console.error('❌ Heartbeat: Machine not found with token:', agentInstallationToken);
      return res.status(404).json({
        success: false,
        error: 'Invalid agent installation token'
      });
    }

    // Update agent status
    machine.agentStatus = 'active';
    machine.lastAuditDate = new Date();
    await machine.save();

    res.json({
      success: true,
      message: 'Heartbeat received',
      machine: {
        machineId: machine.machineId,
        agentStatus: machine.agentStatus
      }
    });
  } catch (error: any) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process heartbeat'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/stats
 * @desc Get OS audit statistics for the authenticated user
 * @access Private - Requires authentication
 */
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const totalMachines = await OSAuditMachine.countDocuments({ owner: userId });
    const activeMachines = await OSAuditMachine.countDocuments({ 
      owner: userId, 
      agentStatus: 'active' 
    });
    const totalReports = await OSAuditReport.countDocuments({ owner: userId });

    // Get average audit score
    const avgScoreResult = await OSAuditReport.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: null, avgScore: { $avg: '$auditScore' } } }
    ]);

    const averageScore = avgScoreResult[0]?.avgScore || 0;

    // Get latest audit stats
    const latestReports = await OSAuditReport.find({ owner: userId })
      .sort({ auditDate: -1 })
      .limit(10);

    const totalWarnings = latestReports.reduce((sum, r) => sum + (r.warnings || 0), 0);
    const totalSuggestions = latestReports.reduce((sum, r) => sum + (r.suggestions || 0), 0);

    res.json({
      success: true,
      stats: {
        totalMachines,
        activeMachines,
        inactiveMachines: totalMachines - activeMachines,
        totalReports,
        averageAuditScore: Math.round(averageScore * 10) / 10,
        totalWarnings,
        totalSuggestions
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports/:reportId/lynis-log
 * @desc Download the lynis.log file for a report
 * @access Private - Requires authentication
 */
router.get('/reports/:reportId/lynis-log', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Find the report
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

    // Return the log file content
    const fileName = `${report.machineName}_lynis_${report.auditDate.toISOString().split('T')[0]}.log`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(report.logFileContent || '');
  } catch (error: any) {
    console.error('Error downloading lynis log:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download log file'
    });
  }
});

/**
 * @route GET /api/v1/os-audit/reports/:reportId/lynis-report
 * @desc Download the lynis-report.dat file for a report
 * @access Private - Requires authentication
 */
router.get('/reports/:reportId/lynis-report', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Find the report
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

    // Return the report data file
    const fileName = `${report.machineName}_lynis_report_${report.auditDate.toISOString().split('T')[0]}.dat`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(report.reportFileContent || '');
  } catch (error: any) {
    console.error('Error downloading lynis report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download report file'
    });
  }
});

export default router;
