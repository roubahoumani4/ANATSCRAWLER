import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  User,
  Server,
  Package,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  phone: string;
  email: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  deviceCount?: number;
  activeDevices?: number;
  packageCount?: number;
}

const CompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "", sector: "", phone: "", email: "",
    address: "", website: "", contactPerson: "", notes: ""
  });

  const sectors = [
    "Technology", "Finance", "Healthcare", "Education", "Government",
    "Retail", "Manufacturing", "Energy", "Telecommunications", "Media",
    "Transportation", "Real Estate", "Legal", "Consulting", "Other"
  ];

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

  const resetForm = () => {
    setForm({ name: "", sector: "", phone: "", email: "", address: "", website: "", contactPerson: "", notes: "" });
    setEditingCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const res = await axios.put(`/api/v1/os-audit/companies/${editingCompany._id}`, form, { withCredentials: true });
        if (res.data.success) {
          setShowCreateDialog(false);
          resetForm();
          fetchCompanies();
        }
      } else {
        const res = await axios.post("/api/v1/os-audit/companies", form, { withCredentials: true });
        if (res.data.success) {
          setShowCreateDialog(false);
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
      sector: company.sector,
      phone: company.phone,
      email: company.email,
      address: company.address || "",
      website: company.website || "",
      contactPerson: company.contactPerson || "",
      notes: company.notes || ""
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This will also delete all associated installation packages.")) return;
    try {
      await axios.delete(`/api/v1/os-audit/companies/${id}`, { withCredentials: true });
      fetchCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete company");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-jetBlack flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coolWhite/10 border-t-crimsonRed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coolWhite/60">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-jetBlack text-coolWhite p-6">
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="text-cyan-400" size={36} />
              Company Management
            </h1>
            <p className="text-gray-400 mt-2">Create and manage companies for OS Audit</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="bg-crimsonRed hover:bg-crimsonRed/80 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={fadeIn} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/60 border-gray-700 text-coolWhite placeholder:text-gray-500"
          />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div variants={fadeIn} className="bg-gradient-to-br from-cyan-900/40 via-cyan-800/30 to-cyan-900/40 border border-cyan-700/50 rounded-xl p-6 hover:border-cyan-500/70 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wide mb-1">Total Companies</p>
              <h3 className="text-3xl font-bold text-white">{companies.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
              <Building2 className="text-cyan-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-700/50 rounded-xl p-6 hover:border-emerald-500/70 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">Total Devices</p>
              <h3 className="text-3xl font-bold text-white">{companies.reduce((acc, c) => acc + (c.deviceCount || 0), 0)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Server className="text-emerald-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/50 rounded-xl p-6 hover:border-purple-500/70 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-wide mb-1">Total Packages</p>
              <h3 className="text-3xl font-bold text-white">{companies.reduce((acc, c) => acc + (c.packageCount || 0), 0)}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Package className="text-purple-400" size={24} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Companies List */}
      <motion.div variants={staggerContainer}>
        {companies.length === 0 ? (
          <motion.div variants={fadeIn} className="bg-gray-900/60 rounded-xl p-12 border border-gray-800 text-center">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Companies Yet</h3>
            <p className="text-gray-500 mb-4">Create your first company to get started with OS Audit</p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="bg-crimsonRed hover:bg-crimsonRed/80 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Company
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <motion.div
                key={company._id}
                variants={fadeIn}
                className="bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-400/30 transition-all duration-300 group"
              >
                <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition-colors">{company.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {company.sector}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(company)} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-cyan-400">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(company._id)} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2"><Mail size={14} /> {company.email}</div>
                    <div className="flex items-center gap-2"><Phone size={14} /> {company.phone}</div>
                    {company.contactPerson && <div className="flex items-center gap-2"><User size={14} /> {company.contactPerson}</div>}
                    {company.website && <div className="flex items-center gap-2"><Globe size={14} /> {company.website}</div>}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-800">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-emerald-400">{company.activeDevices || 0}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-white">{company.deviceCount || 0}</div>
                      <div className="text-xs text-gray-500">Devices</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-purple-400">{company.packageCount || 0}</div>
                      <div className="text-xs text-gray-500">Packages</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetForm(); } }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-coolWhite max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="text-cyan-400" size={24} />
              {editingCompany ? "Edit Company" : "Create New Company"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Company Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="Enter company name" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Sector *</label>
              <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} required
                className="w-full rounded-md bg-gray-800 border border-gray-600 text-coolWhite px-3 py-2 text-sm">
                <option value="">Select sector</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Phone *</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required
                  className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="+1 234 567 890" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="company@example.com" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Contact Person</label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="Primary contact name" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Website</label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="https://example.com" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-gray-800 border-gray-600 text-coolWhite" placeholder="Company address" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-md bg-gray-800 border border-gray-600 text-coolWhite px-3 py-2 text-sm min-h-[80px]"
                placeholder="Additional details..." />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</Button>
              <Button type="submit" className="bg-crimsonRed hover:bg-crimsonRed/80 text-white">
                {editingCompany ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CompanyPage;
