import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import authenticate from '../middleware/auth';
import { Company } from '../models/Company';
import { InstallationPackage } from '../models/InstallationPackage';
import { OSAuditMachine } from '../models/OSAuditMachine';
import { OSAuditReport } from '../models/OSAuditReport';
import { logActivity } from '../utils/activityLogger';

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
    const { name, companyType, country, industry, sector, phone, email, address, website, contactPerson, notes, managedEndpointSecurity, licenseCount, companyStatus, paymentPlan } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required'
      });
    }

    const existing = await Company.findOne({ name: name.trim(), owner: userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A company with this name already exists'
      });
    }

    const plan = paymentPlan || 'Monthly';
    const company = new Company({
      name: name.trim(),
      companyType: companyType || 'Customer',
      country: country?.trim() || '',
      industry: industry?.trim() || '',
      sector: sector?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      website: website?.trim() || '',
      contactPerson: contactPerson?.trim() || '',
      notes: notes?.trim() || '',
      managedEndpointSecurity: managedEndpointSecurity !== undefined ? managedEndpointSecurity : true,
      licenseCount: licenseCount || 1,
      companyStatus: companyStatus || 'Active',
      paymentPlan: plan,
      productName: plan === 'Yearly' ? 'Yearly Subscription' : 'Monthly Subscription',
      expiryDate: 'Never',
      owner: userId
    });

    const saved = await company.save();

    await logActivity(
      userId, 'settings_change', 'Created new company',
      'Assessment',
      `Company: ${saved.name}, Type: ${saved.companyType || 'N/A'}`,
      'success', { companyId: saved._id, companyName: saved.name }, req
    );

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
        { companyType: { $regex: search, $options: 'i' } },
        { sector: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query).sort({ createdAt: -1 });

    // Get device counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const deviceCount = await OSAuditMachine.countDocuments({ companyName: company.name, owner: userId });
        const activeDevices = await OSAuditMachine.countDocuments({ companyName: company.name, owner: userId, agentStatus: 'active' });
        const packageCount = await InstallationPackage.countDocuments({ company: company._id, owner: userId });
        const licenses = company.licenseCount || 0;
        const usedSeats = deviceCount;
        const availableSeats = Math.max(0, licenses - usedSeats);
        return {
          ...company.toObject(),
          deviceCount,
          activeDevices,
          packageCount,
          totalSeats: licenses,
          usedSeats,
          availableSeats
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
    const { name, companyType, country, industry, sector, phone, email, address, website, contactPerson, notes, managedEndpointSecurity, licenseCount, companyStatus, paymentPlan } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (companyType !== undefined) updateData.companyType = companyType;
    if (country !== undefined) updateData.country = country;
    if (industry !== undefined) updateData.industry = industry;
    if (sector !== undefined) updateData.sector = sector;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (website !== undefined) updateData.website = website;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (notes !== undefined) updateData.notes = notes;
    if (managedEndpointSecurity !== undefined) updateData.managedEndpointSecurity = managedEndpointSecurity;
    if (licenseCount !== undefined) updateData.licenseCount = licenseCount;
    if (companyStatus !== undefined) updateData.companyStatus = companyStatus;
    if (paymentPlan !== undefined) {
      updateData.paymentPlan = paymentPlan;
      updateData.productName = paymentPlan === 'Yearly' ? 'Yearly Subscription' : 'Monthly Subscription';
    }
    updateData.expiryDate = 'Never';

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { $set: updateData },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    await logActivity(
      userId, 'settings_change', 'Updated company details',
      'Assessment',
      `Company: ${company.name}`,
      'success', { companyId: company._id, companyName: company.name }, req
    );

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

    // Find machines belonging to this company
    const machines = await OSAuditMachine.find({ companyName: company.name, owner: userId });
    const machineIds = machines.map(m => m._id);

    // Delete all reports for those machines
    if (machineIds.length > 0) {
      await OSAuditReport.deleteMany({ machine: { $in: machineIds } });
    }

    // Delete all machines for this company
    await OSAuditMachine.deleteMany({ companyName: company.name, owner: userId });

    // Delete associated packages
    await InstallationPackage.deleteMany({ company: company._id });

    await Company.deleteOne({ _id: company._id });

    await logActivity(
      userId, 'other', 'Deleted company and all associated data',
      'Assessment',
      `Company: ${company.name} (${machineIds.length} devices, associated reports and packages removed)`,
      'success', { companyId: company._id, companyName: company.name, devicesDeleted: machineIds.length }, req
    );

    res.json({ success: true, message: 'Company, packages, devices, and reports deleted' });
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

    await logActivity(
      userId, 'other', 'Soft-deleted network device',
      'Assessment',
      `Device: ${machine.machineName} (${machine.ipAddress}), Company: ${machine.companyName || 'N/A'}`,
      'success', { machineId: machine._id, machineName: machine.machineName }, req
    );

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

    await logActivity(
      userId, 'other', 'Restored deleted network device',
      'Assessment',
      `Device: ${machine.machineName} (${machine.ipAddress}), Company: ${machine.companyName || 'N/A'}`,
      'success', { machineId: machine._id, machineName: machine.machineName }, req
    );

    res.json({ success: true, message: 'Device restored', machine });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route DELETE /api/v1/os-audit/network/devices/:machineId
 * @desc Permanently delete a device and its reports
 */
router.delete('/network/devices/:machineId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const machine = await OSAuditMachine.findOne({ _id: req.params.machineId, owner: userId });

    if (!machine) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    // Delete all reports for this machine
    await OSAuditReport.deleteMany({ machine: machine._id });

    // Delete the machine
    await OSAuditMachine.deleteOne({ _id: machine._id });

    await logActivity(
      userId, 'other', 'Permanently deleted network device',
      'Assessment',
      `Device: ${machine.machineName} (${machine.ipAddress}), Company: ${machine.companyName || 'N/A'}`,
      'success', { machineId: machine._id, machineName: machine.machineName }, req
    );

    res.json({ success: true, message: 'Device and reports permanently deleted' });
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

    await logActivity(
      userId, 'settings_change', 'Created installation package',
      'Assessment',
      `Package: ${saved.name}, OS: ${saved.osType}, Company: ${company.name}`,
      'success', { packageId: saved.packageId, packageName: saved.name, companyName: company.name }, req
    );

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
    const pkg = await InstallationPackage.findOne({ _id: req.params.id, owner: userId });

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Find machines created from this package (matching agentToken)
    const machines = await OSAuditMachine.find({ agentInstallationToken: pkg.agentToken });
    const machineIds = machines.map(m => m._id);

    // Delete all reports for those machines
    if (machineIds.length > 0) {
      await OSAuditReport.deleteMany({ machine: { $in: machineIds } });
    }

    // Delete the machines
    await OSAuditMachine.deleteMany({ agentInstallationToken: pkg.agentToken });

    // Delete the package
    await InstallationPackage.deleteOne({ _id: pkg._id });

    await logActivity(
      userId, 'other', 'Deleted installation package',
      'Assessment',
      `Package: ${pkg.name} (${machineIds.length} devices and associated reports removed)`,
      'success', { packageId: pkg.packageId, packageName: pkg.name, devicesDeleted: machineIds.length }, req
    );

    res.json({ success: true, message: 'Package, devices, and reports deleted' });
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

    await logActivity(
      userId, 'export', 'Downloaded agent installation script',
      'Assessment',
      `Package: ${pkg.name}, OS: ${pkg.osType}, Company: ${companyName}`,
      'success', { packageId: pkg.packageId, packageName: pkg.name, osType: pkg.osType }, req
    );

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
