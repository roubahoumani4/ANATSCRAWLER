import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Filter,
  RotateCcw,
  Upload,
  AlertTriangle,
  MoreHorizontal
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
import axios from "axios";

interface Company {
  _id: string;
  name: string;
  companyType: string;
  country?: string;
  industry?: string;
  sector?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  managedEndpointSecurity: boolean;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  companyStatus: string;
  paymentPlan: string;
  productName: string;
  licenseKey?: string;
  expiryDate: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  deviceCount?: number;
  activeDevices?: number;
  packageCount?: number;
}

const companyTypes = ["Customer", "Partner", "Reseller"];

const countries = [
  "Lebanon", "United States", "United Kingdom", "France", "Germany",
  "Canada", "Australia", "United Arab Emirates", "Saudi Arabia", "Qatar",
  "Kuwait", "Bahrain", "Oman", "Jordan", "Egypt", "Iraq", "Syria",
  "Turkey", "India", "China", "Japan", "Brazil", "Mexico", "Italy",
  "Spain", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden",
  "Norway", "Denmark", "Finland", "Poland", "Russia", "South Africa",
  "Nigeria", "Ghana", "Kenya", "Singapore", "Malaysia", "Indonesia",
  "Thailand", "Philippines", "Vietnam", "South Korea", "Taiwan",
  "New Zealand", "Ireland", "Portugal", "Greece", "Czech Republic",
  "Romania", "Hungary", "Argentina", "Chile", "Colombia", "Peru"
].sort();

const industries = [
  "Technology", "Finance", "Healthcare", "Education", "Government",
  "Retail", "Manufacturing", "Energy", "Telecommunications", "Media",
  "Transportation", "Real Estate", "Legal", "Consulting", "Hospitality",
  "Agriculture", "Construction", "Automotive", "Pharmaceutical",
  "Insurance", "Banking", "Food & Beverage", "Non-profit", "Other"
];

const productStatuses = ["All", "Active", "Inactive", "Suspended"];

interface EditFormData {
  name: string;
  companyType: string;
  country: string;
  industry: string;
  phone: string;
  address: string;
  managedEndpointSecurity: boolean;
}

const CompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("All");
  const [productStatusFilter, setProductStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<EditFormData>({
    name: "", companyType: "Customer", country: "", industry: "",
    phone: "", address: "", managedEndpointSecurity: true
  });

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/os-audit/companies`, {
        params: { search: "" },
        withCredentials: true
      });
      setCompanies(res.data.companies || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", companyType: "Customer", country: "", industry: "", phone: "", address: "", managedEndpointSecurity: true });
    setEditingCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const res = await axios.put(`/api/v1/os-audit/companies/${editingCompany._id}`, form, { withCredentials: true });
        if (res.data.success) {
          setShowEditDialog(false);
          resetForm();
          fetchCompanies();
        }
      } else {
        const res = await axios.post("/api/v1/os-audit/companies", form, { withCredentials: true });
        if (res.data.success) {
          setShowEditDialog(false);
          resetForm();
          fetchCompanies();
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to save company");
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      companyType: company.companyType || "Customer",
      country: company.country || "",
      industry: company.industry || "",
      phone: company.phone || "",
      address: company.address || "",
      managedEndpointSecurity: company.managedEndpointSecurity !== false
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This will also delete all associated installation packages.")) return;
    try {
      await axios.delete(`/api/v1/os-audit/companies/${id}`, { withCredentials: true });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      fetchCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete company");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} company(ies)? This will also delete all associated data.`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          axios.delete(`/api/v1/os-audit/companies/${id}`, { withCredentials: true })
        )
      );
      setSelectedIds(new Set());
      fetchCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete companies");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map(c => c._id)));
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCompanyTypeFilter("All");
    setProductStatusFilter("All");
    setCurrentPage(1);
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = companyTypeFilter === "All" || c.companyType === companyTypeFilter;
      const matchesStatus = productStatusFilter === "All" || c.companyStatus === productStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [companies, searchQuery, companyTypeFilter, productStatusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / itemsPerPage));
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery, companyTypeFilter, productStatusFilter, itemsPerPage]);

  const getUsageBreakdown = (c: Company) => {
    const used = c.usedSeats || c.deviceCount || 0;
    const available = c.availableSeats || 0;
    return `${used} used reserved seats, ${available} available reserved seats`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] text-gray-200">
      {/* Edit Company Full-Screen Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 bg-[#1a1d23] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              {editingCompany ? `Edit ${editingCompany.name}` : "Add Company"}
            </h2>
            <button
              onClick={() => { setShowEditDialog(false); resetForm(); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-6">
            {/* BASIC DETAILS */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Basic Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0">Company name*:</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="flex-1 bg-[#2a2d35] border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0">Company type*:</label>
                  <select
                    value={form.companyType}
                    onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                    required
                    className="flex-1 rounded-md bg-[#2a2d35] border border-gray-600 text-white px-3 py-2 text-sm"
                  >
                    {companyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0">Country*:</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                    className="flex-1 rounded-md bg-[#2a2d35] border border-gray-600 text-white px-3 py-2 text-sm"
                  >
                    <option value="">Select country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0">Industry*:</label>
                  <div className="flex-1">
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      required
                      className={`w-full rounded-md bg-[#2a2d35] border text-sm px-3 py-2 ${
                        !form.industry ? "border-yellow-500 text-gray-400" : "border-gray-600 text-white"
                      }`}
                    >
                      <option value="">Select industry</option>
                      {industries.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {!form.industry && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle size={12} className="text-yellow-500" />
                        <span className="text-xs text-red-400">Required field</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MANAGEMENT PERMISSIONS */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Management Permissions</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={form.managedEndpointSecurity}
                  onCheckedChange={(checked) => setForm({ ...form, managedEndpointSecurity: checked === true })}
                  className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-sm text-gray-300">The company manages endpoint security</span>
              </label>
            </div>

            {/* ADDITIONAL DETAILS */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Additional Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0 mt-2">Registered address:</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="flex-1 rounded-md bg-[#2a2d35] border border-gray-600 text-white px-3 py-2 text-sm min-h-[80px] resize-y"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0">Phone number:</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="flex-1 bg-[#2a2d35] border-gray-600 text-white"
                    placeholder=""
                  />
                </div>
                <div className="flex items-start gap-4">
                  <label className="w-40 text-sm text-gray-300 shrink-0 mt-2">Logo in Control Center:</label>
                  <div className="flex-1">
                    <div className="w-[200px] h-[60px] bg-[#2a2d35] border border-gray-600 rounded flex items-center justify-center mb-1">
                      <span className="text-xs text-gray-500">No logo uploaded</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">200px x 30px size, png or jpg format</p>
                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 underline">
                      Upload logo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <Button
                type="submit"
                className="bg-gray-600 hover:bg-gray-500 text-white px-6"
              >
                SAVE
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowEditDialog(false); resetForm(); }}
                className="border-gray-500 text-gray-300 hover:bg-gray-700 px-6"
              >
                CANCEL
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-white mb-6">Companies</h1>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={() => { resetForm(); setShowEditDialog(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4"
          >
            ADD COMPANY
          </Button>
          <Button
            onClick={handleBulkDelete}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10 font-medium px-4"
            disabled={selectedIds.size === 0}
          >
            DELETE
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 font-medium px-4">
                MORE ACTIONS <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2a2d35] border-gray-600 text-gray-200">
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">Export to CSV</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">Import Companies</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Right-side icons placeholder */}
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Company name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#2a2d35] border-gray-600 text-white placeholder:text-gray-500 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Company type</span>
            <select
              value={companyTypeFilter}
              onChange={(e) => setCompanyTypeFilter(e.target.value)}
              className="rounded-md bg-[#2a2d35] border border-gray-600 text-white px-3 py-1.5 text-sm h-9"
            >
              <option value="All">All</option>
              {companyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Product status</span>
            <div className="flex items-center gap-1">
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="rounded-md bg-[#2a2d35] border border-gray-600 text-white px-3 py-1.5 text-sm h-9"
              >
                {productStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {productStatusFilter !== "All" && (
                <button
                  onClick={() => setProductStatusFilter("All")}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white text-sm h-9 px-3"
          >
            More <ChevronDown className="ml-1 h-3 w-3" />
          </Button>

          <button
            onClick={resetFilters}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Reset filters
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-[#1e2128]">
                  <th className="w-10 p-3">
                    <Checkbox
                      checked={selectedIds.size === filteredCompanies.length && filteredCompanies.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Company name</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Usage breakdown</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Total seats</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Company type</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Company status</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Managed</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Payment plan</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Product name</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">License key</th>
                  <th className="text-left p-3 font-medium text-gray-300 whitespace-nowrap">Expiry date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-500">
                      No companies found. Click "ADD COMPANY" to create one.
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company) => (
                    <tr
                      key={company._id}
                      className="border-b border-gray-700/50 hover:bg-[#22252d] transition-colors"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(company._id)}
                          onCheckedChange={() => toggleSelect(company._id)}
                          className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-blue-400 hover:text-blue-300 hover:underline text-sm text-left"
                        >
                          {company.name}
                        </button>
                      </td>
                      <td className="p-3 text-gray-300 text-sm whitespace-nowrap">{getUsageBreakdown(company)}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.totalSeats || (company.usedSeats || 0) + (company.availableSeats || 0)}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.companyType || "Customer"}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.companyStatus || "Active"}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.managedEndpointSecurity !== false ? "Yes" : "No"}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.paymentPlan || "Monthly"}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.productName || "Monthly Subscription"}</td>
                      <td className="p-3 text-gray-300 text-sm font-mono">{company.licenseKey || "—"}</td>
                      <td className="p-3 text-gray-300 text-sm">{company.expiryDate || "Never"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded bg-[#2a2d35] border border-gray-600 text-white px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={18} />
            </button>
            <div className="flex items-center gap-1 ml-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-12 rounded bg-[#2a2d35] border border-gray-600 text-white px-2 py-1 text-sm text-center"
                min={1}
                max={totalPages}
              />
              <span>of {totalPages} pages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
