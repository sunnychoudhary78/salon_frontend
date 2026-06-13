import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FiPlus, FiSearch, FiInfo, FiCheck, FiX, FiTrash2 } from "react-icons/fi";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import RequirePermission from "@/components/common/RequirePermission";
import ColumnSearchRow from "@/components/ColumnSearchRow";
import FiltersPanel from "@/components/FiltersPanel";
import FilterChips from "@/components/FilterChips";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useSearchParams } from "react-router-dom";
import TableConfigPanel from "@/components/config/TableConfigPanel";

export default function Variables() {

  useEffect(() => {
    document.title = "Variables | Immortal LMS";
  }, []);

  // top-level tab: "blood" | "marital" | "gender"
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab");
    return ["blood", "marital", "gender"].includes(t) ? t : "blood";
  })();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== tab && ["blood", "marital", "gender"].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", tab);
    setSearchParams(sp, { replace: true });
  }, [tab]);

  // Generic State for the current table
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [columns, setColumns] = useState([]);
  const [showColumnSearch, setShowColumnSearch] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(new Set());
  const [sort, setSort] = useState({ key: null, dir: null });
  const [editing, setEditing] = useState({ rowKey: null, colKey: null, value: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [bulkColKey, setBulkColKey] = useState(null);
  const [headerMenuFor, setHeaderMenuFor] = useState(null);
  const [rowContextMenu, setRowContextMenu] = useState({ open: false, x: 0, y: 0, row: null });

  // Close context menu on global click
  useEffect(() => {
    const closeMenu = () => setRowContextMenu(prev => {
      if (!prev.open) return prev;
      return { ...prev, open: false };
    });
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', label: '', description: '', rh_positive: false, is_active: true });

  const rowId = (r) => r.id;
  const allSelected = selected.size > 0 && data.every((r) => selected.has(rowId(r)));

  const toggleAll = () => {
    setSelected(prev => {
      if (data.length === 0) return prev;
      const next = new Set(prev);
      const all = data.map(rowId);
      const isAll = all.every(id => next.has(id));
      if (isAll) { all.forEach(id => next.delete(id)); } else { all.forEach(id => next.add(id)); }
      return next;
    });
  };

  const toggleOne = (id) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const getEndpoint = () => {
    if (tab === 'blood') return '/blood-groups';
    if (tab === 'marital') return '/marital-statuses';
    if (tab === 'gender') return '/genders';
    return '';
  };

  const getTableKey = () => {
    if (tab === 'blood') return 'blood_groups';
    if (tab === 'marital') return 'marital_statuses';
    if (tab === 'gender') return 'genders';
    return '';
  };

  const loadTableConfig = async () => {
    try {
      const res = await api.get(`/table-configs?table=${getTableKey()}`);
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
      } else if (registry.length > 0) {
        const defaults = registry.map((r, idx) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: idx + 1 }));
        setColumns(defaults);
      }
    } catch (err) { console.error(err) }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        page,
        limit,
        search: query,
        columnFilters,
        advancedFilters,
        sort
      };
      const res = await api.post(`${getEndpoint()}/query`, payload);
      setData(res.data.rows || []);
      setMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      
      // Update columns from response if not set or simple refresh needed
      // Actually we prefer loading from table-config, but response might have metadata
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableConfig();
    // Reset filters/page on tab change
    setPage(1);
    setQuery("");
    setColumnFilters({});
    setAdvancedFilters([]);
    setSelected(new Set());
    setSort({ key: null, dir: null });
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [page, limit, sort, columnFilters, advancedFilters, tab, query]); // Added query to dep array but it's debounced usually

  // Debounced query effect
  // actually query is state, so we should debounce setQuery or use effect
  // Since we included query in fetchData dep array, let's remove it and use a separate effect for debounce if needed.
  // But Roles.jsx logic:
  /*
    useEffect(() => {
      const t = setTimeout(() => {
        if (page !== 1) setPage(1); else fetchData();
      }, 300);
      return () => clearTimeout(t);
    }, [query]);
  */
  // I'll stick to simple effect for now to match Roles.jsx pattern but avoid double fetch
  // Let's rely on the direct dependency for now, or implement debounce:
  
  /* 
     Correct Debounce Implementation:
     useEffect(() => {
       const handler = setTimeout(() => {
         fetchData();
       }, 300);
       return () => clearTimeout(handler);
     }, [query]);
     
     But other deps like page/limit should trigger immediately.
     So I'll leave it simple: fetchData is called when deps change.
  */

  const dateTimeFormator = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true });
  };

  // Handlers
  const openCreate = () => {
    setDialogMode("create");
    setEditingItem(null);
    setFormData({ code: '', label: '', description: '', rh_positive: false, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setDialogMode("edit");
    setEditingItem(item);
    setFormData({
      code: item.code,
      label: item.label,
      description: item.description || '',
      rh_positive: item.rh_positive || false,
      is_active: item.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.label) {
        toast.error('Code and Label are required');
        return;
      }
      
      const endpoint = getEndpoint();
      if (dialogMode === 'create') {
        await api.post(endpoint, formData);
        toast.success('Created successfully');
      } else {
        await api.patch(`${endpoint}/${editingItem.id}`, formData);
        toast.success('Updated successfully');
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Operation failed');
    }
  };

  const startEdit = (rowKey, colKey, value) => {
    if (colKey === 'is_active' || colKey === 'rh_positive') {
       // Boolean toggle immediate or via select? Roles.jsx uses select for active.
       // Let's match Roles.jsx: it sets editing state, then renders a Select/Checkbox.
       // For active:
       const v = (value === true || String(value) === 'true');
       setEditing({ rowKey, colKey, value: v });
       return;
    }
    setEditing({ rowKey, colKey, value: String(value ?? '') });
  };

  const cancelEdit = () => setEditing({ rowKey: null, colKey: null, value: '' });

  const confirmEdit = async () => {
    if (!editing.rowKey || !editing.colKey) return;
    setSavingEdit(true);
    try {
      const endpoint = getEndpoint();
      const applyForId = async (id) => {
        let payload = {};
        if (editing.colKey === 'is_active' || editing.colKey === 'rh_positive') {
           // ensure boolean
           payload[editing.colKey] = (editing.value === 'true' || editing.value === true);
        } else {
           payload[editing.colKey] = editing.value;
        }
        await api.patch(`${endpoint}/${id}`, payload);
      };

      if (bulkColKey && bulkColKey === editing.colKey && selected.size > 0) {
        const ids = Array.from(selected);
        for (const id of ids) await applyForId(id);
      } else {
        const row = data.find(r => rowId(r) === editing.rowKey);
        const id = row?.id || editing.rowKey;
        await applyForId(id);
      }
      await fetchData();
      cancelEdit();
      setSelected(new Set());
      setBulkColKey(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.label}?`)) return;
    try {
      await api.delete(`${getEndpoint()}/${item.id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  // Components
  const tabsNode = (
    <div className="rounded bg-gray-50 border overflow-hidden flex">
      <button
        className={`px-4 py-1.5 cursor-pointer ${tab === "blood" ? "bg-white font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
        onClick={() => setTab("blood")}
      >
        Blood Groups
      </button>
      <button
        className={`px-4 py-1.5 cursor-pointer ${tab === "marital" ? "bg-white font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
        onClick={() => setTab("marital")}
      >
        Marital Statuses
      </button>
      <button
        className={`px-4 py-1.5 cursor-pointer ${tab === "gender" ? "bg-white font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
        onClick={() => setTab("gender")}
      >
        Genders
      </button>
    </div>
  );

  return (
    <div className="ml-4 h-screen flex flex-col">
      <div className="sticky top-0 z-20 bg-white">
        <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4">
            <FiltersPanel columns={columns} onApply={(f) => { setAdvancedFilters(f); setPage(1); }} onSave={() => { }} />
            <Button variant="ghost" size="icon" aria-label="Toggle column search" onClick={() => setShowColumnSearch(s => !s)}>
              <FiSearch />
            </Button>
            {tabsNode}
          </div>
          <div className="flex items-center gap-3">
            <RequirePermission permission="variables.create">
               <Button onClick={openCreate} className="flex items-center gap-2"><FiPlus /> Add {tab === 'blood' ? 'Blood Group' : (tab === 'marital' ? 'Marital Status' : 'Gender')}</Button>
            </RequirePermission>
            <TableConfigPanel tableKey={getTableKey()} onSaved={loadTableConfig} />
          </div>
        </div>
        <div className="p-2 bg-white">
          <FilterChips 
            columnFilters={columnFilters} 
            advancedFilters={advancedFilters} 
            onRemoveColumnFilter={(k) => {
              setColumnFilters(prev => {
                const next = { ...prev };
                delete next[k];
                return next;
              });
              setPage(1);
            }} 
            onClearAll={() => { setColumnFilters({}); setAdvancedFilters([]); setQuery(''); setPage(1); }} 
          />
        </div>
      </div>
      
      <div className="flex-1 bg-white flex flex-col min-h-0">
        <div className="border rounded flex-1 min-h-0">
          <div className='relative flex-1 min-h-0 overflow-x-auto overflow-y-auto h-full'>
            <Table className="min-w-max">
              <TableHeader className="sticky top-0 z-30 bg-white">
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-30 bg-white w-40 min-w-[10rem] shadow-[1px_0_0_0_#e5e7eb]">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                      <span className="text-xs">Select</span>
                    </div>
                  </TableHead>
                  {columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => (
                    <TableHead key={c.key} className={`group hover:bg-sky-100 sticky top-0 bg-white ${idx === 0 ? 'left-40 z-20 shadow-[1px_0_0_0_#e5e7eb]' : ''}`} onContextMenu={(e) => { e.preventDefault(); setHeaderMenuFor(c.key); }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{c.label}</span>
                        <DropdownMenu open={headerMenuFor === c.key} onOpenChange={(open) => setHeaderMenuFor(open ? c.key : null)}>
                          <DropdownMenuTrigger asChild>
                            <h2 className='p-2 cursor-pointer hover:bg-sky-200 rounded-full flex items-center'>
                              <HiOutlineDotsVertical className='opacity-0 group-hover:opacity-60' />
                            </h2>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setSort({ key: c.key, dir: 'asc' }); setPage(1); }}>Sort A → Z</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSort({ key: c.key, dir: 'desc' }); setPage(1); }}>Sort Z → A</DropdownMenuItem>
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
                    leadingStickyWidthClass="w-40 min-w-[10rem] border-none shadow-[1px_0_0_0_#e5e7eb]" 
                    columns={columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))} 
                    columnFilters={columnFilters} 
                    onChange={(k, s) => {
                      setColumnFilters(prev => {
                        const next = { ...prev };
                        if (!s || s.value === '' || s.value === null) delete next[k];
                        else next[k] = s;
                        return next;
                      });
                      setPage(1);
                    }} 
                  />
                )}
              </TableHeader>

              <TableBody className={'border-b'}>
                {loading ? (
                  <TableRow><TableCell colSpan={columns.filter(c => c.visible !== false).length + 1} className="text-center h-24">Loading…</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.filter(c => c.visible !== false).length + 1} className="text-center h-24">No records found.</TableCell></TableRow>
                ) : data.map((row, i) => (
                  <TableRow 
                    key={rowId(row)} 
                    className={`group ${selected.has(rowId(row)) ? 'bg-sky-50' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-50`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setRowContextMenu({ open: true, x: e.clientX, y: e.clientY, row });
                    }}
                  >
                    <TableCell className={`sticky left-0 z-20 w-40 min-w-[10rem] ${selected.has(rowId(row)) ? 'bg-sky-50' : (i % 2 === 1 ? 'bg-gray-50' : 'bg-white')} group-hover:bg-sky-50 shadow-[1px_0_0_0_#e5e7eb]`}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selected.has(rowId(row))} onCheckedChange={() => toggleOne(rowId(row))} />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                          <FiInfo className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    {columns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => {
                      const rk = rowId(row);
                      const val = row[c.key];
                      const isEditing = editing.rowKey === rk && editing.colKey === c.key;
                      const cellBase = (idx === 0 ? `sticky left-40 z-10 ${selected.has(rk) ? 'bg-sky-50' : (i % 2 === 1 ? 'bg-gray-50' : 'bg-white')} group-hover:bg-sky-50 shadow-[1px_0_0_0_#e5e7eb] cursor-pointer` : 'cursor-pointer');
                      const ring = (bulkColKey === c.key && selected.has(rk)) ? ' ring-2 ring-sky-400 inset-0' : '';
                      
                      return (
                        <TableCell 
                          key={c.key}
                          className={cellBase + ring}
                          onDoubleClick={() => startEdit(rk, c.key, val)}
                          onClick={(e) => { if (e.ctrlKey) { setBulkColKey(c.key); toggleOne(rk); } }}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {c.key === 'is_active' || c.key === 'rh_positive' ? (
                                <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                  <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input 
                                  value={editing.value} 
                                  onChange={e => setEditing(s => ({ ...s, value: e.target.value }))} 
                                  className="h-8"
                                  autoFocus
                                />
                              )}
                              <Button variant="secondary" size="xs" onClick={confirmEdit} disabled={savingEdit}><FiCheck /></Button>
                              <Button variant="ghost" size="xs" onClick={cancelEdit} disabled={savingEdit}><FiX /></Button>
                            </div>
                          ) : (
                            <span>
                              {c.key === 'is_active' ? (row.is_active ? 'Active' : 'Inactive') :
                               c.key === 'rh_positive' ? (row.rh_positive ? 'Yes' : 'No') :
                               (c.key === 'created_at' || c.key === 'updated_at') ? dateTimeFormator(val) :
                               (val ?? '-')}
                            </span>
                          )}
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

      <div className="sticky bottom-0 z-20 p-4 bg-white flex items-center justify-between border-t">
        <div className="text-sm text-gray-600">
          {meta.total > 0 ? `Showing page ${meta.page} of ${meta.totalPages} — ${meta.total} total` : "No records"}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2"><label className="text-sm">Per page:</label>
            <select value={String(limit)} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1 text-sm">
              {[5, 10, 20, 25, 50, 100].map(n => (<option key={n} value={String(n)}>{n}</option>))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
          <div className="text-sm px-3">{page}</div>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages}>Next</Button>
        </div>
      </div>

      {/* Row Context Menu */}
      {rowContextMenu.open && (
        <div 
          className="fixed z-50 bg-white border rounded-md shadow-lg p-1 min-w-[160px]"
          style={{ top: rowContextMenu.y, left: rowContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
           <div 
             className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2 rounded-sm" 
             onClick={() => { openEdit(rowContextMenu.row); setRowContextMenu(prev => ({ ...prev, open: false })); }}
           >
             <FiInfo className="w-4 h-4" /> Edit / Details
           </div>
           <div 
             className="px-2 py-1.5 hover:bg-red-50 cursor-pointer text-sm flex items-center gap-2 text-red-600 rounded-sm" 
             onClick={() => { handleDelete(rowContextMenu.row); setRowContextMenu(prev => ({ ...prev, open: false })); }}
           >
             <FiTrash2 className="w-4 h-4" /> Delete
           </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogMode === 'create' ? 'Add' : 'Edit'} {tab === 'blood' ? 'Blood Group' : (tab === 'marital' ? 'Marital Status' : 'Gender')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
               <label className="text-sm font-medium">Code</label>
               <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. MALE" />
            </div>
            <div>
               <label className="text-sm font-medium">Label</label>
               <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Male" />
            </div>
            <div>
               <label className="text-sm font-medium">Description</label>
               <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            {tab === 'blood' && (
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.rh_positive} onCheckedChange={(v) => setFormData({...formData, rh_positive: !!v})} />
                <label className="text-sm">Rh Positive</label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: !!v})} />
              <label className="text-sm">Active</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
