import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MdDragIndicator } from "react-icons/md";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import RequirePermission from "@/components/common/RequirePermission";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Description = ({ text, limit = 80, className = "text-sm text-gray-700 mb-1" }) => {
  if (!text) return null;
  const content = text.length <= limit ? text : `${text.substring(0, limit)}...`;
  return <div className={className}>{content}</div>;
};



export default function CompaniesPage() {
  useEffect(() => { document.title = "Companies | Immortal LMS" }, []);
  const MAX_LOGO_BYTES = 1024 * 1024;
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState(0);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const [sequenceOpen, setSequenceOpen] = useState(false);
  const [sequenceItems, setSequenceItems] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:3004/api";
  const UPLOAD_BASE = API_BASE.replace(/\/api$/, "") + "/api/uploads/company/";

  const fetchRows = async (overrides = {}) => {
    setLoading(true);
    try {
      const res = await api.post("/companies/query", {
        page,
        limit,
        query: search,
        statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        ...overrides,
      });
      const list = Array.isArray(res?.data?.rows) ? res.data.rows : [];
      const m = res?.data?.meta || { page, limit, total: list.length, totalPages: 1 };
      setRows(list);
      setMeta({ page: Number(m.page), limit: Number(m.limit), total: Number(m.total), totalPages: Number(m.totalPages) });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [page, limit, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchRows({ page: 1 }); }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => { setMode("create"); setEditing(null); setName(""); setDescription(""); setAddress(""); setSequenceOrder(0); setLogoFile(null); setLogoPreview(null); setDialogOpen(true); };
  const openEdit = (row) => { setMode("edit"); setEditing(row); setName(row?.name || ""); setDescription(row?.description || ""); setAddress(row?.address || ""); setSequenceOrder(row?.sequence_order || 0); setLogoFile(null); setLogoPreview(row?.logo_filename ? UPLOAD_BASE + row.logo_filename : null); setDialogOpen(true); };

  const SortableItem = ({ id, item }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-3 p-2 border rounded bg-white">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab p-1">
            <MdDragIndicator className="w-4 h-4" />
          </div>
          <div className="text-sm">{item.name}</div>
        </div>
        <div className="text-xs text-slate-500">#{item.sequence_order ?? '-'}</div>
      </div>
    )
  }

  const openSequenceDialog = async () => {
    try {
      const res = await api.post("/companies/query", { page: 1, limit: 500 });
      const list = Array.isArray(res?.data?.rows) ? res.data.rows : [];
      const sorted = list.slice().sort((a, b) => {
        const ai = a.sequence_order ?? Number.MAX_SAFE_INTEGER;
        const bi = b.sequence_order ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return String(a.name).localeCompare(String(b.name));
      });
      setSequenceItems(sorted);
      setSequenceOpen(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load companies");
    }
  }

  const onSequenceDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sequenceItems.findIndex((c) => c.id === active.id);
    const newIndex = sequenceItems.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(sequenceItems, oldIndex, newIndex);
    setSequenceItems(next);
  }

  const saveSequence = async () => {
    try {
      const ids = sequenceItems.map(i => i.id);
      await api.post("/companies/reorder", { ids });
      toast.success("Sequence updated");
      setSequenceOpen(false);
      await fetchRows();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update sequence");
    }
  }

  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (logoFile && logoFile.size > MAX_LOGO_BYTES) { toast.error("Image must be less than 1 MB"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (description != null) fd.append("description", description);
      if (address != null) fd.append("address", address);
      fd.append("sequence_order", sequenceOrder);
      if (logoFile) fd.append("logo", logoFile);
      if (mode === "create") {
        await api.post("/companies", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Company created");
      } else if (editing?.id) {
        await api.put(`/companies/${editing.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Company updated");
      }
      setDialogOpen(false);
      await fetchRows();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inactivate = async (id) => {
    try {
      await api.patch(`/companies/${id}/inactivate`);
      toast.success("Company inactivated");
      await fetchRows();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to inactivate");
    }
  };

  const activate = async (id) => {
    try {
      await api.patch(`/companies/${id}/activate`);
      toast.success("Company activated");
      await fetchRows();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to activate");
    }
  };

  const handleToggleStatus = (e, row) => {
    e.stopPropagation();
    if (row.is_active) {
      setConfirmData(row);
      setConfirmOpen(true);
    } else {
      activate(row.id);
    }
  };

  const onConfirmInactivate = async (e) => {
    e.preventDefault();
    if (confirmData) {
      setConfirming(true);
      await inactivate(confirmData.id);
      setConfirming(false);
    }
    setConfirmOpen(false);
    setConfirmData(null);
  };

  return (
    <section className="h-screen flex flex-col min-w-0 ml-4 overflow-hidden">
      <div className="bg-white shadow-sm z-30 flex-none">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company" className="w-64" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <RequirePermission permission="company.create">
              <Button onClick={openCreate}>Add Company</Button>
            </RequirePermission>
            <RequirePermission permission="company.create">
              <Dialog open={sequenceOpen} onOpenChange={setSequenceOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={openSequenceDialog} size="icon"><MdDragIndicator /></Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Edit sequence</TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Arrange Companies</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <ScrollArea className="max-h-[60vh] p-1">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSequenceDragEnd}>
                        <SortableContext items={sequenceItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {sequenceItems.map((it) => (
                              <SortableItem key={it.id} id={it.id} item={it} />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setSequenceOpen(false)}>Cancel</Button>
                      <Button onClick={saveSequence}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </RequirePermission>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8">No companies</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map(r => (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full" onClick={() => navigate(`/companies/${r.id}`)}>
                <CardHeader className="p-0 shrink-0">
                  {r.logo_filename ? (
                    <img
                      src={UPLOAD_BASE + r.logo_filename}
                      alt={r.name}
                      className="w-full h-40 object-contain bg-gray-50"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-500">No Logo</div>
                  )}
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-1">
                  <CardTitle className="text-lg mb-2">{r.name}</CardTitle>
                  <Description text={r.description} />
                  <Description text={r.address} className="text-sm text-gray-600" />
                  <div className="mt-auto pt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEdit(r); }} disabled={!r.is_active}>Edit</Button>
                    <Button
                      size="sm"
                      variant={r.is_active ? "destructive" : "default"}
                      className={!r.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={(e) => handleToggleStatus(e, r)}
                    >
                      {r.is_active ? "Inactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-4 shadow-sm z-30 flex-none flex items-center justify-between border-t">
        <div className="text-sm text-gray-600">Showing page {meta.page} of {meta.totalPages} — {meta.total} companies</div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Company" : "Edit Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Address</label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Sequence Order</label>
              <Input
                type="number"
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Logo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <span>Choose Logo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && f.size > MAX_LOGO_BYTES) { toast.error("Image must be less than 1 MB"); e.target.value = ""; return; }
                      setLogoFile(f);
                      if (f) {
                        setLogoPreview(URL.createObjectURL(f));
                      } else if (mode === 'edit' && editing?.logo_filename) {
                        setLogoPreview(UPLOAD_BASE + editing.logo_filename);
                      } else {
                        setLogoPreview(null);
                      }
                    }}
                  />
                </label>
                {logoPreview && (
                  <div className="h-16 w-16 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Inactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to inactivate {confirmData?.name}? This will prevent access to this company.
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
