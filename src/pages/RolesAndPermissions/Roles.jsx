// src/components/Roles.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiSearch, FiInfo, FiCheck, FiX } from "react-icons/fi";
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

export default function Roles() {

  useEffect(() => {
    document.title = "Roles & Permissions | Immortal LMS";
  }, []);


  // top-level tab: "roles" | "permissions" (persist in URL)
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab");
    return t === "permissions" ? "permissions" : "roles";
  })();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== tab && (t === "roles" || t === "permissions")) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", tab);
    setSearchParams(sp, { replace: true });
  }, [tab]);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesQuery, setRolesQuery] = useState("");
  const [rolesColumns, setRolesColumns] = useState([
    { key: 'name', label: 'Name', visible: true, order: 1 },
    { key: 'hierarchy_level', label: 'Hierarchy', type: 'number', visible: true, order: 2 },
    { key: 'is_active', label: 'Active', type: 'boolean', visible: true, order: 3 },
    { key: 'created_at', label: 'Created At', type: 'date', visible: true, order: 4 },
    { key: 'updated_at', label: 'Updated At', type: 'date', visible: true, order: 5 },
    { key: 'created_by', label: 'Created By', visible: true, order: 6 },
    { key: 'updated_by', label: 'Updated By', visible: true, order: 7 },
  ]);
  const [rolesShowColumnSearch, setRolesShowColumnSearch] = useState(false);
  const [rolesColumnFilters, setRolesColumnFilters] = useState({});
  const [rolesAdvancedFilters, setRolesAdvancedFilters] = useState([]);
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesLimit, setRolesLimit] = useState(10);
  const [rolesMeta, setRolesMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [rolesSelected, setRolesSelected] = useState(() => new Set());
  const roleRowId = (r) => r.id;
  const rolesAllSelected = rolesSelected.size > 0 && roles.every((r) => rolesSelected.has(roleRowId(r)));
  const rolesToggleAll = () => {
    setRolesSelected(prev => {
      if (roles.length === 0) return prev;
      const next = new Set(prev);
      const all = roles.map(roleRowId);
      const allSelected = all.every(id => next.has(id));
      if (allSelected) { all.forEach(id => next.delete(id)); } else { all.forEach(id => next.add(id)); }
      return next;
    })
  };
  const rolesToggleOne = (id) => setRolesSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const [rolesSort, setRolesSort] = useState({ key: null, dir: null });

  const [rolesPreviewOpen, setRolesPreviewOpen] = useState(false);
  const [rolesPreviewItem, setRolesPreviewItem] = useState(null);
  const openRolePreview = (item) => { setRolesPreviewItem(item); setRolesPreviewOpen(true); };
  const closeRolePreview = () => { setRolesPreviewOpen(false); setRolesPreviewItem(null); };

  const [rolesCtx, setRolesCtx] = useState({ open: false, x: 0, y: 0, colKey: null, colLabel: null, value: null });
  const closeRolesCtx = () => setRolesCtx(prev => ({ ...prev, open: false }));

  const [rolesEditing, setRolesEditing] = useState({ rowKey: null, colKey: null, value: '' });
  const [rolesSavingEdit, setRolesSavingEdit] = useState(false);
  const [rolesBulkColKey, setRolesBulkColKey] = useState(null);
  const [rolesHeaderMenuFor, setRolesHeaderMenuFor] = useState(null);

  const startRoleEdit = (rowKey, colKey, value) => {
    if (colKey === 'is_active') {
      const v = (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'active') ? 'true' : 'false';
      setRolesEditing({ rowKey, colKey, value: v });
      return;
    }
    setRolesEditing({ rowKey, colKey, value: String(value ?? '') });
  };

  const cancelRoleEdit = () => {
    setRolesEditing({ rowKey: null, colKey: null, value: '' });
  };

  const confirmRoleEdit = async () => {
    if (!rolesEditing.rowKey || !rolesEditing.colKey) return;
    setRolesSavingEdit(true);
    try {
      const applyForRole = async (id) => {
        if (rolesEditing.colKey === 'is_active') {
          const newActive = (rolesEditing.value === 'true' || rolesEditing.value === true);
          await api.patch(`/roles/${id}/inactivate`, { is_active: newActive });
        }
      };
      if (rolesBulkColKey && rolesBulkColKey === rolesEditing.colKey && rolesSelected.size > 0) {
        const ids = Array.from(rolesSelected);
        for (const id of ids) {
          await applyForRole(id);
        }
      } else {
        const row = roles.find(r => roleRowId(r) === rolesEditing.rowKey);
        const id = row?.id || rolesEditing.rowKey;
        await applyForRole(id);
      }
      await fetchRoles();
      cancelRoleEdit();
      setRolesSelected(new Set());
      setRolesBulkColKey(null);
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || err.message || 'Update failed');
    } finally {
      setRolesSavingEdit(false);
    }
  };

  // Permissions state + pagination
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const [allPermissions, setAllPermissions] = useState([]);
  const [permsQuery, setPermsQuery] = useState("");
  const [permsPage, setPermsPage] = useState(1);
  const [permsLimit, setPermsLimit] = useState(10);
  const [permsTotalPages, setPermsTotalPages] = useState(1);
  const [permsTotal, setPermsTotal] = useState(0);
  const [permsColumns, setPermsColumns] = useState([
    { key: 'name', label: 'Name', visible: true, order: 1 },
    { key: 'display_name', label: 'Display Name', visible: true, order: 2 },
    { key: 'description', label: 'Description', visible: true, order: 3 },
    { key: 'is_active', label: 'Active', type: 'boolean', visible: true, order: 4 },
    { key: 'created_at', label: 'Created At', type: 'date', visible: true, order: 5 },
    { key: 'updated_at', label: 'Updated At', type: 'date', visible: true, order: 6 },
    { key: 'created_by', label: 'Created By', visible: true, order: 7 },
    { key: 'updated_by', label: 'Updated By', visible: true, order: 8 },
  ]);
  const [permsShowColumnSearch, setPermsShowColumnSearch] = useState(false);
  const [permsColumnFilters, setPermsColumnFilters] = useState({});
  const [permsAdvancedFilters, setPermsAdvancedFilters] = useState([]);

  const [permsSelected, setPermsSelected] = useState(() => new Set());
  const permRowId = (r) => r.id;
  const permsAllSelected = permsSelected.size > 0 && availablePermissions.every((r) => permsSelected.has(permRowId(r)));
  const permsToggleAll = () => {
    setPermsSelected(prev => {
      if (availablePermissions.length === 0) return prev;
      const next = new Set(prev);
      const all = availablePermissions.map(permRowId);
      const allSelected = all.every(id => next.has(id));
      if (allSelected) { all.forEach(id => next.delete(id)); } else { all.forEach(id => next.add(id)); }
      return next;
    })
  };
  const permsToggleOne = (id) => setPermsSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const [permsSort, setPermsSort] = useState({ key: null, dir: null });

  const [permsPreviewOpen, setPermsPreviewOpen] = useState(false);
  const [permsPreviewItem, setPermsPreviewItem] = useState(null);
  const openPermPreview = (item) => { setPermsPreviewItem(item); setPermsPreviewOpen(true); };
  const closePermPreview = () => { setPermsPreviewOpen(false); setPermsPreviewItem(null); };

  const [permsCtx, setPermsCtx] = useState({ open: false, x: 0, y: 0, colKey: null, colLabel: null, value: null });
  const closePermsCtx = () => setPermsCtx(prev => ({ ...prev, open: false }));

  const [permsEditing, setPermsEditing] = useState({ rowKey: null, colKey: null, value: '' });
  const [permsSavingEdit, setPermsSavingEdit] = useState(false);
  const [permsBulkColKey, setPermsBulkColKey] = useState(null);
  const [permsHeaderMenuFor, setPermsHeaderMenuFor] = useState(null);

  const startPermEdit = (rowKey, colKey, value) => {
    if (colKey === 'is_active') {
      const v = (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'active') ? 'true' : 'false';
      setPermsEditing({ rowKey, colKey, value: v });
      return;
    }
    setPermsEditing({ rowKey, colKey, value: String(value ?? '') });
  };

  const cancelPermEdit = () => {
    setPermsEditing({ rowKey: null, colKey: null, value: '' });
  };

  const confirmPermEdit = async () => {
    if (!permsEditing.rowKey || !permsEditing.colKey) return;
    setPermsSavingEdit(true);
    try {
      const applyForPerm = async (id) => {
        if (permsEditing.colKey === 'is_active') {
          const newActive = (permsEditing.value === 'true' || permsEditing.value === true);
          await api.put(`/role-permissions/edit/${id}`, { is_active: newActive });
        }
      };
      if (permsBulkColKey && permsBulkColKey === permsEditing.colKey && permsSelected.size > 0) {
        const ids = Array.from(permsSelected);
        for (const id of ids) {
          await applyForPerm(id);
        }
      } else {
        const row = availablePermissions.find(r => permRowId(r) === permsEditing.rowKey);
        const id = row?.id || permsEditing.rowKey;
        await applyForPerm(id);
      }
      await fetchPermissions();
      cancelPermEdit();
      setPermsSelected(new Set());
      setPermsBulkColKey(null);
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || err.message || 'Update failed');
    } finally {
      setPermsSavingEdit(false);
    }
  };



  // --- Role dialog state ---
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState("create"); // create | edit
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleSelectedPermissions, setRoleSelectedPermissions] = useState(new Set());

  // NEW: hierarchy related state
  const [roleHierarchyLevel, setRoleHierarchyLevel] = useState(""); // string so input is uncontrolled-safe
  const [insertBetweenEnabled, setInsertBetweenEnabled] = useState(false);
  const [insertLowerId, setInsertLowerId] = useState("");
  const [insertUpperId, setInsertUpperId] = useState("");

  // Role delete (inactivate)
  const [roleDeleteTarget, setRoleDeleteTarget] = useState(null);
  const [roleDeleting, setRoleDeleting] = useState(false);

  // --- Permission dialog state ---
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permDialogMode, setPermDialogMode] = useState("create"); // create | edit
  const [editingPerm, setEditingPerm] = useState(null);
  const [permName, setPermName] = useState("");
  const [permDisplayName, setPermDisplayName] = useState("");
  const [permDescription, setPermDescription] = useState("");
  const [permSaving, setPermSaving] = useState(false);

  const [searchparam, setSearchparam] = useState("");
  const [permDialogTab, setPermDialogTab] = useState("All");

  const normalizeGroup = (name) => {
    const n = String(name || "").toLowerCase();
    let key = n.split(/[.:_\-]/)[0] || "";
    if (!key) return "Other";
    if (key.endsWith("type")) key = key.slice(0, -4);
    if (key === "companysettings") key = "company";
    if (key === "role") key = "roles";
    if (key === "user") key = "users";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Permission delete
  const [permDeleteTarget, setPermDeleteTarget] = useState(null);
  const [permDeleting, setPermDeleting] = useState(false);

  // --- View permissions dialog state (NEW) ---
  const [viewPermsOpen, setViewPermsOpen] = useState(false);
  const [viewPermsList, setViewPermsList] = useState([]); // array of permission objects
  const [viewPermsRoleName, setViewPermsRoleName] = useState("");

  const filterItems = (items, columns, query, columnFilters, advancedFilters) => {
    const q = String(query || '').toLowerCase();
    let out = Array.isArray(items) ? items.slice() : [];
    if (q) {
      out = out.filter(row => Object.keys(row || {}).some(k => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    const colKeys = Object.keys(columnFilters || {});
    if (colKeys.length > 0) {
      out = out.filter(row => {
        return colKeys.every(key => {
          const spec = columnFilters[key];
          const val = row[key];
          if (spec == null) return true;
          const op = spec.op || 'contains';
          const v = spec.value;
          if (v === null || typeof v === 'undefined' || v === '') return true;
          if (op === 'eq') return String(val) === String(v);
          return String(val ?? '').toLowerCase().includes(String(v).toLowerCase());
        });
      });
    }
    if (Array.isArray(advancedFilters) && advancedFilters.length > 0) {
      out = out.filter(row => {
        return advancedFilters.every(f => {
          const key = f.field || f.key;
          const op = f.op || f.operator || 'contains';
          const v = f.value;
          const val = row[key];
          if (typeof v === 'undefined' || v === null || v === '') {
            if (op === 'isEmpty') return val == null || val === '';
            if (op === 'isAnything') return true;
          }
          if (Array.isArray(v) && op === 'between') {
            const from = v[0];
            const to = v[1];
            const num = Number(val);
            if (!Number.isNaN(num)) {
              const nf = Number(from);
              const nt = Number(to);
              if (from && to) return num >= nf && num <= nt;
              if (from) return num >= nf;
              if (to) return num <= nt;
            }
            const d = new Date(val).getTime();
            const df = from ? new Date(from).getTime() : null;
            const dt = to ? new Date(to).getTime() : null;
            if (df && dt) return d >= df && d <= dt;
            if (df) return d >= df;
            if (dt) return d <= dt;
            return true;
          }
          if (op === 'eq') return String(val) === String(v);
          if (op === 'ne') return String(val) !== String(v);
          if (op === 'lt') return Number(val) < Number(v);
          if (op === 'lte') return Number(val) <= Number(v);
          if (op === 'gt') return Number(val) > Number(v);
          if (op === 'gte') return Number(val) >= Number(v);
          if (op === 'startsWith') return String(val ?? '').toLowerCase().startsWith(String(v).toLowerCase());
          if (op === 'endsWith') return String(val ?? '').toLowerCase().endsWith(String(v).toLowerCase());
          if (op === 'notContains') return !String(val ?? '').toLowerCase().includes(String(v).toLowerCase());
          if (op === 'in' && Array.isArray(v)) return v.map(String).includes(String(val));
          if (op === 'isEmpty') return val == null || val === '';
          if (op === 'isNotEmpty') return !(val == null || val === '');
          return String(val ?? '').toLowerCase().includes(String(v).toLowerCase());
        });
      });
    }
    return out;
  };

  // --- Fetchers ---

  const fetchRoles = async (overrides = {}) => {
    setRolesLoading(true);
    try {
      // Use overrides if provided, otherwise fallback to state
      const p = overrides.page ?? rolesPage;
      const l = overrides.limit ?? rolesLimit;
      const q = overrides.query ?? rolesQuery;
      const cf = overrides.columnFilters ?? rolesColumnFilters;
      const af = overrides.advancedFilters ?? rolesAdvancedFilters;
      const s = overrides.sort ?? rolesSort;
      // For columns, we usually don't override, but we can
      const cols = rolesColumns; 

      const res = await api.post('/roles/query', {
        page: p,
        limit: l,
        query: q,
        columnFilters: cf,
        advancedFilters: af,
        sort: s && s.key ? s : undefined,
        columns: cols && cols.length ? cols.map(c => ({ key: c.key, visible: c.visible !== false, order: Number(c.order) || 0 })) : undefined,
      });
      const rows = Array.isArray(res?.data?.rows) ? res.data.rows : (Array.isArray(res?.data) ? res.data : []);
      const meta = res?.data?.meta || { page: p, limit: l, total: rows.length, totalPages: 1 };

      // Fix: If on page 1 and fewer rows than limit are returned, total must be equal to rows count
      if (Number(meta.page) === 1 && rows.length < Number(meta.limit)) {
        meta.total = rows.length;
        meta.totalPages = 1;
      }

      setRoles(rows);
      setRolesMeta(meta);
    } catch (err) {
      console.error("Failed to fetch roles", err);
      toast?.error?.("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchPermissions = async (overrides = {}) => {
    setPermissionsLoading(true);
    try {
      const p = overrides.page ?? permsPage;
      const l = overrides.limit ?? permsLimit;
      const q = overrides.query ?? permsQuery;
      const cf = overrides.columnFilters ?? permsColumnFilters;
      const af = overrides.advancedFilters ?? permsAdvancedFilters;
      const s = overrides.sort ?? permsSort;
      const cols = permsColumns;

      const res = await api.post('/role-permissions/query', {
        page: p,
        limit: l,
        query: q,
        columnFilters: cf,
        advancedFilters: af,
        sort: s && s.key ? s : undefined,
        columns: cols && cols.length ? cols.map(c => ({ key: c.key, visible: c.visible !== false, order: Number(c.order) || 0 })) : undefined,
      });
      const data = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
      const meta = res?.data?.meta || { page: p, limit: l, total: data.length, totalPages: 1 };
      setAvailablePermissions(data);
      setPermsTotal(Number(meta.total));
      setPermsTotalPages(Number(meta.totalPages));
    } catch (err) {
      console.error("Failed to fetch permissions", err);
      toast?.error?.("Failed to load permissions");
    } finally {
      setPermissionsLoading(false);
    }
  };


  const fetchAllPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const url = `/role-permissions?search=${encodeURIComponent(searchparam)}&page=1&limit=1000`;
      const res = await api.get(url);
      setAllPermissions(res.data.data);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
      toast?.error?.("Failed to load permissions");
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPermissions();
  }, [searchparam]);

  // Combined effect for Roles
  useEffect(() => {
    if (tab === 'roles') {
      fetchRoles();
    }
  }, [rolesPage, rolesLimit, rolesSort, rolesColumnFilters, rolesAdvancedFilters, tab, rolesColumns]);

  // Debounced effect for Roles Query
  useEffect(() => {
    if (tab === 'roles') {
      const t = setTimeout(() => {
        // If query changed, we should reset page to 1.
        // But if we just setPage(1), the main effect will fire.
        // If page is already 1, we need to fetch explicitly here?
        // Actually, let's just fetch here.
        // But wait, if we fetch here AND setPage(1), we might double fetch.
        // Best practice: Query change -> Set Page 1. Page 1 change -> Fetch.
        // But if Page is ALREADY 1, Page change won't fire.
        // So:
        if (rolesPage !== 1) {
          setRolesPage(1); 
          // The main effect will handle the fetch because rolesPage changed.
        } else {
          fetchRoles(); // Page didn't change, so we must fetch explicitly.
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [rolesQuery]);


  // Combined effect for Permissions
  useEffect(() => {
    if (tab === 'permissions') {
      fetchPermissions();
    }
  }, [permsPage, permsLimit, permsSort, permsColumnFilters, permsAdvancedFilters, tab, permsColumns]);

  // Debounced effect for Permissions Query
  useEffect(() => {
    if (tab === 'permissions') {
      const t = setTimeout(() => {
        if (permsPage !== 1) {
          setPermsPage(1);
        } else {
          fetchPermissions();
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [permsQuery]);



  // --- Role create/edit helpers ---
  const openCreateRole = () => {
    setRoleDialogMode("create");
    setEditingRole(null);
    setRoleName("");
    setRoleSelectedPermissions(new Set());
    // reset hierarchy UI
    setRoleHierarchyLevel("");
    setInsertBetweenEnabled(false);
    setInsertLowerId("");
    setInsertUpperId("");
    setRoleDialogOpen(true);
  };

  const openEditRole = (role) => {
    setRoleDialogMode("edit");
    setEditingRole(role);
    setRoleName(role?.name || "");
    const perms = new Set();
    if (role?.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach(p => perms.add(typeof p === "object" ? p.id : p));
    }
    setRoleSelectedPermissions(perms);
    // populate hierarchy fields from role
    setRoleHierarchyLevel(role?.hierarchy_level != null ? String(role.hierarchy_level) : "");
    setInsertBetweenEnabled(false);
    setInsertLowerId("");
    setInsertUpperId("");
    setRoleDialogOpen(true);
  };

  const toggleRolePermission = (permId) => {
    setRoleSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleRoleSave = async (e) => {
    e?.preventDefault?.();
    if (!roleName || !roleName.trim()) {
      toast?.error?.("Role name is required");
      return;
    }
    setRoleSaving(true);

    try {
      // Prepare payload parts
      let payloadForCreate = { name: roleName.trim() };
      let payloadForEdit = { name: roleName.trim(), permissions: Array.from(roleSelectedPermissions) };

      // If insert between is enabled, validate selections
      if (insertBetweenEnabled) {
        if (!insertLowerId || !insertUpperId) {
          toast?.error?.("Please select both lower and upper roles for insertion.");
          setRoleSaving(false);
          return;
        }
        if (insertLowerId === insertUpperId) {
          toast?.error?.("Lower and Upper role must be different.");
          setRoleSaving(false);
          return;
        }
        // backend expects { insert_between: { lowerId, upperId } }
        const insertBetween = { lowerId: insertLowerId, upperId: insertUpperId };
        payloadForCreate.insert_between = insertBetween;
        payloadForEdit.insert_between = insertBetween;
      } else if (roleHierarchyLevel !== "") {
        // send numeric level if provided
        const parsed = parseInt(roleHierarchyLevel, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
          toast?.error?.("Hierarchy level must be a non-negative integer");
          setRoleSaving(false);
          return;
        }
        payloadForCreate.hierarchy_level = parsed;
        payloadForEdit.hierarchy_level = parsed;
      }

      // CREATE flow: POST /roles -> then attach selected permissions with POST /roles/:roleId/permissions/:permissionId
      if (roleDialogMode === "create") {
        const createRes = await api.post("/roles", payloadForCreate);
        const createdRole = createRes?.data?.role || createRes?.data;
        const roleId = createdRole?.id;

        // attach permissions (backend route: POST /roles/:roleId/permissions/:permissionId)
        const permsToAdd = Array.from(roleSelectedPermissions);
        if (roleId && permsToAdd.length > 0) {
          await Promise.all(permsToAdd.map(pid =>
            api.post(`/roles/${roleId}/permissions/${pid}`).catch(err => {
              console.error(`Failed to add permission ${pid} to role ${roleId}`, err);
              throw err;
            })
          ));
        }

        toast?.success?.("Role created");
      } else if (roleDialogMode === "edit" && editingRole) {
        // EDIT flow: sync via PUT /roles/:roleId with { name, permissions: [], hierarchy_level or insert_between }
        await api.put(`/roles/${editingRole.id}`, payloadForEdit);
        toast?.success?.("Role updated");
      }

      setRoleDialogOpen(false);
      await fetchRoles();
    } catch (err) {
      console.error("Save role error", err);
      const msg = err?.response?.data?.message || err.message || "Save failed";
      toast?.error?.(msg);
    } finally {
      setRoleSaving(false);
    }
  };

  const confirmRoleDelete = (role) => setRoleDeleteTarget(role);

  const handleRoleDelete = async () => {
    if (!roleDeleteTarget) return;
    setRoleDeleting(true);

    try {
      // Use inactivate route per backend: PATCH /roles/:roleId/inactivate
      await api.patch(`/roles/${roleDeleteTarget.id}/inactivate`, { is_active: false });
      toast?.success?.("Role inactivated");
      setRoleDeleteTarget(null);
      await fetchRoles();
    } catch (err) {
      console.error("Inactivate role error", err);
      toast?.error?.(err?.response?.data?.message || "Operation failed");
    } finally {
      setRoleDeleting(false);
    }
  };

  // --- Permissions create/edit helpers ---
  const openCreatePerm = () => {
    setPermDialogMode("create");
    setEditingPerm(null);
    setPermName("");
    setPermDisplayName("");
    setPermDescription("");
    setPermDialogOpen(true);
  };

  const openEditPerm = (perm) => {
    setPermDialogMode("edit");
    setEditingPerm(perm);
    setPermName(perm?.name || "");
    setPermDisplayName(perm?.display_name || perm?.displayName || "");
    setPermDescription(perm?.description || "");
    setPermDialogOpen(true);
  };

  const handlePermSave = async (e) => {
    e?.preventDefault?.();
    if (!permName || !permName.trim()) {
      toast?.error?.("Permission name is required");
      return;
    }
    setPermSaving(true);

    try {
      const payload = {
        name: permName.trim(),
        display_name: permDisplayName || permName.trim(),
        description: permDescription || ""
      };

      // create/update using /role-permissions endpoints
      if (permDialogMode === "create") {
        await api.post("/role-permissions/add", payload);
        toast?.success?.("Permission created");
      } else if (permDialogMode === "edit" && editingPerm) {
        await api.put(`/role-permissions/edit/${editingPerm.id}`, payload);
        toast?.success?.("Permission updated");
      }

      setPermDialogOpen(false);
      if (permsPage !== 1) {
        setPermsPage(1);
      } else {
        await fetchPermissions();
      }
      await fetchRoles();
    } catch (err) {
      console.error("Save permission error", err);
      const msg = err?.response?.data?.message || err.message || "Save failed";
      toast?.error?.(msg);
    } finally {
      setPermSaving(false);
    }
  };

  const confirmPermDelete = (perm) => setPermDeleteTarget(perm);

  const handlePermDelete = async () => {
    if (!permDeleteTarget) return;
    setPermDeleting(true);

    try {
      // delete endpoint for role-permissions
      await api.delete(`/role-permissions/delete/${permDeleteTarget.id}`);
      toast?.success?.("Permission deleted");
      setPermDeleteTarget(null);
      await fetchPermissions();
      await fetchRoles();
    } catch (err) {
      console.error("Delete permission error", err);
      toast?.error?.(err?.response?.data?.message || "Delete failed");
    } finally {
      setPermDeleting(false);
    }
  };

  // --- VIEW Permissions (NEW) ---
  const openViewPermissions = (role) => {
    const perms = Array.isArray(role?.permissions) ? role.permissions.map(p => (typeof p === 'object' ? p : { id: p })) : [];
    setViewPermsList(perms);
    setViewPermsRoleName(role?.name || "");
    setViewPermsOpen(true);
    setRolesPreviewOpen(false);
  };

  const closeViewPermissions = () => {
    setViewPermsOpen(false);
    setViewPermsList([]);
    setViewPermsRoleName("");
  };

  const dateTimeFormator = (date) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
    const formattedTime = d.toLocaleString("default", { hour: "numeric", minute: "numeric", hour12: true });
    return `${formattedDate} at ${formattedTime}`;
  };

  const onRolesColumnFilterChange = (key, spec) => {
    setRolesColumnFilters(prev => {
      const next = { ...prev };
      if (!spec || spec.value === '' || typeof spec.value === 'undefined' || spec.value === null) {
        delete next[key];
      } else next[key] = spec;
      // fetchRoles handled by useEffect
      return next;
    });
    setRolesPage(1);
  };

  const applyRolesAdvanced = (filters) => {
    const next = filters || [];
    setRolesAdvancedFilters(next);
    setRolesPage(1);
    // fetchRoles handled by useEffect
  };

  const onPermsColumnFilterChange = (key, spec) => {
    setPermsColumnFilters(prev => {
      const next = { ...prev };
      if (!spec || spec.value === '' || typeof spec.value === 'undefined' || spec.value === null) {
        delete next[key];
      } else next[key] = spec;
      // fetchPermissions handled by useEffect
      return next;
    });
    setPermsPage(1);
  };

  const applyPermsAdvanced = (filters) => {
    const next = filters || [];
    setPermsAdvancedFilters(next);
    setPermsPage(1);
    // fetchPermissions handled by useEffect
  };

  const HeaderBar = ({ columns, query, onQueryChange, showColumnSearch, onToggleColumnSearch, onApplyAdvanced, onRemoveColumnFilter, onClearAll, columnFilters, advancedFilters, rightActions, tabsNode }) => (
    <div className="sticky top-0 z-20 bg-white ">
      <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <FiltersPanel columns={columns} onApply={onApplyAdvanced} onSave={() => { }} />
          <Button variant="ghost" size="icon" aria-label="Toggle column search" onClick={onToggleColumnSearch}>
            <FiSearch />
          </Button>
          {tabsNode}
        </div>
        <div className="flex items-center gap-3">
          {rightActions}
          <TableConfigPanel tableKey={tab === 'roles' ? 'roles' : 'permissions'} onSaved={() => { if (tab === 'roles') loadRolesTableConfig(); else loadPermsTableConfig(); }} />
        </div>
      </div>
      <div className="p-2 bg-white">
        <FilterChips columnFilters={columnFilters} advancedFilters={advancedFilters} onRemoveColumnFilter={onRemoveColumnFilter} onClearAll={onClearAll} />
      </div>
    </div>
  );

  const FooterBar = ({ meta, page, limit, onChangeLimit, onChangePage }) => (
    <div className="sticky bottom-0 z-20 p-4 bg-white  flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {meta.total > 0 ? `Showing page ${meta.page} of ${meta.totalPages} — ${meta.total} total` : "No records"}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2"><label>Per page:</label>
          <select value={String(limit)} onChange={e => { const v = Number(e.target.value); onChangeLimit(v); onChangePage(1); }} className="border rounded px-2 py-1">
            {[5, 10, 20, 25, 50, 100].map(n => (<option key={n} value={String(n)}>{n}</option>))}
          </select>
        </div>
        <Button onClick={() => { const np = Math.max(1, page - 1); onChangePage(np); }} disabled={page <= 1}>Prev</Button>
        <div className="text-sm px-3">{page}</div>
        <Button onClick={() => { const np = meta.page < meta.totalPages ? page + 1 : page; onChangePage(np); }} disabled={page >= meta.totalPages}>Next</Button>
      </div>
    </div>
  );


  const tabsNode = (
    <div className="rounded bg-gray-50 border overflow-hidden">
      <RequirePermission permission="role.read">
        <button
          className={`px-4 py-1.5 cursor-pointer ${tab === "roles" ? "bg-white font-medium" : "text-gray-600"}`}
          onClick={() => setTab("roles")}
        >
          Roles
        </button>
      </RequirePermission>
      <RequirePermission permission="permission.read">
        <button
          className={`px-4 py-1.5 cursor-pointer ${tab === "permissions" ? "bg-white font-medium" : "text-gray-600"}`}
          onClick={() => setTab("permissions")}
        >
          Permissions
        </button>
      </RequirePermission>
    </div>
  );

  const loadRolesTableConfig = async () => {
    try {
      const res = await api.get(`/table-configs?table=roles`);
      const registry = Array.isArray(res?.data?.columns) ? res.data.columns : [];
      const config = res?.data?.config ? res.data.config.config : null;
      if (config && Array.isArray(config)) {
        const map = Object.fromEntries(config.map(c => [c.key, c]));
        const ordered = config.slice().sort((a, b) => a.order - b.order).map(c => {
          const reg = registry.find(r => r.key === c.key);
          return { key: c.key, label: reg ? reg.label : c.key, type: reg ? reg.type : undefined, visible: !!c.visible, order: c.order };
        });
        const missing = registry.filter(r => !map[r.key]).map((r, i) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: ordered.length + i + 1 }));
        setRolesColumns([...ordered, ...missing]);
      } else if (registry.length > 0) {
        const defaults = registry.map((r, idx) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: idx + 1 }));
        setRolesColumns(defaults);
      }
    } catch (err) { console.error(err) }
  };

  const loadPermsTableConfig = async () => {
    try {
      const res = await api.get(`/table-configs?table=permissions`);
      const registry = Array.isArray(res?.data?.columns) ? res.data.columns : [];
      const config = res?.data?.config ? res.data.config.config : null;
      if (config && Array.isArray(config)) {
        const map = Object.fromEntries(config.map(c => [c.key, c]));
        const ordered = config.slice().sort((a, b) => a.order - b.order).map(c => {
          const reg = registry.find(r => r.key === c.key);
          return { key: c.key, label: reg ? reg.label : c.key, type: reg ? reg.type : undefined, visible: !!c.visible, order: c.order };
        });
        const missing = registry.filter(r => !map[r.key]).map((r, i) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: ordered.length + i + 1 }));
        setPermsColumns([...ordered, ...missing]);
      } else if (registry.length > 0) {
        const defaults = registry.map((r, idx) => ({ key: r.key, label: r.label, type: r.type, visible: true, order: idx + 1 }));
        setPermsColumns(defaults);
      }
    } catch (err) { console.error(err) }
  };

  useEffect(() => { loadRolesTableConfig(); loadPermsTableConfig(); }, []);

  return (
    <div className="ml-4 h-screen flex flex-col">


      {/* Roles Tab */}
      <RequirePermission permission="role.read">
        {tab === "roles" && (
          <>
            <HeaderBar
              columns={rolesColumns}
              query={rolesQuery}
              onQueryChange={setRolesQuery}
              showColumnSearch={rolesShowColumnSearch}
              onToggleColumnSearch={() => setRolesShowColumnSearch(s => !s)}
              onApplyAdvanced={applyRolesAdvanced}
              onRemoveColumnFilter={(k) => onRolesColumnFilterChange(k, null)}
              onClearAll={() => { const nextCols = {}; const nextAdv = []; setRolesColumnFilters(nextCols); setRolesAdvancedFilters(nextAdv); setRolesQuery(''); setRolesPage(1); }}
              columnFilters={rolesColumnFilters}
              advancedFilters={rolesAdvancedFilters}
              tabsNode={tabsNode}
              rightActions={
                <RequirePermission permission="role.create">
                  <Button onClick={openCreateRole} className="flex items-center gap-2"><FiPlus /> Add Role</Button>
                </RequirePermission>
              }
            />

            <div className="flex-1 bg-white flex flex-col min-h-0">
              <div className="border rounded flex-1 min-h-0">
                <div className='relative flex-1 min-h-0 overflow-x-auto overflow-y-auto'>
                  <Table className="min-w-max">
                    <TableHeader className="sticky top-0 z-30 bg-white">
                      <TableRow>
                        <TableHead className="sticky top-0 left-0 z-30 bg-white  w-40 min-w-[10rem]">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={rolesAllSelected} onCheckedChange={rolesToggleAll} />
                            <span className="text-xs ">Select</span>
                          </div>
                        </TableHead>
                        {rolesColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => (
                          <TableHead key={c.key} className={`group hover:bg-sky-100 sticky top-0 group bg-white ${idx === 0 ? 'left-40 z-20 ' : ''}`} onContextMenu={(e) => { e.preventDefault(); setRolesHeaderMenuFor(c.key); }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{c.label}</span>
                              <DropdownMenu open={rolesHeaderMenuFor === c.key} onOpenChange={(open) => setRolesHeaderMenuFor(open ? c.key : null)}>
                                <DropdownMenuTrigger asChild>
                                  <h2 className='p-2 cursor-pointer hover:bg-sky-200 rounded-full flex items-center'>
                                    <HiOutlineDotsVertical className='opacity-0 group-hover:opacity-60 ' />
                                  </h2>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => { setRolesSort({ key: c.key, dir: 'asc' }); setRolesPage(1); }}>Sort A → Z</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setRolesSort({ key: c.key, dir: 'desc' }); setRolesPage(1); }}>Sort Z → A</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                      {rolesShowColumnSearch && <ColumnSearchRow stickyFirstDataColumn={true} stickyOffsetClass="left-40" leadingStickyWidthClass="w-40 min-w-[10rem]" columns={rolesColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))} columnFilters={rolesColumnFilters} onChange={onRolesColumnFilterChange} />}
                    </TableHeader>

                    <TableBody className={'border-b'}>
                      {rolesLoading ? (
                        <TableRow><TableCell colSpan={rolesColumns.filter(c => c.visible !== false).length + 1}>Loading…</TableCell></TableRow>
                      ) : roles.length === 0 ? (
                        <TableRow><TableCell colSpan={rolesColumns.filter(c => c.visible !== false).length + 1}>No roles found.</TableCell></TableRow>
                      ) : roles.map((role, i) => (
                        <TableRow key={role.id || i} className={`group ${rolesSelected.has(roleRowId(role)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-100`}>
                          <TableCell className={`sticky left-0 z-20  w-40 min-w-[10rem] ${rolesSelected.has(roleRowId(role)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200`}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={rolesSelected.has(roleRowId(role))} onCheckedChange={() => rolesToggleOne(roleRowId(role))} />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="xs" onClick={() => openRolePreview(role)} aria-label="Preview"><FiInfo className='opacity-60' /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Preview</TooltipContent>
                              </Tooltip>

                            </div>
                          </TableCell>
                          {rolesColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => {
                            const rk = roleRowId(role);
                            const v = role[c.key];
                            const isEditing = rolesEditing.rowKey === rk && rolesEditing.colKey === c.key;
                            const cellBase = (idx === 0 ? `sticky left-40 z-10  ${rolesSelected.has(roleRowId(role)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200 cursor-pointer` : 'hover:bg-sky-200');
                            const ring = (rolesBulkColKey === c.key && rolesSelected.has(roleRowId(role))) ? ' ring-2 ring-sky-400' : '';
                            return (
                              <TableCell
                                key={c.key}
                                onContextMenu={(e) => { e.preventDefault(); const val = role[c.key]; setRolesCtx({ open: true, x: e.clientX, y: e.clientY, colKey: c.key, colLabel: c.label, value: val }); }}
                                onDoubleClick={c.key === 'is_active' ? () => startRoleEdit(rk, c.key, v) : () => openEditRole(role)}
                                onClick={(e) => { if (e.ctrlKey) { setRolesBulkColKey(c.key); rolesToggleOne(roleRowId(role)); } else if (idx === 0) { openEditRole(role) } }}
                                className={cellBase + ring}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    {c.key === 'is_active' ? (
                                      <Select value={String(rolesEditing.value)} onValueChange={(val) => setRolesEditing(s => ({ ...s, value: val }))}>
                                        <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">Active</SelectItem>
                                          <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : null}
                                    <Button variant="secondary" size="xs" onClick={confirmRoleEdit} disabled={rolesSavingEdit} aria-label="Save"><FiCheck /></Button>
                                    <Button variant="outline" size="xs" onClick={cancelRoleEdit} disabled={rolesSavingEdit} aria-label="Cancel"><FiX /></Button>
                                  </div>
                                ) : (
                                  <span className={idx === 0 ? 'text-primary' : ''}>
                                    {c.key === 'is_active' ? (role.is_active ? 'Active' : 'Inactive') : (
                                      c.key === 'created_at' ? (role.created_at ? dateTimeFormator(role.created_at) : '-') : (
                                        c.key === 'updated_at' ? (role.updated_at ? dateTimeFormator(role.updated_at) : '-') : (
                                          c.key === 'hierarchy_level' ? (role.hierarchy_level != null ? String(role.hierarchy_level) : '-') : (role[c.key] ?? '-')
                                        )
                                      )
                                    )}
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

            <FooterBar
              meta={rolesMeta}
              page={rolesPage}
              limit={rolesLimit}
              onChangeLimit={setRolesLimit}
              onChangePage={setRolesPage}
            />
          </>
        )}
      </RequirePermission>

      {/* Permissions Tab */}
      <RequirePermission permission="permission.read">
        {tab === "permissions" && (
          <>
            <HeaderBar
              columns={permsColumns}
              query={permsQuery}
              onQueryChange={setPermsQuery}
              showColumnSearch={permsShowColumnSearch}
              onToggleColumnSearch={() => setPermsShowColumnSearch(s => !s)}
              onApplyAdvanced={applyPermsAdvanced}
              onRemoveColumnFilter={(k) => onPermsColumnFilterChange(k, null)}
              onClearAll={() => { const nextCols = {}; const nextAdv = []; setPermsColumnFilters(nextCols); setPermsAdvancedFilters(nextAdv); setPermsQuery(''); setPermsPage(1); }}
              columnFilters={permsColumnFilters}
              advancedFilters={permsAdvancedFilters}
              tabsNode={tabsNode}
              rightActions={
                <RequirePermission permission="permission.create">
                  <Button onClick={openCreatePerm} className="flex items-center gap-2">
                    <FiPlus /> Add Permission
                  </Button>
                </RequirePermission>
              }
            />

            <div className="flex-1 bg-white  min-h-0">
              <div className="border rounded overflow-hidden h-full">
                <div className='relative h-full overflow-x-auto overflow-y-auto'>
                  <Table className="min-w-max ">
                    <TableHeader className="sticky top-0 z-30 bg-white">
                      <TableRow>
                        <TableHead className="sticky top-0 left-0 z-30 bg-white shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem]">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={permsAllSelected} onCheckedChange={permsToggleAll} />
                            <span className="text-xs ">Select</span>
                          </div>
                        </TableHead>
                        {permsColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => (
                          <TableHead key={c.key} className={`hover:bg-sky-100 group sticky top-0 group bg-white ${idx === 0 ? 'left-40 z-20 shadow-[1px_0_0_0_#e5e7eb]' : ''}`} onContextMenu={(e) => { e.preventDefault(); setPermsHeaderMenuFor(c.key); }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{c.label}</span>
                              <DropdownMenu open={permsHeaderMenuFor === c.key} onOpenChange={(open) => setPermsHeaderMenuFor(open ? c.key : null)}>
                                <DropdownMenuTrigger asChild>
                                  <h2 className='p-2 cursor-pointer hover:bg-sky-200 rounded-full flex items-center'>
                                    <HiOutlineDotsVertical className='opacity-0 group-hover:opacity-60 ' />
                                  </h2>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => { setPermsSort({ key: c.key, dir: 'asc' }); setPermsPage(1); }}>Sort A → Z</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setPermsSort({ key: c.key, dir: 'desc' }); setPermsPage(1); }}>Sort Z → A</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                      {permsShowColumnSearch && <ColumnSearchRow stickyFirstDataColumn={true} stickyOffsetClass="left-40" leadingStickyWidthClass="w-40 min-w-[10rem] border-none shadow-[1px_0_0_0_#e5e7eb]" columns={permsColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0))} columnFilters={permsColumnFilters} onChange={onPermsColumnFilterChange} />}
                    </TableHeader>

                    <TableBody className={'border-b'}>
                      {permissionsLoading ? (
                        <TableRow><TableCell colSpan={permsColumns.filter(c => c.visible !== false).length + 1}>Loading…</TableCell></TableRow>
                      ) : availablePermissions.length === 0 ? (
                        <TableRow><TableCell colSpan={permsColumns.filter(c => c.visible !== false).length + 1}>No permissions found.</TableCell></TableRow>
                      ) : availablePermissions.map((perm, i) => (
                        <TableRow key={perm.id || i} className={`group ${permsSelected.has(permRowId(perm)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-100`}>
                          <TableCell className={`sticky left-0 z-20 shadow-[1px_0_0_0_#e5e7eb] w-40 min-w-[10rem] ${permsSelected.has(permRowId(perm)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200`}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={permsSelected.has(permRowId(perm))} onCheckedChange={() => permsToggleOne(permRowId(perm))} />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="xs" onClick={() => openPermPreview(perm)} aria-label="Preview"><FiInfo className='opacity-60' /></Button>
                                </TooltipTrigger>
                                <TooltipContent>Preview</TooltipContent>
                              </Tooltip>

                            </div>
                          </TableCell>
                          {permsColumns.filter(c => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c, idx) => {
                            const rk = permRowId(perm);
                            const v = perm[c.key];
                            const isEditing = permsEditing.rowKey === rk && permsEditing.colKey === c.key;
                            const cellBase = (idx === 0 ? `sticky left-40 z-10 shadow-[1px_0_0_0_#e5e7eb] ${permsSelected.has(permRowId(perm)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200 cursor-pointer` : 'hover:bg-sky-200');
                            const ring = (permsBulkColKey === c.key && permsSelected.has(permRowId(perm))) ? ' ring-2 ring-sky-400' : '';
                            return (
                              <TableCell
                                key={c.key}
                                onContextMenu={(e) => { e.preventDefault(); const val = perm[c.key]; setPermsCtx({ open: true, x: e.clientX, y: e.clientY, colKey: c.key, colLabel: c.label, value: val }); }}
                                onDoubleClick={c.key === 'is_active' ? () => startPermEdit(rk, c.key, v) : () => openEditPerm(perm)}
                                onClick={(e) => { if (e.ctrlKey) { setPermsBulkColKey(c.key); permsToggleOne(permRowId(perm)); } else if (idx === 0) { openEditPerm(perm) } }}
                                className={cellBase + ring}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    {c.key === 'is_active' ? (
                                      <Select value={String(permsEditing.value)} onValueChange={(val) => setPermsEditing(s => ({ ...s, value: val }))}>
                                        <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">Active</SelectItem>
                                          <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      c.key === 'created_at' ? (perm.created_at ? dateTimeFormator(perm.created_at) : '-') : (
                                        c.key === 'display_name' ? (perm.display_name || perm.displayName || '-') : (perm[c.key] ?? '-')
                                      )
                                    )}
                                    <Button variant="secondary" size="xs" onClick={confirmPermEdit} disabled={permsSavingEdit} aria-label="Save"><FiCheck /></Button>
                                    <Button variant="outline" size="xs" onClick={cancelPermEdit} disabled={permsSavingEdit} aria-label="Cancel"><FiX /></Button>
                                  </div>
                                ) : (
                                  <span className={idx === 0 ? 'text-primary' : ''}>
                                    {c.key === 'is_active' ? (perm.is_active ? 'Active' : 'Inactive') : (
                                      c.key === 'created_at' ? (perm.created_at ? dateTimeFormator(perm.created_at) : '-') : (
                                        c.key === 'updated_at' ? (perm.updated_at ? dateTimeFormator(perm.updated_at) : '-') : (
                                          c.key === 'display_name' ? (perm.display_name || perm.displayName || '-') : (perm[c.key] ?? '-')
                                        )
                                      )
                                    )}
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

            <FooterBar
              meta={{ page: permsPage, totalPages: permsTotalPages, total: permsTotal, limit: permsLimit }}
              page={permsPage}
              limit={permsLimit}
              onChangeLimit={setPermsLimit}
              onChangePage={setPermsPage}
            />
          </>
        )}
      </RequirePermission>

      {/* Role Create/Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{roleDialogMode === "create" ? "Create Role" : "Edit Role"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRoleSave} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Role name"
                className="mt-1"
                autoFocus
                required
              />
            </div>

            {/* NEW: Hierarchy controls */}
            <div>
              <Label>Hierarchy level (optional)</Label>
              <div className="mt-1 flex gap-2 items-center">
                <Input
                  type="number"
                  value={roleHierarchyLevel}
                  onChange={(e) => setRoleHierarchyLevel(e.target.value)}
                  placeholder="e.g. 100, 200, 300..."
                />
                <div className="text-sm text-gray-600">
                  Lower number = higher privilege. Leave blank to use default.
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  id="insertBetween"
                  type="checkbox"
                  checked={insertBetweenEnabled}
                  onChange={(e) => setInsertBetweenEnabled(e.target.checked)}
                />
                <label htmlFor="insertBetween" className="text-sm">Insert between two existing roles</label>
              </div>

              {insertBetweenEnabled && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label>Lower role (higher privilege)</Label>
                    <select
                      value={insertLowerId}
                      onChange={(e) => setInsertLowerId(e.target.value)}
                      className="w-full border rounded px-2 py-1 mt-1"
                    >
                      <option value="">Select lower role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name} {r.hierarchy_level != null ? `(${r.hierarchy_level})` : ""}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>Upper role (lower privilege)</Label>
                    <select
                      value={insertUpperId}
                      onChange={(e) => setInsertUpperId(e.target.value)}
                      className="w-full border rounded px-2 py-1 mt-1"
                    >
                      <option value="">Select upper role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name} {r.hierarchy_level != null ? `(${r.hierarchy_level})` : ""}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Permissions</Label>

              <div className="mt-2 flex items-center gap-2">

                {/* select all permissions */}
                <label className="flex items-center gap-2 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={
                      (allPermissions.length > 0) &&
                      (allPermissions.filter((p) => permDialogTab === 'All' ? true : (normalizeGroup(p.name) === permDialogTab)).length > 0) &&
                      allPermissions.filter((p) => permDialogTab === 'All' ? true : (normalizeGroup(p.name) === permDialogTab)).every((p) => roleSelectedPermissions.has(p.id))
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newSet = new Set(roleSelectedPermissions);

                      if (checked) {
                        allPermissions.filter((p) => permDialogTab === 'All' ? true : (normalizeGroup(p.name) === permDialogTab)).forEach((p) => newSet.add(p.id));
                      } else {
                        allPermissions.filter((p) => permDialogTab === 'All' ? true : (normalizeGroup(p.name) === permDialogTab)).forEach((p) => newSet.delete(p.id));
                      }

                      setRoleSelectedPermissions(newSet);
                    }}
                  />
                  <span className="text-sm">Select All</span>
                </label>
                {/* search permissions */}
                <input
                  className="border rounded-md focus:outline-none px-2 py-1"
                  id="searchparam"
                  placeholder="Search permissions..."
                  type="text"
                  value={searchparam}
                  onChange={(e) => setSearchparam(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <Select value={permDialogTab} onValueChange={setPermDialogTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Permission Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["All", ...Array.from(new Set(allPermissions.map((p) => normalizeGroup(p.name))).values())].sort((a, b) => {
                      const pri = (x) => {
                        const y = String(x).toLowerCase();
                        if (y === 'department') return 1;
                        if (y === 'roles') return 3;
                        if (y === 'users') return 4;
                        if (y === 'all') return 0;
                        return 99;
                      };
                      const pa = pri(a), pb = pri(b);
                      if (pa !== pb) return pa - pb;
                      return String(a).localeCompare(String(b));
                    })).map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 max-h-48 overflow-auto border rounded p-2">
                {permissionsLoading && allPermissions.length === 0 ? (
                  <div className="text-sm">Loading permissions…</div>
                ) : allPermissions.length === 0 ? (
                  <div className="text-sm">No permissions available.</div>
                ) : (
                  allPermissions.filter((perm) => permDialogTab === 'All' ? true : (normalizeGroup(perm.name) === permDialogTab)).map((perm) => {
                    const checked = roleSelectedPermissions.has(perm.id);
                    return (
                      <label key={perm.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRolePermission(perm.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{perm.name}</span>
                        {perm.description ? (
                          <span className="text-xs text-gray-500">— {perm.description}</span>
                        ) : null}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={roleSaving}>{roleSaving ? "Saving…" : (roleDialogMode === "create" ? "Create" : "Save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Permissions Dialog (NEW) */}
      <Dialog open={viewPermsOpen} onOpenChange={setViewPermsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissions for {viewPermsRoleName || "role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-auto p-2">
            {viewPermsList.length === 0 ? (
              <div className="text-sm text-gray-600">No permissions assigned to this role.</div>
            ) : (
              viewPermsList.map((p) => (
                <div key={p.id} className="border rounded p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.display_name || "-"}</div>
                  {p.description && <div className="mt-1 text-xs text-gray-500">{p.description}</div>}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={closeViewPermissions}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Inactivate Confirmation */}
      <AlertDialog open={Boolean(roleDeleteTarget)} onOpenChange={(open) => { if (!open) setRoleDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inactivate role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to inactivate <strong>{roleDeleteTarget?.name}</strong>? This will prevent its use but not delete historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleDelete} disabled={roleDeleting}>
              {roleDeleting ? "Processing…" : "Inactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permission Create/Edit Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{permDialogMode === "create" ? "Create Permission" : "Edit Permission"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePermSave} className="space-y-4">
            <div>
              <Label>Name (unique key)</Label>
              <Input
                value={permName}
                onChange={(e) => setPermName(e.target.value)}
                placeholder="e.g. user.create"
                className="mt-1"
                autoFocus
                required
              />
            </div>

            <div>
              <Label>Display Name</Label>
              <Input
                value={permDisplayName}
                onChange={(e) => setPermDisplayName(e.target.value)}
                placeholder="Create User"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={permDescription}
                onChange={(e) => setPermDescription(e.target.value)}
                placeholder="A short description"
                className="mt-1 w-full border rounded p-2 h-24"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPermDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={permSaving}>{permSaving ? "Saving…" : (permDialogMode === "create" ? "Create" : "Save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permission Delete Confirmation */}
      <AlertDialog open={Boolean(permDeleteTarget)} onOpenChange={(open) => { if (!open) setPermDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permission?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{permDeleteTarget?.name}</strong>? This will remove the permission from roles as well.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPermDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermDelete} disabled={permDeleting}>
              {permDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={rolesPreviewOpen} onOpenChange={(o) => { if (!o) closeRolePreview(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role Preview</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-2">
            {rolesPreviewItem ? (
              <>
                <div><span className="text-gray-500">Name:</span> {rolesPreviewItem.name ?? '-'}</div>
                <div><span className="text-gray-500">Hierarchy:</span> {rolesPreviewItem.hierarchy_level != null ? String(rolesPreviewItem.hierarchy_level) : '-'}</div>
                <div><span className="text-gray-500">Active:</span> {rolesPreviewItem.is_active ? 'Active' : 'Inactive'}</div>
                <div><span className="text-gray-500">Created:</span> {rolesPreviewItem.created_at ? dateTimeFormator(rolesPreviewItem.created_at) : '-'}</div>
              </>
            ) : '—'}

            <div className="flex gap-4 items-center">
              <RequirePermission permission="role.update">
                <Button onClick={() => { closeRolePreview(); openEditRole(rolesPreviewItem); }}><FiEdit2 /> Edit</Button>
              </RequirePermission>

              <Button variant='outline' onClick={() => { openViewPermissions(rolesPreviewItem); }}>
                View permissions
              </Button>
              <RequirePermission permission="role.makeInactive">
                <Button variant='outline' className="text-red-600" onClick={() => confirmRoleDelete(rolesPreviewItem)}><FiTrash2 /> Inactivate</Button>
              </RequirePermission>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={permsPreviewOpen} onOpenChange={(o) => { if (!o) closePermPreview(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permission Preview</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-2">
            {permsPreviewItem ? (
              <>
                <div><span className="text-gray-500">Name:</span> {permsPreviewItem.name ?? '-'}</div>
                <div><span className="text-gray-500">Display Name:</span> {permsPreviewItem.display_name || permsPreviewItem.displayName || '-'}</div>
                <div><span className="text-gray-500">Description:</span> {permsPreviewItem.description ?? '-'}</div>
                <div><span className="text-gray-500">Created:</span> {permsPreviewItem.created_at ? dateTimeFormator(permsPreviewItem.created_at) : '-'}</div>
                <div className="flex gap-4 items-center">
                  <RequirePermission permission="permission.update">
                    <Button onClick={() => { closePermPreview(); openEditPerm(permsPreviewItem); }}><FiEdit2 /> Edit</Button>
                  </RequirePermission>
                  <RequirePermission permission="permission.makeInactive">
                    <Button variant='outline' className="text-red-600" onClick={() => { closePermPreview(); confirmPermDelete(permsPreviewItem); }}><FiTrash2 /> Delete</Button>
                  </RequirePermission>
                </div>
              </>
            ) : '—'}
          </div>
        </DialogContent>
      </Dialog>
      {rolesCtx.open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeRolesCtx} />
          <div className="fixed z-50 bg-white border rounded shadow-md min-w-[14rem]" style={{ left: rolesCtx.x, top: rolesCtx.y }}>
            <div className="px-3 py-2 text-xs text-gray-500 border-b">{rolesCtx.colLabel}</div>
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { onRolesColumnFilterChange(rolesCtx.colKey, { op: 'eq', value: rolesCtx.value }); closeRolesCtx(); }}>Show matching</button>
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { onRolesColumnFilterChange(rolesCtx.colKey, { op: 'ne', value: rolesCtx.value }); closeRolesCtx(); }}>Filter out</button>
          </div>
        </>
      )}
      {permsCtx.open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closePermsCtx} />
          <div className="fixed z-50 bg-white border rounded shadow-md min-w-[14rem]" style={{ left: permsCtx.x, top: permsCtx.y }}>
            <div className="px-3 py-2 text-xs text-gray-500 border-b">{permsCtx.colLabel}</div>
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { onPermsColumnFilterChange(permsCtx.colKey, { op: 'eq', value: permsCtx.value }); closePermsCtx(); }}>Show matching</button>
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { onPermsColumnFilterChange(permsCtx.colKey, { op: 'ne', value: permsCtx.value }); closePermsCtx(); }}>Filter out</button>
          </div>
        </>
      )}
    </div>
  );
}
