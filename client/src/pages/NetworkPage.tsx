import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Building2,
  Server,
  Wifi,
  WifiOff,
  Trash2,
  RotateCcw,
  Search,
  Shield,
  Monitor,
  ChevronDown,
  ChevronRight,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface Company {
  _id: string;
  name: string;
  sector: string;
  deviceCount?: number;
  activeDevices?: number;
}

interface Report {
  _id: string;
  reportId: string;
  machineName: string;
  ipAddress: string;
  ownerName: string;
  companyName?: string;
  operatingSystem?: string;
  auditScore: number;
  warnings: number;
  suggestions: number;
  auditDate: string;
  pdfGenerationStatus?: string;
  pdfFilePath?: string;
}

interface Device {
  _id: string;
  machineId: string;
  machineName: string;
  machineHostname?: string;
  ipAddress: string;
  ownerName: string;
  companyName?: string;
  operatingSystem?: string;
  osType?: string;
  agentStatus: 'active' | 'inactive' | 'pending';
  lastAuditDate?: string;
  registrationDate: string;
  isActive: boolean;
}

const NetworkPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeDevices, setActiveDevices] = useState<Device[]>([]);
  const [deletedDevices, setDeletedDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceDetail, setShowDeviceDetail] = useState(false);
  const [deviceReports, setDeviceReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/os-audit/companies`, {
        params: { search: searchQuery },
        withCredentials: true
      });
      setCompanies(res.data.companies || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDevices = async (companyName: string) => {
    try {
      setLoadingDevices(true);
      const res = await axios.get(`/api/v1/os-audit/network/${encodeURIComponent(companyName)}/devices`, {
        withCredentials: true
      });
      setActiveDevices(res.data.activeDevices || []);
      setDeletedDevices(res.data.deletedDevices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    fetchDevices(company.name);
  };

  const handleSoftDelete = async (deviceId: string) => {
    if (!window.confirm("Move this device to deleted devices?")) return;
    try {
      await axios.put(`/api/v1/os-audit/network/devices/${deviceId}/soft-delete`, {}, { withCredentials: true });
      if (selectedCompany) fetchDevices(selectedCompany.name);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete device");
    }
  };

  const handleRestore = async (deviceId: string) => {
    try {
      await axios.put(`/api/v1/os-audit/network/devices/${deviceId}/restore`, {}, { withCredentials: true });
      if (selectedCompany) fetchDevices(selectedCompany.name);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to restore device");
    }
  };

  const fetchReports = async (machineId: string) => {
    try {
      setLoadingReports(true);
      const res = await axios.get(`/api/v1/os-audit/reports/${machineId}`, { withCredentials: true });
      setDeviceReports(res.data.reports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setDeviceReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDownloadPdf = async (reportId: string) => {
    try {
      setDownloadingPdf(reportId);
      const res = await axios.post(`/api/v1/os-audit/reports/generate-pdf/${reportId}`, {}, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      if (error.response?.status === 202) {
        alert("PDF is still being generated. Please try again shortly.");
      } else {
        alert("Failed to download PDF report");
      }
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleViewDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowDeviceDetail(true);
    fetchReports(device._id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="text-emerald-400" size={16} />;
      case 'inactive': return <XCircle className="text-red-400" size={16} />;
      default: return <Clock className="text-yellow-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'inactive': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    }
  };

  const DeviceCard = ({ device, isDeleted = false }: { device: Device; isDeleted?: boolean }) => (
    <motion.div
      variants={fadeIn}
      className={`bg-gray-900/60 rounded-xl border ${isDeleted ? 'border-red-800/50' : 'border-gray-800'} p-5 hover:border-cyan-400/30 transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${device.osType === 'windows' ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
            <Monitor className={device.osType === 'windows' ? 'text-blue-400' : 'text-orange-400'} size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{device.machineName}</h4>
            <p className="text-xs text-gray-500">{device.machineHostname || device.machineId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(device.agentStatus)}`}>
            {getStatusIcon(device.agentStatus)} {device.agentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500 text-xs">IP Address</span>
          <p className="text-gray-300 font-mono">{device.ipAddress}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">OS</span>
          <p className="text-gray-300">{device.operatingSystem || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Owner</span>
          <p className="text-gray-300">{device.ownerName}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Last Audit</span>
          <p className="text-gray-300">{device.lastAuditDate ? new Date(device.lastAuditDate).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-800">
        <Button variant="outline" size="sm"
          onClick={() => handleViewDevice(device)}
          className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1">
          <Eye size={14} className="mr-1" /> Details
        </Button>
        {!isDeleted && device.lastAuditDate && (
          <Button variant="outline" size="sm"
            onClick={() => fetchReports(device._id).then(() => {
              if (deviceReports.length > 0) handleDownloadPdf(deviceReports[0].reportId);
              else handleViewDevice(device);
            })}
            className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30">
            <Download size={14} className="mr-1" /> PDF
          </Button>
        )}
        {isDeleted ? (
          <Button variant="outline" size="sm" onClick={() => handleRestore(device._id)}
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30">
            <RotateCcw size={14} className="mr-1" /> Restore
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => handleSoftDelete(device._id)}
            className="border-red-600 text-red-400 hover:bg-red-900/30">
            <Trash2 size={14} className="mr-1" /> Remove
          </Button>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-jetBlack flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coolWhite/10 border-t-crimsonRed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coolWhite/60">Loading network...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-jetBlack text-coolWhite p-6">
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Network className="text-cyan-400" size={36} />
          Network Devices
        </h1>
        <p className="text-gray-400 mt-2">View and manage devices across all companies</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Companies Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="text-cyan-400" size={20} />
              Companies
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-coolWhite text-sm placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
              {companies.map((company) => (
                <button
                  key={company._id}
                  onClick={() => handleSelectCompany(company)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedCompany?._id === company._id
                      ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/50'
                      : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-white">{company.name}</div>
                      <div className="text-xs text-gray-500">{company.sector}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{company.deviceCount || 0}</span>
                      <Server size={14} className="text-gray-500" />
                    </div>
                  </div>
                </button>
              ))}
              {companies.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No companies found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Devices Content */}
        <div className="lg:col-span-3">
          {!selectedCompany ? (
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
              <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Company</h3>
              <p className="text-gray-500">Choose a company from the left panel to view its network devices</p>
            </div>
          ) : loadingDevices ? (
            <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
              <div className="w-12 h-12 border-4 border-coolWhite/10 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading devices...</p>
            </div>
          ) : (
            <>
              {/* Company Header */}
              <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCompany.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedCompany.sector}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{activeDevices.length}</div>
                      <div className="text-xs text-gray-500">Active Network</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{deletedDevices.length}</div>
                      <div className="text-xs text-gray-500">Deleted</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="active">
                <TabsList className="bg-gray-900/60 border border-gray-800 mb-6">
                  <TabsTrigger value="active" className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400">
                    <Wifi size={16} className="mr-2" />
                    Active Network ({activeDevices.length})
                  </TabsTrigger>
                  <TabsTrigger value="deleted" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                    <WifiOff size={16} className="mr-2" />
                    Deleted Devices ({deletedDevices.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {activeDevices.length === 0 ? (
                    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
                      <Wifi className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No active devices for this company</p>
                      <p className="text-sm text-gray-500 mt-1">Register machines and install the audit agent</p>
                    </div>
                  ) : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeDevices.map(device => (
                        <DeviceCard key={device._id} device={device} />
                      ))}
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="deleted">
                  {deletedDevices.length === 0 ? (
                    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-12 text-center">
                      <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No deleted devices</p>
                    </div>
                  ) : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deletedDevices.map(device => (
                        <DeviceCard key={device._id} device={device} isDeleted />
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Device Detail Dialog */}
      <Dialog open={showDeviceDetail} onOpenChange={(open) => { setShowDeviceDetail(open); if (!open) setDeviceReports([]); }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-coolWhite max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Monitor className="text-cyan-400" size={24} />
              Device Details
            </DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Machine Name</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.machineName}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Hostname</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.machineHostname || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">IP Address</span>
                  <p className="text-sm font-medium text-white font-mono">{selectedDevice.ipAddress}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Status</span>
                  <p className={`text-sm font-medium inline-flex items-center gap-1 ${
                    selectedDevice.agentStatus === 'active' ? 'text-emerald-400' :
                    selectedDevice.agentStatus === 'inactive' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {getStatusIcon(selectedDevice.agentStatus)} {selectedDevice.agentStatus}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Operating System</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.operatingSystem || 'Unknown'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">OS Type</span>
                  <p className="text-sm font-medium text-white capitalize">{selectedDevice.osType || 'linux'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Owner</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.ownerName}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Company</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.companyName || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Registration Date</span>
                  <p className="text-sm font-medium text-white">{new Date(selectedDevice.registrationDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Last Audit</span>
                  <p className="text-sm font-medium text-white">{selectedDevice.lastAuditDate ? new Date(selectedDevice.lastAuditDate).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-xs text-gray-500">Machine ID</span>
                <p className="text-sm font-medium text-white font-mono break-all">{selectedDevice.machineId}</p>
              </div>

              {/* Audit Reports Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <FileText className="text-amber-400" size={20} />
                  Audit Reports
                </h3>
                {loadingReports ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-8 h-8 border-4 border-coolWhite/10 border-t-cyan-400 rounded-full animate-spin"></div>
                  </div>
                ) : deviceReports.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No audit reports available for this device
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deviceReports.map((report) => (
                      <div key={report._id} className="bg-gray-800/60 rounded-lg border border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              report.auditScore >= 70 ? 'bg-emerald-500/20' :
                              report.auditScore >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'
                            }`}>
                              <span className={`text-sm font-bold ${
                                report.auditScore >= 70 ? 'text-emerald-400' :
                                report.auditScore >= 40 ? 'text-amber-400' : 'text-red-400'
                              }`}>{report.auditScore}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {new Date(report.auditDate).toLocaleDateString()} — {new Date(report.auditDate).toLocaleTimeString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {report.warnings} warnings · {report.suggestions} suggestions
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleDownloadPdf(report.reportId)}
                            disabled={downloadingPdf === report.reportId}
                            className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30"
                          >
                            {downloadingPdf === report.reportId ? (
                              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mr-1" />
                            ) : (
                              <Download size={14} className="mr-1" />
                            )}
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default NetworkPage;
