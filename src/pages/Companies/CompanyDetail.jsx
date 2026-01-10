import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft as FiArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import CompanySettingsPage from "@/pages/CompanySettings/CompanySettings";
import Departments from "@/pages/Departments/Departments";
import EmployeesTableEnhanced from "@/pages/Employees/EmployeesTableEnhanced";
import CompanyHolidays from "./CompanyHolidays";

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "about";

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit/Inactivate state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const setTab = (newTab) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', newTab);
      return newParams;
    });
  };

  useEffect(() => {
    document.title = "Company Detail | Immortal LMS";
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}`);
      setCompany(res.data.company);
    } catch (err) {
      console.error("Failed to fetch company", err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (!company) return;
    setEditName(company.name || "");
    setEditDescription(company.description || "");
    setEditAddress(company.address || "");
    setEditLogoFile(null);
    setEditDialogOpen(true);
  };

  const save = async () => {
    if (!editName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      if (editDescription != null) fd.append("description", editDescription);
      if (editAddress != null) fd.append("address", editAddress);
      if (editLogoFile) fd.append("logo", editLogoFile);

      await api.put(`/companies/${companyId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Company updated");
      setEditDialogOpen(false);
      await fetchCompany();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inactivate = async () => {
    try {
      await api.patch(`/companies/${companyId}/inactivate`);
      toast.success("Company inactivated");
      await fetchCompany();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to inactivate");
    }
  };

  const activate = async () => {
    try {
      await api.patch(`/companies/${companyId}/activate`);
      toast.success("Company activated");
      await fetchCompany();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to activate");
    }
  };

  const onConfirmInactivate = async (e) => {
    e.preventDefault();
    setConfirming(true);
    await inactivate();
    setConfirming(false);
    setConfirmOpen(false);
  };

  const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:3004/api";
  const UPLOAD_BASE = API_BASE.replace(/\/api$/, "") + "/api/uploads/company/";

  return (
    <section className="flex flex-col h-screen min-w-0">
      {/* Header Section */}
      <div className="bg-white border-b px-6 py-4 flex flex-col-reverse md:flex-row md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4"> 
          {loading ? (
            <div className="w-16 h-16 bg-gray-100 animate-pulse rounded"></div>
          ) : company?.logo_filename ? (
            <img
              src={UPLOAD_BASE + company.logo_filename}
              alt={company.name}
              className="w-16 h-16 object-contain bg-gray-50 border rounded"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-500 text-xs text-center border rounded">
              No Logo
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company?.name || "Loading..."}</h1>
            <p className="text-sm text-gray-500">Company Dashboard</p>
          </div>
        </div>

        <div className="md:ml-auto">
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
          </Button>
        </div>

      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {[
            { key: "about", label: "About" },
            { key: "settings", label: "Settings" },
            { key: "departments", label: "Departments" },
            { key: "employees", label: "Employees" },
            { key: "holidays", label: "Holidays" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gray-50 overflow-hidden p-4 flex flex-col">
        {tab === "about" && (
          <div className="h-full overflow-auto p-2">
            <Card className=" mx-auto">
              <CardHeader>
                <CardTitle>About Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {company?.logo_filename ? (
                    <img
                      src={UPLOAD_BASE + company.logo_filename}
                      alt={company.name}
                      className="w-32 h-32 object-contain bg-gray-50 border rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-100 text-gray-500 border rounded-lg shrink-0">
                      No Logo
                    </div>
                  )}
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{company?.name}</h3>
                      {company?.address && (
                        <div className="text-gray-600 mt-1 flex items-start gap-2">
                          <span className="font-medium">Address:</span>
                          <span>{company.address}</span>
                        </div>
                      )}
                    </div>
                    {company?.description && (
                      <div className="text-gray-700">
                        <span className="font-medium block mb-1">Description:</span>
                        <div className="whitespace-pre-wrap">{company.description}</div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      <Button onClick={openEdit} disabled={!company?.is_active}>Edit Details</Button>
                      {company?.is_active ? (
                        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                          Inactivate Company
                        </Button>
                      ) : (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={activate}>
                          Activate Company
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {tab === "settings" && <div className="h-full overflow-auto"><CompanySettingsPage isCompanyActive={company?.is_active} /></div>}
        {tab === "departments" && (
          <Departments
            staticFilters={{ company_id: companyId }}
            className="h-full ml-0"
          />
        )}
        {tab === "employees" && (
          <EmployeesTableEnhanced
            staticFilters={{ company_id: { op: 'eq', value: companyId } }}
            className="h-full ml-0"
          />
        )}
        {tab === "holidays" && (
          <div className="h-full overflow-hidden bg-white rounded-lg shadow-sm border m-2">
            <CompanyHolidays companyId={companyId} />
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => setEditLogoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Inactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to inactivate {company?.name}? This will prevent access to this company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmInactivate} disabled={confirming} className="bg-destructive hover:bg-destructive/90">
              {confirming ? "Inactivating..." : "Inactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
