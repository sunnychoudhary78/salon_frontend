import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddAdminDialog from "@/components/AddAdminDialog";
import RequirePermission from "@/components/common/RequirePermission";
import api from "@/api/axios";
import { toast } from "react-hot-toast";
import { Search as FiSearch, Info as FiInfo } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import ColumnSearchRow from "@/components/ColumnSearchRow";
import FiltersPanel from "@/components/FiltersPanel";
import FilterChips from "@/components/FilterChips";
import TableConfigPanel from "@/components/config/TableConfigPanel";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default function AdminsPage() {
  useEffect(() => { document.title = "Admins | Immortal LMS"; }, []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(() => new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
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

  const [showColumnSearch, setShowColumnSearch] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [tableConfig, setTableConfig] = useState(null);
  const adminColumns = [
    { key: "name", label: "Name", type: "string" },
    { key: "email", label: "Email", type: "string" },
    { key: "role", label: "Role", type: "string" },
    { key: "hierarchy", label: "Hierarchy", type: "number" },
  ];
  const visibleColumns = (() => {
    if (!Array.isArray(tableConfig) || tableConfig.length === 0) return adminColumns;
    const m = Object.fromEntries(tableConfig.map(c => [c.key, c]));
    const ordered = tableConfig.slice().sort((a, b) => Number(a.order) - Number(b.order));
    const list = ordered
      .filter(c => c.visible !== false)
      .map(c => adminColumns.find(ac => ac.key === c.key))
      .filter(Boolean);
    const missing = adminColumns.filter(ac => !m[ac.key]);
    return [...list, ...missing];
  })();

  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const res = await api.get(`/table-configs?table=${encodeURIComponent("admins")}`);
        const cfg = res?.data?.config?.config;
        if (!cancelled && Array.isArray(cfg)) setTableConfig(cfg);
      } catch {}
    };
    loadConfig();
    return () => { cancelled = true; };
  }, []);

  const onColumnFilterChange = (key, spec) => {
    // If the value is empty, remove the filter entirely
    if (spec.value === "" || spec.value === null || spec.value === undefined) {
      setColumnFilters(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setColumnFilters(prev => ({ ...prev, [key]: spec }));
    }
    setPage(1);
  };
  const applyAdvanced = (adv) => {
    setAdvancedFilters(Array.isArray(adv) ? adv : []);
    setPage(1);
  };
  const removeColumnFilter = (key) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  };
  const clearAllFilters = () => {
    setColumnFilters({});
    setAdvancedFilters([]);
    setPage(1);
  };
  const getVal = (u, key) => {
    if (key === "name") return String(u?.name || "");
    if (key === "email") return String(u?.email || "");
    if (key === "role") return String(u?.Role?.name || "");
    if (key === "hierarchy") return typeof u?.Role?.hierarchy_level === "number" ? u.Role.hierarchy_level : null;
    return "";
  };
  const applySpec = (val, spec, type) => {
    if (!spec || typeof spec !== "object") return true;
    const op = (spec?.op || "contains");
    const v = spec?.value;
    if (v == null) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (type === "number") {
      const num = typeof val === "number" ? val : Number(val);
      if (v === '' || v == null) return true;
      if (op === "eq") return num === Number(v);
      if (op === "ne") return num !== Number(v);
      if (op === "gt") return num > Number(v);
      if (op === "lt") return num < Number(v);
      return true;
    }
    const s = String(val || "");
    const t = String(v || "").trim();
    if (t === "") return true;
    if (op === "eq") return s.toLowerCase() === t.toLowerCase();
    if (op === "ne") return s.toLowerCase() !== t.toLowerCase();
    if (op === "contains") return s.toLowerCase().includes(t.toLowerCase());
    if (op === "isEmpty") return s === "";
    if (op === "isNotEmpty") return s !== "";
    return true;
  };

  const fetchAdmins = async (overrides = {}) => {
    setLoading(true);
    try {
      const [usersRes, employeeUsersRes] = await Promise.all([
        api.get("/users").catch(() => null),
        api.post("/employees/query", { page: 1, limit: 5000, columns: [{ key: "user_id" }] }).catch(() => null),
      ]);
      const users = Array.isArray(usersRes?.data?.users) ? usersRes.data.users : (Array.isArray(usersRes?.data) ? usersRes.data : []);
      const employeeRows = Array.isArray(employeeUsersRes?.data?.rows) ? employeeUsersRes.data.rows : [];
      const employeeUserIds = new Set(employeeRows.map(r => r.user_id).filter(Boolean));
      const admins = users.filter(u => {
        const roleName = (u?.Role?.name || "").toLowerCase();
        const level = typeof u?.Role?.hierarchy_level === "number" ? u.Role.hierarchy_level : null;
        const isAdminByName = roleName.includes("admin");
        const isAdminByHierarchy = level != null ? level <= 200 : false;
        const hasEmployeeDetail = employeeUserIds.has(u.id);
        return (isAdminByName || isAdminByHierarchy) && !hasEmployeeDetail;
      });
      const q = String(overrides.query ?? query ?? "").trim().toLowerCase();
      let filtered = q ? admins.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)) : admins;
      const cfKeys = Object.keys(columnFilters || {});
      if (cfKeys.length > 0) {
        filtered = filtered.filter(u => cfKeys.every(k => {
          const col = adminColumns.find(c => c.key === k);
          if (!col) return true;
          const val = getVal(u, k);
          return applySpec(val, columnFilters[k], col.type);
        }));
      }
      if (Array.isArray(advancedFilters) && advancedFilters.length > 0) {
        filtered = filtered.filter(u => advancedFilters.every(f => {
          const col = adminColumns.find(c => c.key === f.field);
          if (!col) return true;
          const val = getVal(u, f.field);
          const spec = { op: f.op, value: f.value };
          return applySpec(val, spec, col.type);
        }));
      }
      if (sort?.key) {
        const col = adminColumns.find(c => c.key === sort.key);
        if (col) {
          const dir = sort.dir === "desc" ? -1 : 1;
          filtered = filtered.slice().sort((a, b) => {
            const va = getVal(a, col.key);
            const vb = getVal(b, col.key);
            if (col.type === "number") {
              const na = typeof va === "number" ? va : Number(va);
              const nb = typeof vb === "number" ? vb : Number(vb);
              return (na - nb) * dir;
            }
            const sa = String(va || "").toLowerCase();
            const sb = String(vb || "").toLowerCase();
            if (sa < sb) return -1 * dir;
            if (sa > sb) return 1 * dir;
            return 0;
          });
        }
      }
      const total = filtered.length;
      const p = Number(overrides.page ?? page);
      const l = Number(overrides.limit ?? limit);
      const start = (p - 1) * l;
      const pageRows = filtered.slice(start, start + l);
      setRows(pageRows);
      setMeta({ page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)) });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (u) => {
    setPreviewOpen(true);
    setPreviewItem(null);
    setPreviewLoading(true);
    try {
      const res = await api.get(`/users/${u.id}`);
      const data = res?.data?.user ?? res?.data ?? null;
      setPreviewItem(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load user");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };
  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewItem(null);
    setPreviewLoading(false);
  };

  const openEdit = async (u) => {
    setEditItem(u);
    setEditName(u?.name || "");
    setEditEmail(u?.email || "");
    const currentRoleId = String(u?.Role?.id ?? u?.roleId ?? "");
    setEditRoleId(currentRoleId);
    setEditOpen(true);
    try {
      const res = await api.get("/roles");
      const list = Array.isArray(res.data) ? res.data : (res.data?.roles || []);
      const normalized = list.map(r => ({ id: String(r.id ?? r.role_id ?? r.id), name: String(r.name ?? r.role_name ?? r.name) }));
      setRoles(normalized);
      if (!currentRoleId) {
        const sameName = normalized.find(r => String(r.name).toLowerCase() === String(u?.Role?.name || "").toLowerCase());
        if (sameName) setEditRoleId(String(sameName.id));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load roles");
    }
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditItem(null);
    setEditName("");
    setEditEmail("");
    setEditRoleId("");
    setRoles([]);
    setSavingEdit(false);
  };
  const saveEdit = async () => {
    if (!editItem?.id) return;
    if (!editName.trim() || !editEmail.trim() || !editRoleId) {
      toast.error("Fill all fields");
      return;
    }
    setSavingEdit(true);
    try {
      await api.put(`/users/${editItem.id}`, { name: editName, email: editEmail, roleId: editRoleId });
      toast.success("User updated");
      closeEdit();
      fetchAdmins({ page, limit, query });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => { fetchAdmins({ page, limit }); }, [page, limit]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchAdmins({ page: 1, query }); }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { fetchAdmins({ page, limit, query }); }, [sort]);
  useEffect(() => { fetchAdmins({ page, limit, query }); }, [columnFilters, advancedFilters]);

  const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, item: null });
  const closeCtx = () => setCtx(prev => ({ ...prev, open: false }));
  const onRowContextMenu = (e, u) => {
    e.preventDefault();
    setCtx({ open: true, x: e.clientX, y: e.clientY, item: u });
  };
  const copyEmail = async () => {
    try {
      if (ctx.item?.email) await navigator.clipboard.writeText(ctx.item.email);
      closeCtx();
    } catch {
      closeCtx();
    }
  };

  const headerSortMenu = (colKey) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreVertical /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => { setSort({ key: colKey, dir: 'asc' }); setPage(1); }}>A to Z</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setSort({ key: colKey, dir: 'desc' }); setPage(1); }}>Z to A</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setSort({ key: null, dir: 'asc' }); setPage(1); }}>Clear Sort</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <section className="min-h-screen flex flex-col min-w-0 ml-4">
      <div className="sticky top-0 z-20 bg-white">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search admin" className="w-64" />
          </div>
          <div className="flex items-center gap-2">
            <AddAdminDialog onCreated={() => fetchAdmins({ page: 1, query })} />
            <TableConfigPanel tableKey="admins" initialColumns={adminColumns.map(c => ({ key: c.key, label: c.label }))} onSaved={() => {
              api.get(`/table-configs?table=${encodeURIComponent("admins")}`).then(res => {
                const cfg = res?.data?.config?.config;
                if (Array.isArray(cfg)) setTableConfig(cfg);
              }).catch(() => {});
            }} />
            <FiltersPanel columns={adminColumns} onApply={applyAdvanced} />
          </div>
        </div>
        <div className="px-4 pb-2">
          <FilterChips
            columnFilters={columnFilters}
            advancedFilters={advancedFilters}
            onRemoveColumnFilter={removeColumnFilter}
            onClearAll={clearAllFilters}
          />
        </div>
      </div>
      <div className="flex-1 bg-white">
        <div className="border rounded overflow-hidden h-[70vh]">
          <div className="relative h-full overflow-x-auto overflow-y-auto">
            <Table className="min-w-max">
              <TableHeader className="sticky top-0 z-30 bg-white">
                <TableRow>
                  <TableHead className="sticky left-0 z-30 bg-white shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem]">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                      <span className="text-xs">Select</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setShowColumnSearch(v => !v)}><FiSearch /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle column search</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  {visibleColumns.map(c => (
                    <TableHead key={c.key}>
                      <div className="flex items-center justify-between">
                        <span>{c.label}</span>
                        {headerSortMenu(c.key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                {showColumnSearch ? (
                  <ColumnSearchRow
                    columns={visibleColumns}
                    columnFilters={columnFilters}
                    onChange={onColumnFilterChange}
                    stickyFirstDataColumn
                    stickyOffsetClass="left-40"
                    leadingStickyPlaceholder
                    leadingStickyWidthClass="w-40 min-w-[10rem] border-none shadow-[1px_0_0_0_#e5e7eb]"
                  />
                ) : null}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No admins</TableCell></TableRow>
                ) : rows.map((u, i) => (
                  <TableRow
                    key={u.id || i}
                    className={`group ${selected.has(rowId(u)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-100`}
                    onDoubleClick={() => openEdit(u)}
                    onContextMenu={(e) => onRowContextMenu(e, u)}
                  >
                    <TableCell className={`sticky left-0 z-20 shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem] ${selected.has(rowId(u)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200`}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selected.has(rowId(u))} onCheckedChange={() => toggleOne(rowId(u))} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="xs" aria-label="Preview" onClick={() => openPreview(u)}>
                              <FiInfo />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    {visibleColumns.map(c => {
                      if (c.key === "name") return <TableCell key="name">{u.name || "-"}</TableCell>;
                      if (c.key === "email") return <TableCell key="email">{u.email || "-"}</TableCell>;
                      if (c.key === "role") return <TableCell key="role">{u?.Role?.name || "-"}</TableCell>;
                      if (c.key === "hierarchy") return <TableCell key="hierarchy">{typeof u?.Role?.hierarchy_level === "number" ? String(u.Role.hierarchy_level) : "-"}</TableCell>;
                      return null;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ctx.open ? (
              <>
                <div className="fixed inset-0 z-40" onClick={closeCtx} />
                <div className="fixed z-50 bg-white border rounded shadow min-w-[180px]" style={{ left: ctx.x, top: ctx.y }}>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { openPreview(ctx.item); closeCtx(); }}>Preview</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { openEdit(ctx.item); closeCtx(); }}>Edit</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={copyEmail}>Copy Email</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="my-4 bg-white flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing page {meta.page} of {meta.totalPages} — {meta.total} admins</div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
        </div>
      </div>
      <Dialog open={previewOpen} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Preview</DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="py-6 text-center text-gray-600">Loading…</div>
          ) : previewItem ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Name</span>
                <span>{previewItem?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Email</span>
                <span>{previewItem?.email || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Role</span>
                <span>{previewItem?.Role?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Hierarchy</span>
                <span>{typeof previewItem?.Role?.hierarchy_level === "number" ? String(previewItem.Role.hierarchy_level) : "-"}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={closePreview}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-600">No data</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) closeEdit(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Role</label>
              <Select value={editRoleId} onValueChange={setEditRoleId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeEdit}>Cancel</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
