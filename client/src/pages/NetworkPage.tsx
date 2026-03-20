import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Monitor,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Building2,
  Trash2,
  RotateCcw,
  Filter,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";

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
  agentStatus: "active" | "inactive" | "pending";
  lastAuditDate?: string;
  registrationDate: string;
  isActive: boolean;
  latestAuditScore?: number;
  latestWarnings?: number;
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

  // Table state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nameFilter, setNameFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [entityTypeFilter, setEntityTypeFilter] = useState("All");
  const [showDeleted, setShowDeleted] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/os-audit/companies`, {
        params: { search: searchQuery },
        withCredentials: true,
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
      const res = await axios.get(
        `/api/v1/os-audit/network/${encodeURIComponent(companyName)}/devices`,
        { withCredentials: true }
      );
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
    setSelectedIds(new Set());
    setCurrentPage(1);
    fetchDevices(company.name);
  };

  const handleSoftDelete = async (deviceId: string) => {
    if (!window.confirm("Move this device to deleted devices?")) return;
    try {
      await axios.put(
        `/api/v1/os-audit/network/devices/${deviceId}/soft-delete`,
        {},
        { withCredentials: true }
      );
      if (selectedCompany) fetchDevices(selectedCompany.name);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete device");
    }
  };

  const handleRestore = async (deviceId: string) => {
    try {
      await axios.put(
        `/api/v1/os-audit/network/devices/${deviceId}/restore`,
        {},
        { withCredentials: true }
      );
      if (selectedCompany) fetchDevices(selectedCompany.name);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to restore device");
    }
  };

  const handlePermanentDelete = async (deviceId: string) => {
    if (!window.confirm("Permanently delete this device and all its reports? This cannot be undone."))
      return;
    try {
      await axios.delete(`/api/v1/os-audit/network/devices/${deviceId}`, {
        withCredentials: true,
      });
      if (selectedCompany) fetchDevices(selectedCompany.name);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete device");
    }
  };

  const fetchReports = async (machineId: string) => {
    try {
      setLoadingReports(true);
      const res = await axios.get(`/api/v1/os-audit/reports/${machineId}`, {
        withCredentials: true,
      });
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
      const res = await axios.post(
        `/api/v1/os-audit/reports/generate-pdf/${reportId}`,
        {},
        { withCredentials: true, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Move ${selectedIds.size} device(s) to deleted?`)) return;
    for (const id of selectedIds) {
      try {
        await axios.put(`/api/v1/os-audit/network/devices/${id}/soft-delete`, {}, { withCredentials: true });
      } catch (e) {}
    }
    setSelectedIds(new Set());
    if (selectedCompany) fetchDevices(selectedCompany.name);
  };

  const toggleCompanyExpand = (companyId: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  // Current device list based on active/deleted toggle
  const currentDevices = showDeleted ? deletedDevices : activeDevices;

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return currentDevices.filter((d) => {
      if (nameFilter && !d.machineName.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (ipFilter && !d.ipAddress.includes(ipFilter)) return false;
      if (statusFilter !== "All") {
        const managed = d.agentStatus === "active" ? "Managed" : "Unmanaged";
        if (managed !== statusFilter) return false;
      }
      if (entityTypeFilter !== "All") {
        const entityType = d.osType === "windows" ? "Physical machine" : "Virtual machine";
        if (entityType !== entityTypeFilter) return false;
      }
      return true;
    });
  }, [currentDevices, nameFilter, ipFilter, statusFilter, entityTypeFilter]);

  // Pagination
  const totalItems = filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const allSelected = paginatedDevices.length > 0 && paginatedDevices.every((d) => selectedIds.has(d._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDevices.map((d) => d._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateFormatted = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `At ${timeStr}, on ${dateFormatted}`;
  };

  const getSecurityIssues = (device: Device) => {
    if (!device.lastAuditDate) return "-";
    if ((device.latestWarnings ?? 0) > 0 || (device.latestAuditScore ?? 100) < 70) return "With issues";
    return "Without issues";
  };

  const resetFilters = () => {
    setNameFilter("");
    setIpFilter("");
    setStatusFilter("All");
    setEntityTypeFilter("All");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] text-gray-200 flex">
      {/* ── Left Tree Panel ── */}
      <div className="w-64 min-w-[16rem] border-r border-gray-700/50 flex flex-col bg-[#1e2128]">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Tree View</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <Input
              placeholder="Search in tree view"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-[#2a2d35] border-gray-600 text-gray-300 text-xs placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {/* Root level */}
          <div className="mb-1">
            <button
              onClick={() => {
                setSelectedCompany(null);
                setActiveDevices([]);
                setDeletedDevices([]);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 w-full text-left text-sm font-medium text-gray-200 hover:bg-gray-700/40 rounded"
            >
              <Building2 size={14} className="text-gray-400" />
              Companies
            </button>
          </div>

          {/* Company list */}
          <div className="ml-2 space-y-0.5">
            {companies.map((company) => (
              <button
                key={company._id}
                onClick={() => handleSelectCompany(company)}
                className={`flex items-center gap-1.5 px-2 py-1.5 w-full text-left text-[13px] rounded transition-colors ${
                  selectedCompany?._id === company._id
                    ? "bg-cyan-600/15 text-cyan-400"
                    : "text-gray-400 hover:bg-gray-700/30 hover:text-gray-200"
                }`}
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform flex-shrink-0 ${
                    selectedCompany?._id === company._id ? "rotate-90" : ""
                  }`}
                />
                <span className="truncate">{company.name}</span>
              </button>
            ))}
            {companies.length === 0 && (
              <p className="text-xs text-gray-600 px-2 py-3 text-center">No companies found</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <div className="px-6 pt-5 pb-2">
          <h1 className="text-2xl font-bold text-white">Network</h1>
          {selectedCompany && (
            <p className="text-sm text-gray-400 mt-0.5">{selectedCompany.name}</p>
          )}
        </div>

        {!selectedCompany ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Company</h3>
              <p className="text-gray-500 text-sm">Choose a company from the tree view to see its network devices</p>
            </div>
          </div>
        ) : loadingDevices ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="px-6 py-2 flex items-center gap-3 border-b border-gray-700/50">
              {/* Active / Deleted toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm font-medium h-9 px-4">
                    {showDeleted ? "DELETED DEVICES" : "ACTIVE DEVICES"} <ChevronDown className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
                  <DropdownMenuItem onClick={() => { setShowDeleted(false); setSelectedIds(new Set()); }} className="hover:bg-gray-700 cursor-pointer">
                    Active Devices ({activeDevices.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setShowDeleted(true); setSelectedIds(new Set()); }} className="hover:bg-gray-700 cursor-pointer">
                    Deleted Devices ({deletedDevices.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {showDeleted && selectedIds.size > 0 && (
                <>
                  <Button
                    onClick={async () => {
                      if (!window.confirm(`Restore ${selectedIds.size} device(s)?`)) return;
                      for (const id of selectedIds) {
                        try { await axios.put(`/api/v1/os-audit/network/devices/${id}/restore`, {}, { withCredentials: true }); } catch (e) {}
                      }
                      setSelectedIds(new Set());
                      if (selectedCompany) fetchDevices(selectedCompany.name);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9 px-4"
                  >
                    RESTORE
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!window.confirm(`Permanently delete ${selectedIds.size} device(s)? This cannot be undone.`)) return;
                      for (const id of selectedIds) {
                        try { await axios.delete(`/api/v1/os-audit/network/devices/${id}`, { withCredentials: true }); } catch (e) {}
                      }
                      setSelectedIds(new Set());
                      if (selectedCompany) fetchDevices(selectedCompany.name);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm h-9 px-4"
                  >
                    DELETE PERMANENTLY
                  </Button>
                </>
              )}

              {!showDeleted && selectedIds.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm h-9 px-4"
                >
                  DELETE
                </Button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b border-gray-700/50">
              <div className="relative">
                <Input
                  placeholder="Name"
                  value={nameFilter}
                  onChange={(e) => { setNameFilter(e.target.value); setCurrentPage(1); }}
                  className="h-8 w-40 bg-[#2a2d35] border-gray-600 text-gray-300 text-xs placeholder:text-gray-500 pr-7"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8 px-3">
                    Entity type{entityTypeFilter !== "All" ? `: ${entityTypeFilter}` : ""} <ChevronDown className="ml-1.5 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
                  {["All", "Physical machine", "Virtual machine"].map((t) => (
                    <DropdownMenuItem key={t} onClick={() => { setEntityTypeFilter(t); setCurrentPage(1); }} className="hover:bg-gray-700 cursor-pointer text-xs">
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative">
                <Input
                  placeholder="IP"
                  value={ipFilter}
                  onChange={(e) => { setIpFilter(e.target.value); setCurrentPage(1); }}
                  className="h-8 w-36 bg-[#2a2d35] border-gray-600 text-gray-300 text-xs placeholder:text-gray-500 pr-7"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-8 px-3">
                    Management status{statusFilter !== "All" ? `: ${statusFilter}` : ""} <ChevronDown className="ml-1.5 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
                  {["All", "Managed", "Unmanaged"].map((s) => (
                    <DropdownMenuItem key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }} className="hover:bg-gray-700 cursor-pointer text-xs">
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {(nameFilter || ipFilter || statusFilter !== "All" || entityTypeFilter !== "All") && (
                <button onClick={resetFilters} className="text-cyan-400 hover:text-cyan-300 text-xs ml-1">
                  Reset filters
                </button>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#1e2128] border-b border-gray-700/60 text-gray-400 text-xs">
                    <th className="w-10 px-3 py-2.5 text-center">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-500 data-[state=checked]:bg-cyan-600"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium">Name</th>
                    <th className="px-3 py-2.5 text-left font-medium">Company</th>
                    <th className="px-3 py-2.5 text-left font-medium">IP</th>
                    <th className="px-3 py-2.5 text-left font-medium">Last seen</th>
                    <th className="px-3 py-2.5 text-left font-medium">Entity type</th>
                    <th className="px-3 py-2.5 text-left font-medium">Management status</th>
                    <th className="px-3 py-2.5 text-left font-medium">Security issues</th>
                    <th className="w-10 px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-gray-500">
                        {showDeleted ? "No deleted devices" : "No devices found"}
                      </td>
                    </tr>
                  ) : (
                    paginatedDevices.map((device) => {
                      const isManaged = device.agentStatus === "active";
                      const entityType = device.osType === "windows" ? "Physical machine" : "Virtual machine";
                      const securityIssues = getSecurityIssues(device);

                      return (
                        <tr
                          key={device._id}
                          className={`border-b border-gray-800/50 hover:bg-[#252830] transition-colors ${
                            selectedIds.has(device._id) ? "bg-cyan-900/10" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <Checkbox
                              checked={selectedIds.has(device._id)}
                              onCheckedChange={() => toggleSelect(device._id)}
                              className="border-gray-500 data-[state=checked]:bg-cyan-600"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => handleViewDevice(device)}
                              className="text-cyan-400 hover:text-cyan-300 hover:underline text-left font-medium"
                            >
                              {device.machineName}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-gray-300">
                            {device.companyName || selectedCompany?.name || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-gray-300 font-mono text-xs">
                            {device.ipAddress}
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">
                            {formatLastSeen(device.lastAuditDate)}
                          </td>
                          <td className="px-3 py-2.5 text-gray-300">{entityType}</td>
                          <td className="px-3 py-2.5">
                            <span className={isManaged ? "text-gray-300" : "text-yellow-400"}>
                              {isManaged ? "Managed" : "Unmanaged"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={
                                securityIssues === "With issues"
                                  ? "text-red-400"
                                  : securityIssues === "Without issues"
                                  ? "text-emerald-400"
                                  : "text-gray-500"
                              }
                            >
                              {securityIssues}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 text-gray-500 hover:text-gray-300 rounded hover:bg-gray-700/50">
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="8" cy="3" r="1.5" />
                                    <circle cx="8" cy="8" r="1.5" />
                                    <circle cx="8" cy="13" r="1.5" />
                                  </svg>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
                                <DropdownMenuItem onClick={() => handleViewDevice(device)} className="hover:bg-gray-700 cursor-pointer text-xs">
                                  <Eye size={13} className="mr-2" /> View Details
                                </DropdownMenuItem>
                                {showDeleted ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRestore(device._id)} className="hover:bg-gray-700 cursor-pointer text-xs text-emerald-400">
                                      <RotateCcw size={13} className="mr-2" /> Restore
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePermanentDelete(device._id)} className="hover:bg-gray-700 cursor-pointer text-xs text-red-400">
                                      <Trash2 size={13} className="mr-2" /> Delete Permanently
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleSoftDelete(device._id)} className="hover:bg-gray-700 cursor-pointer text-xs text-red-400">
                                    <Trash2 size={13} className="mr-2" /> Remove Device
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
              <span>
                {startItem}-{endItem} of {totalItems} items
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-[#2a2d35] border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs"
                  >
                    {[25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 1 && v <= totalPages) setCurrentPage(v);
                    }}
                    className="w-10 text-center bg-[#2a2d35] border border-gray-600 rounded py-1 text-gray-300 text-xs"
                  />
                  <span>of {totalPages} pages</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-1.5 py-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Device Detail Dialog ── */}
      <Dialog open={showDeviceDetail} onOpenChange={(open) => { setShowDeviceDetail(open); if (!open) setDeviceReports([]); }}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-gray-200 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Monitor className="text-cyan-400" size={24} />
              Device Details
            </DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Machine Name", selectedDevice.machineName],
                  ["Hostname", selectedDevice.machineHostname || "N/A"],
                  ["IP Address", selectedDevice.ipAddress],
                  ["Status", selectedDevice.agentStatus],
                  ["Operating System", selectedDevice.operatingSystem || "Unknown"],
                  ["OS Type", selectedDevice.osType || "linux"],
                  ["Owner", selectedDevice.ownerName],
                  ["Company", selectedDevice.companyName || "N/A"],
                  ["Registration Date", new Date(selectedDevice.registrationDate).toLocaleDateString()],
                  ["Last Audit", selectedDevice.lastAuditDate ? new Date(selectedDevice.lastAuditDate).toLocaleDateString() : "Never"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#2a2d35] rounded-lg p-3">
                    <span className="text-[11px] text-gray-500 uppercase">{label}</span>
                    <p className={`text-sm font-medium mt-0.5 ${
                      label === "Status"
                        ? value === "active" ? "text-emerald-400" : value === "inactive" ? "text-red-400" : "text-yellow-400"
                        : "text-white"
                    }`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#2a2d35] rounded-lg p-3">
                <span className="text-[11px] text-gray-500 uppercase">Machine ID</span>
                <p className="text-sm font-medium text-white font-mono break-all mt-0.5">{selectedDevice.machineId}</p>
              </div>

              {/* Reports */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <FileText className="text-amber-400" size={18} />
                  Audit Reports
                </h3>
                {loadingReports ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin" />
                  </div>
                ) : deviceReports.length === 0 ? (
                  <p className="text-center py-6 text-gray-500 text-sm">No audit reports available</p>
                ) : (
                  <div className="space-y-2">
                    {deviceReports.map((report) => (
                      <div key={report._id} className="bg-[#2a2d35] rounded-lg border border-gray-700/60 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                              report.auditScore >= 70
                                ? "bg-emerald-500/20 text-emerald-400"
                                : report.auditScore >= 40
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {report.auditScore}
                          </div>
                          <div>
                            <p className="text-sm text-white">
                              {new Date(report.auditDate).toLocaleDateString()} — {new Date(report.auditDate).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {report.warnings} warnings · {report.suggestions} suggestions
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(report.reportId)}
                          disabled={downloadingPdf === report.reportId}
                          className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 text-xs"
                        >
                          {downloadingPdf === report.reportId ? (
                            <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mr-1" />
                          ) : (
                            <Download size={13} className="mr-1" />
                          )}
                          PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NetworkPage;
