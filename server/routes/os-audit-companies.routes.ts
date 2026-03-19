import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authenticate from '../middleware/auth';
import { Company } from '../models/Company';
import { InstallationPackage } from '../models/InstallationPackage';
import { OSAuditMachine } from '../models/OSAuditMachine';
import { OSAuditReport } from '../models/OSAuditReport';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// ==================== COMPANY ROUTES ====================

/**
 * @route POST /api/v1/os-audit/companies
 * @desc Create a new company
 */
router.post('/companies', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, sector, phone, email, address, website, contactPerson, notes } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!name || !sector || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name, sector, phone, and email are required'
      });
    }

    const existing = await Company.findOne({ name: name.trim(), owner: userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A company with this name already exists'
      });
    }

    const company = new Company({
      name: name.trim(),
      sector: sector.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address?.trim() || '',
      website: website?.trim() || '',
      contactPerson: contactPerson?.trim() || '',
      notes: notes?.trim() || '',
      owner: userId
    });

    const saved = await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company: saved
    });
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create company' });
  }
});

/**
 * @route GET /api/v1/os-audit/companies
 * @desc Get all companies for the authenticated user
 */
router.get('/companies', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const search = (req.query.search as string) || '';

    let query: any = { owner: userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sector: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query).sort({ createdAt: -1 });

    // Get device counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const deviceCount = await OSAuditMachine.countDocuments({ companyName: company.name, owner: userId });
        const activeDevices = await OSAuditMachine.countDocuments({ companyName: company.name, owner: userId, agentStatus: 'active' });
        const packageCount = await InstallationPackage.countDocuments({ company: company._id, owner: userId });
        return {
          ...company.toObject(),
          deviceCount,
          activeDevices,
          packageCount
        };
      })
    );

    res.json({ success: true, companies: companiesWithStats });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch companies' });
  }
});

/**
 * @route GET /api/v1/os-audit/companies/:id
 * @desc Get a specific company
 */
router.get('/companies/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const company = await Company.findOne({ _id: req.params.id, owner: userId });

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.json({ success: true, company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route PUT /api/v1/os-audit/companies/:id
 * @desc Update a company
 */
router.put('/companies/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, sector, phone, email, address, website, contactPerson, notes } = req.body;

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { $set: { name, sector, phone, email, address, website, contactPerson, notes, updatedAt: new Date() } },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.json({ success: true, message: 'Company updated', company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route DELETE /api/v1/os-audit/companies/:id
 * @desc Delete a company and its associated packages
 */
router.delete('/companies/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const company = await Company.findOne({ _id: req.params.id, owner: userId });

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Delete associated packages
    await InstallationPackage.deleteMany({ company: company._id });

    await Company.deleteOne({ _id: company._id });

    res.json({ success: true, message: 'Company and associated packages deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== NETWORK ROUTES ====================

/**
 * @route GET /api/v1/os-audit/network/:companyName/devices
 * @desc Get all devices (machines) for a company
 */
router.get('/network/:companyName/devices', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const companyName = decodeURIComponent(req.params.companyName);

    const activeDevices = await OSAuditMachine.find({
      companyName,
      owner: userId,
      isActive: true
    }).sort({ registrationDate: -1 });

    const deletedDevices = await OSAuditMachine.find({
      companyName,
      owner: userId,
      isActive: false
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      activeDevices,
      deletedDevices
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route PUT /api/v1/os-audit/network/devices/:machineId/soft-delete
 * @desc Soft delete a device (mark as inactive) 
 */
router.put('/network/devices/:machineId/soft-delete', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const machine = await OSAuditMachine.findOneAndUpdate(
      { _id: req.params.machineId, owner: userId },
      { $set: { isActive: false, agentStatus: 'inactive', updatedAt: new Date() } },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    res.json({ success: true, message: 'Device moved to deleted', machine });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route PUT /api/v1/os-audit/network/devices/:machineId/restore
 * @desc Restore a soft-deleted device
 */
router.put('/network/devices/:machineId/restore', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const machine = await OSAuditMachine.findOneAndUpdate(
      { _id: req.params.machineId, owner: userId },
      { $set: { isActive: true, agentStatus: 'pending', updatedAt: new Date() } },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    res.json({ success: true, message: 'Device restored', machine });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INSTALLATION PACKAGE ROUTES ====================

/**
 * @route POST /api/v1/os-audit/packages
 * @desc Create a new installation package
 */
router.post('/packages', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, companyId, osType, supportedVersions, description } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!name || !companyId || !osType) {
      return res.status(400).json({
        success: false,
        error: 'Name, companyId, and osType are required'
      });
    }

    // Verify company ownership
    const company = await Company.findOne({ _id: companyId, owner: userId });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const packageId = `pkg_${uuidv4()}`;
    const agentToken = uuidv4();

    const pkg = new InstallationPackage({
      packageId,
      name: name.trim(),
      company: companyId,
      osType,
      supportedVersions: supportedVersions || (osType === 'linux'
        ? ['Ubuntu 20.04+', 'Debian 11+', 'CentOS 8+', 'RHEL 8+', 'Fedora 36+']
        : ['Windows 10', 'Windows 11', 'Windows Server 2019', 'Windows Server 2022']),
      agentToken,
      description: description?.trim() || '',
      owner: userId
    });

    const saved = await pkg.save();

    res.status(201).json({
      success: true,
      message: 'Installation package created',
      package: { ...saved.toObject(), companyName: company.name }
    });
  } catch (error: any) {
    console.error('Error creating package:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/v1/os-audit/packages
 * @desc Get all installation packages
 */
router.get('/packages', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const search = (req.query.search as string) || '';
    const companyId = (req.query.companyId as string) || '';

    let query: any = { owner: userId };
    if (companyId) {
      query.company = companyId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { packageId: { $regex: search, $options: 'i' } }
      ];
    }

    const packages = await InstallationPackage.find(query)
      .populate('company', 'name sector')
      .sort({ createdAt: -1 });

    res.json({ success: true, packages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route DELETE /api/v1/os-audit/packages/:id
 * @desc Delete an installation package
 */
router.delete('/packages/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const result = await InstallationPackage.deleteOne({ _id: req.params.id, owner: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    res.json({ success: true, message: 'Package deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/v1/os-audit/packages/:id/download-script
 * @desc Generate and download the agent script for a package
 */
router.get('/packages/:id/download-script', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const pkg = await InstallationPackage.findOne({ _id: req.params.id, owner: userId }).populate('company', 'name');

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Increment download count
    pkg.downloadCount += 1;
    await pkg.save();

    const companyName = (pkg.company as any)?.name || 'Unknown';

    res.json({
      success: true,
      agentToken: pkg.agentToken,
      osType: pkg.osType,
      packageName: pkg.name,
      companyName,
      packageId: pkg.packageId
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/v1/os-audit/companies-summary
 * @desc Get summary stats for OS Audit dashboard
 */
router.get('/companies-summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const [totalCompanies, totalDevices, activeDevices, inactiveDevices, totalPackages, totalReports] = await Promise.all([
      Company.countDocuments({ owner: userId }),
      OSAuditMachine.countDocuments({ owner: userId }),
      OSAuditMachine.countDocuments({ owner: userId, agentStatus: 'active' }),
      OSAuditMachine.countDocuments({ owner: userId, agentStatus: 'inactive' }),
      InstallationPackage.countDocuments({ owner: userId }),
      OSAuditReport.countDocuments({ owner: userId })
    ]);

    // Get recent companies
    const recentCompanies = await Company.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get companies with device counts
    const companies = await Company.find({ owner: userId });
    const companyDistribution = await Promise.all(
      companies.map(async (c) => {
        const count = await OSAuditMachine.countDocuments({ companyName: c.name, owner: userId });
        return { name: c.name, devices: count };
      })
    );

    res.json({
      success: true,
      summary: {
        totalCompanies,
        totalDevices,
        activeDevices,
        inactiveDevices,
        totalPackages,
        totalReports,
        recentCompanies,
        companyDistribution: companyDistribution.filter(c => c.devices > 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
