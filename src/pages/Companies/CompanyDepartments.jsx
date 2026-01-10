import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { useParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import RequirePermission from "@/components/common/RequirePermission";
import ColumnSearchRow from "@/components/ColumnSearchRow";
import FiltersPanel from "@/components/FiltersPanel";
import FilterChips from "@/components/FilterChips";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  MoreVertical as HiOutlineDotsVertical,
  Plus as FiPlus, 
  Edit2 as FiEdit2, 
  Trash2 as FiTrash2, 
  Search as FiSearch, 
  Info as FiInfo, 
  Check as FiCheck, 
  X as FiX 
} from "lucide-react";
import TableConfigPanel from "@/components/config/TableConfigPanel";

export default function CompanyDepartmentsPage() {
  const { companyId } = useParams();
  useEffect(() => { document.title = "Company Departments | Immortal LMS" }, []);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingDept, setEditingDept] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [columns, setColumns] = useState([
    { key: "name", label: "Name", visible: true, order: 1 },
    { key: "is_active", label: "Active", type: "boolean", visible: true, order: 2 },
    { key: "created_at", label: "Created At", type: "date", visible: true, order: 3 },
    { key: "updated_at", label: "Updated At", type: "date", visible: true, order: 4 },
    { key: "created_by", label: "Created By", visible: true, order: 5 },
    { key: "updated_by", label: "Updated By", visible: true, order: 6 },
  ]);
  const [showColumnSearch, setShowColumnSearch] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const rowId = (r) => r.id;
  const isAllSelected = selected.size > 0 && rows.every((r) => selected.has(rowId(r)));
  const toggleAll = () => {
    setSelected(prev => {
      if (rows.length === 0) return prev;
      const next = new Set(prev);
      const all = rows.map(rowId);
      const allSelected = all.every(id => next.has(id));
      if (allSelected) { all.forEach(id => next.delete(id)); } else { all.forEach(id => next.add(id)); }
      return next;
    });
  };
  const toggleOne = (id) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const openPreview = (item) => { setPreviewItem(item); setPreviewOpen(true); };
  const closePreview = () => { setPreviewOpen(false); setPreviewItem(null); };

  const [sort, setSort] = useState({ key: null, dir: null });
  const sortedRows = useMemo(() => {
    if (!sort.key || !sort.dir) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const as = av == null ? "" : String(av);
      const bs = bv == null ? "" : String(bv);
      return sort.dir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return arr;
  }, [rows, sort]);

  const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, colKey: null, colLabel: null, value: null });
  const closeCtx = () => setCtx(prev => ({ ...prev, open: false }));
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [editing, setEditing] = useState({ rowKey: null, colKey: null, value: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [bulkColKey, setBulkColKey] = useState(null);
  const [headerMenuFor, setHeaderMenuFor] = useState(null);

  const fetchRows = async (overrides = {}) => {
    setLoading(true);
    try {
      const res = await api.post("/departments/query", {
        page,
        limit,
        query,
        statusFilter,
        columnFilters,
        advancedFilters,
        companyId,
        ...overrides,
      });
      const list = Array.isArray(res?.data?.rows) ? res.data.rows : [];
      const m = res?.data?.meta || { page, limit, total: list.length, totalPages: 1 };
      setRows(list);
      setMeta({ page: Number(m.page), limit: Number(m.limit), total: Number(m.total), totalPages: Number(m.totalPages) });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const loadTableConfig = async () => {
    try {
      const res = await api.get(`/table-configs?table=department`);
      const registry = Array.isArray(res?.data?.columns) ? res.data.columns : [];
      const config = res?.data?.config ? res.data.config.config : null;
      if (config && Array.isArray(config)) {
        const map = Object.fromEntries(config.map(c => [c.key, c]));
        const ordered = config.slice().sort((a, b) => a.order - b.order).map(c => {
          const reg = registry.find(r => r.key === c.key);
          return { key: c.key, label: reg ? reg.label : c.key, type: reg ? reg.type : undefined, visible: !!c.visible, order: c.order };
        });
        const missing = registry.filter(r => !map[r.key]).map((r, i) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: ordered.length + i + 1 }));
        setColumns([...ordered, ...missing]);
      } else {
        const defaults = registry.map((r, idx) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: idx + 1 }));
        if (defaults.length > 0) setColumns(defaults);
      }
    } catch (err) {
    }
    await fetchRows({ page: 1 });
  };

  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (initialLoadedRef.current) {
      fetchRows();
    } else {
      initialLoadedRef.current = true;
    }
  }, [statusFilter, page, limit, companyId]);
  useEffect(() => {
    const t = setTimeout(() => { loadTableConfig(); }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const q = String(query || "").trim();
    if (!q) return;
    const t = setTimeout(() => { fetchRows({ page: 1 }); }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const onColumnFilterChange = (key, spec) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!spec || spec.value === "" || typeof spec.value === "undefined" || spec.value === null) {
        delete next[key];
      } else next[key] = spec;
      fetchRows({ columnFilters: next, page: 1 });
      return next;
    });
    setPage(1);
  };

  const applyAdvanced = (filters) => {
    const next = filters || [];
    setAdvancedFilters(next);
    setPage(1);
    fetchRows({ advancedFilters: next, page: 1 });
  };

  const dateTimeFormator = (date) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
    const formattedTime = d.toLocaleString("default", { hour: "numeric", minute: "numeric", hour12: true });
    return `${formattedDate} at ${formattedTime}`;
  };

  const startEdit = (rowKey, colKey, value) => {
    if (colKey === "is_active") {
      const v = (value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "active") ? "true" : "false";
      setEditing({ rowKey, colKey, value: v });
      return;
    }
    setEditing({ rowKey, colKey, value: String(value ?? "") });
  };

  const cancelEdit = () => {
    setEditing({ rowKey: null, colKey: null, value: "" });
  };

  const confirmEdit = async () => {
    if (!editing.rowKey || !editing.colKey) return;
    setSavingEdit(true);
    try {
      const applyForDept = async (id) => {
        if (editing.colKey === "name") {
          const newName = String(editing.value || "").trim();
          if (!newName) { throw new Error("Name is required"); }
          await api.put(`/departments/${id}`, { name: newName });
        } else if (editing.colKey === "is_active") {
          const newActive = (editing.value === "true" || editing.value === true);
          await api.put(`/departments/${id}`, { is_active: newActive });
        }
      };

      if (bulkColKey && bulkColKey === editing.colKey && selected.size > 0) {
        const ids = Array.from(selected);
        for (const id of ids) {
          await applyForDept(id);
        }
      } else {
        const row = rows.find(r => rowId(r) === editing.rowKey);
        const id = row?.id || editing.rowKey;
        await applyForDept(id);
      }
      await fetchRows();
      cancelEdit();
      setSelected(new Set());
      setBulkColKey(null);
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || err.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const openCreate = () => {
    setDialogMode("create");
    setEditingDept(null);
    setName("");
    setOpenDialog(true);
  };
  const openEdit = (dept) => {
    setDialogMode("edit");
    setEditingDept(dept);
    setName(dept?.name || "");
    setOpenDialog(true);
  };
  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (dialogMode === "create") {
        await api.post("/departments", { name: name.trim(), companyId });
        toast.success("Department created");
      } else if (dialogMode === "edit" && editingDept) {
        await api.put(`/departments/${editingDept.id}`, { name: name.trim() });
        toast.success("Department updated");
      }
      setOpenDialog(false);
      await fetchRows();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const confirmDelete = (dept) => { setDeleteTarget(dept); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.patch(`/departments/${deleteTarget.id}/inactivate`);
      toast.success("Department inactivated");
      setDeleteTarget(null);
      await fetchRows();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Inactivation failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col min-w-0 ml-4">
      <div className="sticky top-0 z-20 bg-white">
        <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4">
            <FiltersPanel columns={columns} onApply={applyAdvanced} onSave={() => { }} />
          </div>
          <div className="flex items-center gap-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search department" className="w-64" />
            <RequirePermission permission="department.create">
              <Button onClick={openCreate} className="flex items-center gap-2"><FiPlus /> Add Department</Button>
            </RequirePermission>
            <TableConfigPanel tableKey={"department"} onSaved={() => loadTableConfig()} />
          </div>
        </div>
        <div className="p-2 bg-white">
          <FilterChips
            columnFilters={columnFilters}
            advancedFilters={advancedFilters}
            onRemoveColumnFilter={(k) => onColumnFilterChange(k, null)}
            onClearAll={() => {
              const nextCols = {};
              const nextAdv = [];
              setColumnFilters(nextCols);
              setAdvancedFilters(nextAdv);
              setQuery("");
              setPage(1);
              fetchRows({ columnFilters: nextCols, advancedFilters: nextAdv, query: "", page: 1 });
            }}
          />
        </div>
      </div>

      <div className="flex-1 bg-white">
        <div className="border rounded overflow-hidden">
          <div className="relative h-[70vh] overflow-x-auto overflow-y-auto">
            <Table className="min-w-max">
              <TableHeader className="sticky top-0 z-30 bg-card">
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-30 bg-card border-r w-40 min-w-[10rem]">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                      <span className="text-xs">Select</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Toggle column search" onClick={() => setShowColumnSearch(s => !s)}>
                            <FiSearch />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle column search</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  {columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => (
                    <TableHead
                      key={c.key}
                      className={`sticky top-0 group bg-card ${idx === 0 ? "left-40 z-20 border-r" : ""}`}
                      onContextMenu={(e) => { e.preventDefault(); setHeaderMenuFor(c.key); }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{c.label}</span>
                        <DropdownMenu open={headerMenuFor === c.key} onOpenChange={(open) => setHeaderMenuFor(open ? c.key : null)}>
                          <DropdownMenuTrigger asChild>
                            <h2 className="p-2 cursor-pointer hover:bg-sky-200 rounded-full flex items-center">
                              <HiOutlineDotsVertical className="opacity-0 group-hover:opacity-100" />
                            </h2>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSort({ key: c.key, dir: "asc" })}>Sort A → Z</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort({ key: c.key, dir: "desc" })}>Sort Z → A</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                {showColumnSearch && (
                  <ColumnSearchRow
                    stickyFirstDataColumn={true}
                    stickyOffsetClass="left-40"
                    leadingStickyWidthClass="w-40 min-w-[10rem]"
                    columns={columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))}
                    columnFilters={columnFilters}
                    onChange={onColumnFilterChange}
                  />
                )}
              </TableHeader>
              <TableBody className={"border-b"}>
                {loading ? (
                  <TableRow><TableCell colSpan={columns.length + 1}>Loading…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length + 1}>No departments found.</TableCell></TableRow>
                ) : sortedRows.map((d, i) => (
                  <TableRow key={d.id || i} className={`group ${selected.has(rowId(d)) ? "bg-sky-100" : (i % 2 === 1 ? "bg-gray-50" : "")} hover:bg-sky-100`}>
                    <TableCell className={`sticky left-0 z-20 border-r w-40 min-w-[10rem] bg-white z-10 ${selected.has(rowId(d)) ? "bg-sky-100" : (i % 2 === 1 ? "bg-gray-100" : "bg-white")} group-hover:bg-sky-100 hover:bg-sky-200`}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selected.has(rowId(d))} onCheckedChange={() => toggleOne(rowId(d))} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="xs" onClick={() => openPreview(d)} aria-label="Preview"><FiInfo className="text-gray-400" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className='px-1' variant="outline" size="xs">⋯</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <RequirePermission permission="department.update">
                              <DropdownMenuItem onClick={() => openEdit(d)}><FiEdit2 /> Edit</DropdownMenuItem>
                            </RequirePermission>
                            {/* <RequirePermission permission="department.update">
                              <DropdownMenuItem onClick={() => { setBulkColKey("is_active"); startEdit(rowId(d), "is_active", d.is_active); }}><FiCheck /> Set Active</DropdownMenuItem>
                            </RequirePermission>
                            <RequirePermission permission="department.update">
                              <DropdownMenuItem onClick={() => { setBulkColKey("is_active"); startEdit(rowId(d), "is_active", !d.is_active); }}><FiX /> Set Inactive</DropdownMenuItem>
                            </RequirePermission> */}
                            {/* <RequirePermission permission="department.update">
                              <DropdownMenuItem onClick={() => { setBulkColKey("name"); startEdit(rowId(d), "name", d.name); }}><FiEdit2 /> Edit Name</DropdownMenuItem>
                            </RequirePermission> */}
                            <RequirePermission permission="department.makeInactive">
                              <DropdownMenuItem onClick={() => confirmDelete(d)}><FiTrash2 /> Inactivate</DropdownMenuItem>
                            </RequirePermission>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    {columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => {
                      const val = d[c.key];
                      const isEditingCell = editing.rowKey === rowId(d) && editing.colKey === c.key;
                      if (c.key === "is_active") {
                        return (
                          <TableCell key={c.key} className={`${idx === 0 ? "sticky left-40 z-10 border-r bg-white" : ""}`}>
                            {isEditingCell ? (
                              <div className="flex items-center gap-2">
                                <Button size="xs" variant="outline" onClick={() => setEditing({ rowKey: rowId(d), colKey: "is_active", value: "true" })}><FiCheck /> Active</Button>
                                <Button size="xs" variant="outline" onClick={() => setEditing({ rowKey: rowId(d), colKey: "is_active", value: "false" })}><FiX /> Inactive</Button>
                                <Button size="xs" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                <Button size="xs" onClick={confirmEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save"}</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{d.is_active ? "Active" : "Inactive"}</span>
                                {/* <RequirePermission permission="department.update">
                                  <Button size="xs" variant="ghost" onClick={() => startEdit(rowId(d), "is_active", d.is_active)}>Edit</Button>
                                </RequirePermission> */}
                              </div>
                            )}
                          </TableCell>
                        );
                      }
                      if (c.key === "name") {
                        return (
                          <TableCell key={c.key} className={`${idx === 0 ? "sticky left-40 z-10 border-r bg-white" : ""}`}>
                            {isEditingCell ? (
                              <div className="flex items-center gap-2">
                                <Input value={editing.value} onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))} className="w-64" />
                                <Button size="xs" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                <Button size="xs" onClick={confirmEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save"}</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{String(val ?? "")}</span>
                                <RequirePermission permission="department.update">
                                  {/* <Button size="xs" variant="ghost" onClick={() => startEdit(rowId(d), "name", d.name)}>Edit</Button>ś */}
                                </RequirePermission>
                              </div>
                            )}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={c.key} className={`${idx === 0 ? "sticky left-40 z-10 border-r" : ""}`}>
                          {c.type === "date" && val ? dateTimeFormator(val) : String(val ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="my-4 bg-white flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing page {meta.page} of {meta.totalPages} — {meta.total} departments</div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add Department" : "Edit Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Name</span>
              <span>{previewItem?.name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Active</span>
              <span>{previewItem?.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Created At</span>
              <span>{previewItem?.created_at ? dateTimeFormator(previewItem.created_at) : "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Updated At</span>
              <span>{previewItem?.updated_at ? dateTimeFormator(previewItem.updated_at) : "-"}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inactivate Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>Are you sure you want to inactivate <span className="font-medium">{deleteTarget?.name}</span>?</div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Inactivating..." : "Inactivate"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
