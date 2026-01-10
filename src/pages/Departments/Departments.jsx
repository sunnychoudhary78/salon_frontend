// src/components/Departments.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
    AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiInfo, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import RequirePermission from "@/components/common/RequirePermission";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import ColumnSearchRow from "@/components/ColumnSearchRow";
import FiltersPanel from "@/components/FiltersPanel";
import FilterChips from "@/components/FilterChips";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import TableConfigPanel from "@/components/config/TableConfigPanel";


export default function Departments({ staticFilters = {}, className } = {}) {

    useEffect(() => {
        document.title = "Departments | Immortal LMS";
    }, []);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    // dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState("create"); // "create" | "edit"
    const [editingDept, setEditingDept] = useState(null); // { id, name } or null

    // form state
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    // delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // simple search
    const [query, setQuery] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");

    // table states
    const [columns, setColumns] = useState([
        { key: 'name', label: 'Name', visible: true, order: 1 },
        { key: 'is_active', label: 'Active', type: 'boolean', visible: true, order: 2 },
        { key: 'created_at', label: 'Created At', type: 'date', visible: true, order: 3 },
        { key: 'updated_at', label: 'Updated At', type: 'date', visible: true, order: 4 },
        { key: 'created_by', label: 'Created By', visible: true, order: 5 },
        { key: 'updated_by', label: 'Updated By', visible: true, order: 6 },
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
    const sortedRows = React.useMemo(() => {
        if (!sort.key || !sort.dir) return rows;
        const arr = [...rows];
        arr.sort((a, b) => {
            const av = a[sort.key];
            const bv = b[sort.key];
            const as = av == null ? "" : String(av);
            const bs = bv == null ? "" : String(bv);
            return sort.dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
        });
        return arr;
    }, [rows, sort]);

    const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, colKey: null, colLabel: null, value: null });
    const closeCtx = () => setCtx(prev => ({ ...prev, open: false }));
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [editing, setEditing] = useState({ rowKey: null, colKey: null, value: '' });
    const [savingEdit, setSavingEdit] = useState(false);
    const [bulkColKey, setBulkColKey] = useState(null);
    const [headerMenuFor, setHeaderMenuFor] = useState(null);


    // fetch departments
    const fetchDepartments = async (overrides = {}) => {
        setLoading(true);
        try {
            const res = await api.post('/departments/query', {
                page,
                limit,
                query,
                statusFilter,
                columnFilters,
                advancedFilters,
                ...staticFilters,
                ...overrides,
            });
            const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
            const meta = res?.data?.meta || { page, limit, total: rows.length, totalPages: 1 };
            setRows(rows);
            setMeta(meta);
        } catch (err) {
            console.error("Failed to fetch departments", err);
            toast?.error?.("Failed to load departments");
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
        await fetchDepartments({ page: 1 });
    };

    const initialLoadedRef = useRef(false);
    useEffect(() => {
        if (initialLoadedRef.current) {
            fetchDepartments();
        } else {
            initialLoadedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page, limit, JSON.stringify(staticFilters)]);

    useEffect(() => {
        const t = setTimeout(() => { loadTableConfig(); }, 100);
        return () => clearTimeout(t);
    }, []);


    // open create dialog
    const openCreate = () => {
        setDialogMode("create");
        setEditingDept(null);
        setName("");
        setOpenDialog(true);
    };

    // open edit dialog
    const openEdit = (dept) => {
        setDialogMode("edit");
        setEditingDept(dept);
        setName(dept?.name || "");
        setOpenDialog(true);
    };

    // create or update handler
    const handleSave = async (e) => {
        e?.preventDefault?.();
        if (!name || !name.trim()) {
            toast?.error?.("Name is required");
            return;
        }
        setSaving(true);
        try {
            if (dialogMode === "create") {
                const cid = staticFilters?.company_id || staticFilters?.companyId;
                const payload = cid ? { name: name.trim(), company_id: cid } : { name: name.trim() };
                await api.post("/departments", payload);
                toast?.success?.("Department created");
            } else if (dialogMode === "edit" && editingDept) {
                await api.put(`/departments/${editingDept.id}`, { name: name.trim() });
                toast?.success?.("Department updated");
            }
            setOpenDialog(false);
            await fetchDepartments();
        } catch (err) {
            console.error("Save department error", err);
            const msg = err?.response?.data?.message || err.message || "Save failed";
            toast?.error?.(msg);
        } finally {
            setSaving(false);
        }
    };

    // delete handler
    const confirmDelete = (dept) => {
        setDeleteTarget(dept);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.patch(`/departments/${deleteTarget.id}/inactivate`);
            toast?.success?.("Department inactivated");
            setDeleteTarget(null);
            await fetchDepartments();
        } catch (err) {
            console.error("Inactivate department error", err);
            toast?.error?.(err?.response?.data?.message || "Inactivation failed");
        } finally {
            setDeleting(false);
        }
    };
    // filter + paginate
    useEffect(() => {
        const q = String(query || '').trim();
        if (!q) return;
        const t = setTimeout(() => { fetchDepartments({ page: 1 }); }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const onColumnFilterChange = (key, spec) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            if (!spec || spec.value === '' || typeof spec.value === 'undefined' || spec.value === null) {
                delete next[key];
            } else next[key] = spec;
            // trigger server fetch with latest filters
            fetchDepartments({ columnFilters: next, page: 1 });
            return next;
        });
        setPage(1);
    };

    const applyAdvanced = (filters) => {
        const next = filters || [];
        setAdvancedFilters(next);
        setPage(1);
        fetchDepartments({ advancedFilters: next, page: 1 });
    };

    const dateTimeFormator = (date) => {
        const d = new Date(date);
        const formattedDate = d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
        const formattedTime = d.toLocaleString("default", { hour: "numeric", minute: "numeric", hour12: true });
        return `${formattedDate} at ${formattedTime}`;
    }

    const startEdit = (rowKey, colKey, value) => {
        if (colKey === 'is_active') {
            const v = (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'active') ? 'true' : 'false';
            setEditing({ rowKey, colKey, value: v });
            return;
        }
        setEditing({ rowKey, colKey, value: String(value ?? '') });
    };

    const cancelEdit = () => {
        setEditing({ rowKey: null, colKey: null, value: '' });
    };

    const confirmEdit = async () => {
        if (!editing.rowKey || !editing.colKey) return;
        setSavingEdit(true);
        try {
            const applyForDept = async (id) => {
                if (editing.colKey === 'name') {
                    const newName = String(editing.value || '').trim();
                    if (!newName) { throw new Error('Name is required'); }
                    await api.put(`/departments/${id}`, { name: newName });
                } else if (editing.colKey === 'is_active') {
                    const newActive = (editing.value === 'true' || editing.value === true);
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
            await fetchDepartments();
            cancelEdit();
            setSelected(new Set());
            setBulkColKey(null);
        } catch (err) {
            toast?.error?.(err?.response?.data?.message || err.message || 'Update failed');
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <section className={`flex flex-col min-w-0 ml-4 ${className || "min-h-screen"}`}>
            {/* header + filters */}
            <div className="sticky top-0 z-20 bg-white shrink-0">
                <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <FiltersPanel columns={columns} onApply={applyAdvanced} onSave={() => { }} />

                    </div>
                    <div className="flex items-center gap-3">



                        <RequirePermission permission="department.create">
                            <Button onClick={openCreate} className="flex items-center gap-2"><FiPlus /> Add Department</Button>
                        </RequirePermission>
                        <TableConfigPanel tableKey={'department'} onSaved={() => loadTableConfig()} />
                    </div>
                </div>
                <div className="p-2 bg-white">
                    <FilterChips columnFilters={columnFilters} advancedFilters={advancedFilters} onRemoveColumnFilter={(k) => onColumnFilterChange(k, null)} onClearAll={() => { const nextCols = {}; const nextAdv = []; setColumnFilters(nextCols); setAdvancedFilters(nextAdv); setQuery(''); setPage(1); fetchDepartments({ columnFilters: nextCols, advancedFilters: nextAdv, query: '', page: 1 }); }} />
                </div>
            </div>

            {/* table content */}
            <div className="flex-1 bg-white flex flex-col min-h-0">
                <div className="border rounded overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className='relative flex-1 overflow-x-auto overflow-y-auto'>
                        <Table className="min-w-max">
                            <TableHeader className="sticky top-0 z-30 bg-card">
                                <TableRow>
                                    <TableHead className="sticky top-0 left-0 z-30 bg-card shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem]">
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
                                        <TableHead key={c.key} className={`sticky top-0 group bg-card ${idx === 0 ? 'left-40 z-20 shadow-[1px_0_0_0_#e5e7eb]' : ''}`} onContextMenu={(e) => { e.preventDefault(); setHeaderMenuFor(c.key); }}>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate">{c.label}</span>
                                                <DropdownMenu open={headerMenuFor === c.key} onOpenChange={(open) => setHeaderMenuFor(open ? c.key : null)}>
                                                    <DropdownMenuTrigger asChild>
                                                        <h2 className='p-2 cursor-pointer hover:bg-sky-200 rounded-full flex items-center'>
                                                            <HiOutlineDotsVertical className='opacity-0 group-hover:opacity-100 ' />
                                                        </h2>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => setSort({ key: c.key, dir: 'asc' })}>Sort A → Z</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setSort({ key: c.key, dir: 'desc' })}>Sort Z → A</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                                {showColumnSearch && <ColumnSearchRow stickyFirstDataColumn={true} stickyOffsetClass="left-40" leadingStickyWidthClass="w-40 min-w-[10rem] border-none shadow-[1px_0_0_0_#e5e7eb]" columns={columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))} columnFilters={columnFilters} onChange={onColumnFilterChange} />}
                            </TableHeader>

                            <TableBody className={'border-b'}>
                                {loading ? (
                                    <TableRow><TableCell colSpan={columns.length + 1}>Loading…</TableCell></TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow><TableCell colSpan={columns.length + 1}>No departments found.</TableCell></TableRow>
                                ) : sortedRows.map((d, i) => (
                                    <TableRow key={d.id || i} className={`group ${selected.has(rowId(d)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-100`}>
                                        <TableCell className={`sticky left-0 z-20 shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem] ${selected.has(rowId(d)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200`}>
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={selected.has(rowId(d))} onCheckedChange={() => toggleOne(rowId(d))} />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button className={''} variant="outline" size="xs" onClick={() => openPreview(d)} aria-label="Preview"><FiInfo className='text-gray-400' /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Preview</TooltipContent>
                                                </Tooltip>
                                                {/* <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">⋯</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <RequirePermission permission="department.update">
                                                            <DropdownMenuItem onClick={() => openEdit(d)}><FiEdit2 /> Edit</DropdownMenuItem>
                                                        </RequirePermission>
                                                        <RequirePermission permission="department.makeInactive">
                                                            <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(d)}><FiTrash2 /> Inactivate</DropdownMenuItem>
                                                        </RequirePermission>
                                                    </DropdownMenuContent>
                                                </DropdownMenu> */}
                                            </div>
                                        </TableCell>
                                        {columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => {
                                            const rk = rowId(d);
                                            const v = d[c.key];
                                            const isEditing = editing.rowKey === rk && editing.colKey === c.key;
                                            const cellBase = (idx === 0 ? `sticky left-40 z-10 shadow-[1px_0_0_0_#e5e7eb] ${selected.has(rowId(d)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200` : 'hover:bg-sky-200');
                                            const ring = (bulkColKey === c.key && selected.has(rowId(d))) ? ' ring-2 ring-sky-400' : '';
                                            return (
                                                <TableCell
                                                    key={c.key}
                                                    onContextMenu={(e) => { e.preventDefault(); const val = d[c.key]; setCtx({ open: true, x: e.clientX, y: e.clientY, colKey: c.key, colLabel: c.label, value: val }); }}
                                                    onDoubleClick={c.key === 'name' ? () => startEdit(rk, c.key, v) : (c.key === 'is_active' ? () => startEdit(rk, c.key, v) : () => openEdit(d))}
                                                    onClick={(e) => { if (e.ctrlKey) { setBulkColKey(c.key); toggleOne(rowId(d)); } }}
                                                    className={cellBase + ring}
                                                >
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            {c.key === 'is_active' ? (
                                                                <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                                                    <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="true">Active</SelectItem>
                                                                        <SelectItem value="false">Inactive</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Input value={editing.value} onChange={(e) => setEditing(s => ({ ...s, value: e.target.value }))} className="h-8 w-48" />
                                                            )}
                                                            <Button variant="secondary" size="xs" onClick={confirmEdit} disabled={savingEdit} aria-label="Save"><FiCheck /></Button>
                                                            <Button variant="outline" size="xs" onClick={cancelEdit} disabled={savingEdit} aria-label="Cancel"><FiX /></Button>
                                                        </div>
                                                    ) : (
                                                        c.key === 'is_active' ? (d.is_active ? 'Active' : 'Inactive') : (
                                                            c.key === 'created_at' ? (d.created_at ? dateTimeFormator(d.created_at) : '-') : (
                                                                c.key === 'updated_at' ? (d.updated_at ? dateTimeFormator(d.updated_at) : '-') : (d[c.key] ?? '-')
                                                            )
                                                        )
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {ctx.open && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={closeCtx} />
                                <div className="fixed z-50 bg-card border rounded shadow-md min-w-[14rem]" style={{ left: ctx.x, top: ctx.y }}>
                                    <div className="px-3 py-2 text-xs border-b">{ctx.colLabel}</div>
                                    <button className="block w-full text-left px-3 py-2 hover:bg-selected" onClick={() => { onColumnFilterChange(ctx.colKey, { op: 'eq', value: ctx.value }); closeCtx(); }}>Show matching</button>
                                    <button className="block w-full text-left px-3 py-2 hover:bg-selected" onClick={() => { onColumnFilterChange(ctx.colKey, { op: 'ne', value: ctx.value }); closeCtx(); }}>Filter out</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* pagination */}
            <div className="sticky bottom-0 z-20 p-4 bg-white flex items-center justify-between shrink-0">
                <div>Showing page {meta.page} of {meta.totalPages} — {meta.total} total</div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2"><label>Per page:</label>
                        <select value={String(limit)} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                            {[10, 20, 50, 100].map(n => (<option key={n} value={String(n)}>{n}</option>))}
                        </select>
                    </div>

                    <Button onClick={() => setPage(p => { const np = Math.max(1, p - 1); return np; })} disabled={page <= 1}>Prev</Button>
                    <div>{page}</div>
                    <Button onClick={() => setPage(p => { const np = p < meta.totalPages ? p + 1 : p; return np; })} disabled={page >= meta.totalPages}>Next</Button>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogMode === "create" ? "Create Department" : "Edit Department"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <Label>Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Department name"
                                className="mt-1"
                                autoFocus
                                required
                            />
                        </div>

                        <DialogFooter className="flex items-center justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? "Saving…" : (dialogMode === "create" ? "Create" : "Save")}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogTitle>Inactivate department?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to inactivate <strong>{deleteTarget?.name}</strong>?
                        You can reactivate it later.
                    </AlertDialogDescription>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={previewOpen} onOpenChange={(o) => { if (!o) closePreview(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Department Preview</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                        {previewItem ? (
                            <div className="space-y-2">
                                <div><span className="">Name:</span> {previewItem.name ?? '-'}</div>
                                <div><span className="">Active:</span> {previewItem.is_active ? 'Active' : 'Inactive'}</div>
                                <div><span className="">Created:</span> {previewItem.created_at ? dateTimeFormator(previewItem.created_at) : '-'}</div>
                                <div className='mt-3'>
                                    <RequirePermission permission="department.update">
                                        <Button size="sm" onClick={() => { if (previewItem) { openEdit(previewItem); setPreviewOpen(false); } }}><FiEdit2 /> Edit</Button>
                                    </RequirePermission>
                                </div>
                            </div>
                        ) : '—'}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
