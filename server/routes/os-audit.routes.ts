import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authenticate from '../middleware/auth';
import { OSAuditMachine, IOSAuditMachine } from '../models/OSAuditMachine';
import { OSAuditReport, IOSAuditReport } from '../models/OSAuditReport';

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
    const { machineName, ipAddress, ownerName, operatingSystem, machineHostname } = req.body;
    const userId = req.user?._id || req.user?.id;

    // Validation
    if (!machineName || !ipAddress || !ownerName) {
      return res.status(400).json({
        success: false,
        error: 'machineName, ipAddress, and ownerName are required'
      });
    }

    // Check if machine already exists for this IP
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

    // Create new machine
    const machineId = uuidv4();
    const agentInstallationToken = uuidv4();

    const newMachine = new OSAuditMachine({
      machineId,
      owner: userId,
      ownerName,
      machineName,
      machineHostname,
      ipAddress,
      operatingSystem,
      agentInstallationToken,
      agentStatus: 'pending'
    });

    const savedMachine = await newMachine.save();

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
    const { machineName, ownerName, operatingSystem, machineHostname } = req.body;

    const machine = await OSAuditMachine.findOneAndUpdate(
      { _id: machineId, owner: userId },
      {
        $set: {
          machineName,
          ownerName,
          operatingSystem,
          machineHostname,
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
      auditData 
    } = req.body;

    // Validate token
    if (!agentInstallationToken) {
      return res.status(400).json({
        success: false,
        error: 'Agent installation token is required'
      });
    }

    // Find machine by token
    const machine = await OSAuditMachine.findOne({
      agentInstallationToken
    });

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Invalid agent installation token'
      });
    }

    // Update machine status if not already active
    if (machine.agentStatus !== 'active') {
      machine.agentStatus = 'active';
      machine.agentInstalledDate = new Date();
      await machine.save();
    }

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
      machineName: machine.machineName,
      ipAddress: machine.ipAddress,
      ownerName: machine.ownerName,
      operatingSystem: auditData?.operatingSystem || 'Unknown',
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

    res.status(201).json({
      success: true,
      message: 'Audit report submitted successfully',
      report: savedReport
    });
  } catch (error: any) {
    console.error('Error submitting audit report:', error);
    console.error('Request body:', req.body);
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

    const machine = await OSAuditMachine.findOne({
      agentInstallationToken
    });

    if (!machine) {
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
