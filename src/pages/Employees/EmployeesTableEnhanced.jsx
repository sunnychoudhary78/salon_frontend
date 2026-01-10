
// File: src/components/EmployeesTableEnhanced.jsx
import React, { useState, useMemo } from 'react';
import useEmployees from '@/hooks/useEmployees';
import ColumnSearchRow from '@/components/ColumnSearchRow';
import FiltersPanel from '@/components/FiltersPanel';
import FilterChips from '@/components/FilterChips';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import TableConfigPanel from '@/components/config/TableConfigPanel';
import AddAdminDialog from '@/components/AddAdminDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal as BiDotsHorizontalRounded, Edit2 as FiEdit2, Trash2 as FiTrash2, MoreVertical as HiOutlineDotsVertical } from 'lucide-react';
import RequirePermission from '@/components/common/RequirePermission';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FiInfo, FiSearch } from 'react-icons/fi';
import { FiCheck, FiX } from 'react-icons/fi';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FiPlus } from 'react-icons/fi';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import api from '@/api/axios';
import { setEmployeeEditEnabled } from '@/api/employee';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';


export default function EmployeesTableEnhanced({ staticFilters, initialLimit = 10, className, ...props }) {
  const {
    columns, rows, meta, page, limit, loading,
    globalSearch, setGlobalSearch, isActive, setIsActive, setPage, setLimit,
    columnFilters, setColumnFilter, advancedFilters, applyAdvancedFilters, clearAllFilters,
    savedFilters, saveFilter, loadSavedFilter, deleteSavedFilter,
    sort, setSort, fetch
  } = useEmployees({ initialLimit, staticFilters });

  const [showColumnSearch, setShowColumnSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onColumnFilterChange = (key, spec) => setColumnFilter(key, spec);

  const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, colKey: null, colLabel: null, value: null, userId: null });
  const closeCtx = () => setCtx(prev => ({ ...prev, open: false }));
  const applyInclude = () => {
    if (!ctx.colKey) return closeCtx();
    const v = ctx.value;
    const spec = (v === null || typeof v === 'undefined' || v === '') ? { op: 'isEmpty', value: null } : { op: 'eq', value: v };
    setColumnFilter(ctx.colKey, spec);
    closeCtx();
  };
  const applyExclude = () => {
    if (!ctx.colKey) return closeCtx();
    const v = ctx.value;
    const spec = (v === null || typeof v === 'undefined' || v === '') ? { op: 'isNotEmpty', value: null } : { op: 'ne', value: v };
    setColumnFilter(ctx.colKey, spec);
    closeCtx();
  };

  const rowId = (r) => r.user_id || r.id;
  const [selected, setSelected] = useState(() => new Set());
  const allIdsOnPage = useMemo(() => new Set(rows.map(rowId)), [rows]);
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
  const clearSelection = () => setSelected(new Set());
  const [bulkColKey, setBulkColKey] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState({ userId: null, currentFile: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [editing, setEditing] = useState({ rowKey: null, colKey: null, value: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [roleOptions, setRoleOptions] = useState([]);
  const [deptOptions, setDeptOptions] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [deptHeadOptions, setDeptHeadOptions] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [genders, setGenders] = useState([]);




  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pwShow, setPwShow] = useState(false);
  const pwStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
  const [pwSaving, setPwSaving] = useState(false);
  const doChangePassword = async () => {
    if (!ctx.userId) return;
    if (!pwStrong) { toast.error('Password must be 8+ chars, include uppercase, number, and special character'); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/admin-change-password', { userId: ctx.userId, newPassword: pw });
      toast.success('Password changed');
      setPw('');
      setPwOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };






  const dateTimeFormator = (date) => {
    const d = new Date(date);
    const formattedDate = d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
    const formattedTime = d.toLocaleString("default", { hour: "numeric", minute: "numeric", hour12: true });
    return `${formattedDate} at ${formattedTime}`;
  }
  const dateOnlyFormator = (date) => {
    const d = new Date(date);
    return d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
  }
  const toDateInput = (val) => {
    try {
      if (!val) return '';
      const d = typeof val === 'string' ? parseISO(val) : new Date(val);
      if (!isValid(d)) return '';
      return format(d, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };
  const [headerMenuFor, setHeaderMenuFor] = useState(null);
  const openPreview = async (userId) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const resp = await api.get(`/employees/by-user/${userId}`);
      const payload = resp?.data;
      const employee = (payload && payload.data && payload.data.employee) ? payload.data.employee : payload;
      setPreviewData(employee || null);
    } catch (e) {
      setPreviewData({ error: e?.response?.data?.message || 'Failed to load' });
    } finally {
      setPreviewLoading(false);
    }
  };
  const closePreview = () => { setPreviewOpen(false); setPreviewData(null); };
  const toggleEditAccess = async () => {
    try {
      if (!previewData || !(previewData.user_id || previewData.userId)) return;
      const userId = previewData.user_id || previewData.userId;
      const nextEnabled = !(previewData.employee_edit_enabled === true);
      await api.patch(`/employees/${userId}/edit-enabled`, { enabled: nextEnabled });
      setPreviewData(prev => (prev ? { ...prev, employee_edit_enabled: nextEnabled } : prev));
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to toggle edit access');
    }
  };

  const openUpload = (userId, currentFilename) => {
    setUploadTarget({ userId, currentFile: currentFilename || null });
    setUploadFile(null);
    setUploadError('');
    setUploadOpen(true);
  };
  const closeUpload = () => {
    setUploadOpen(false);
    setUploadTarget({ userId: null, currentFile: null });
    setUploadFile(null);
    setUploadError('');
  };
  const doUpload = async () => {
    if (!uploadTarget.userId || !uploadFile) { setUploadError('Please select a file'); return; }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', uploadFile);
      await api.post(`/employee-photo/${uploadTarget.userId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetch({ page, limit });
      closeUpload();
    } catch (e) {
      setUploadError(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const startEdit = (rowKey, colKey, value) => {
    const isRole = /role/i.test(colKey);
    const isDeptHead = /(department_head(_id)?)/i.test(colKey);
    const isDept = /(^department(_id)?$|^department_name$)/i.test(colKey);
    const isManager = /manager/i.test(colKey);
    const isDesignation = /designation/i.test(colKey);
    const isGender = /^gender$/i.test(colKey);
    const isBloodGroup = /^blood_group$/i.test(colKey);
    const isMaritalStatus = /^marital_status$/i.test(colKey);
    const isActive = colKey === 'is_active' || colKey === 'active';
    const pickId = (...cands) => cands.find((v) => v != null);
    const row = rows.find(r => (r.user_id || r.id) === rowKey);
    let initial = value;
    if (isRole && row) {
      const rid = pickId(row.role_id, row.roleId, row.role_id_fk, row.Role?.id, row.user_role_id);
      if (rid != null) initial = String(rid);
      else {
        const name = typeof value === 'string' ? value : '';
        const matchLocal = roleOptions.find(o => o.name === name);
        if (matchLocal) initial = String(matchLocal.id);
        else {
          api.get('/roles?active=true').then(res => {
            const options = Array.isArray(res?.data?.roles) ? res.data.roles.map(r => ({ id: r.id, name: r.name })) : [];
            setRoleOptions(options);
            const m = options.find(o => o.name === name);
            if (m) setEditing(s => (s.rowKey === rowKey && s.colKey === colKey) ? { ...s, value: String(m.id) } : s);
          }).catch(() => { });
        }
      }
    }
    if (isDesignation) {
      if (!designationOptions || designationOptions.length === 0) {
        api.get('/company-settings/designations').then(res => {
          const options = Array.isArray(res?.data) ? res.data.map(d => ({ id: d.id, name: d.name })) : [];
          setDesignationOptions(options);
        }).catch(() => { });
      }
      // keep initial as the current designation name string
      if (typeof initial !== 'string') initial = String(initial ?? '');
    }
    if (isGender) {
      if (!genders || genders.length === 0) {
        api.get('/variables/genders').then(res => {
          const list = Array.isArray(res?.data) ? res.data : [];
          const names = list.map(x => (typeof x === 'string' ? x : (x && x.name) || '')).filter(Boolean);
          setGenders(names);
        }).catch(() => { });
      }
      if (typeof initial !== 'string') initial = String(initial ?? '');
    }
    if (isBloodGroup) {
      if (!bloodGroups || bloodGroups.length === 0) {
        api.get('/variables/blood-groups').then(res => {
          const list = Array.isArray(res?.data) ? res.data : [];
          const names = list.map(x => (typeof x === 'string' ? x : (x && x.name) || '')).filter(Boolean);
          setBloodGroups(names);
        }).catch(() => { });
      }
      if (typeof initial !== 'string') initial = String(initial ?? '');
    }
    if (isMaritalStatus) {
      if (!maritalStatuses || maritalStatuses.length === 0) {
        api.get('/variables/marital-statuses').then(res => {
          const list = Array.isArray(res?.data) ? res.data : [];
          const names = list.map(x => (typeof x === 'string' ? x : (x && x.name) || '')).filter(Boolean);
          setMaritalStatuses(names);
        }).catch(() => { });
      }
      if (typeof initial !== 'string') initial = String(initial ?? '');
    }
    if (isDept && row) {
      const did = pickId(row.department_id, row.departmentId, row.department?.id);
      if (did != null) initial = String(did);
      else {
        const name = typeof value === 'string' ? value : '';
        const matchLocal = deptOptions.find(o => o.name === name);
        if (matchLocal) initial = String(matchLocal.id);
        else {
          api.get('/departments').then(res => {
            const options = Array.isArray(res?.data?.departments) ? res.data.departments.map(d => ({ id: d.id, name: d.name })) : [];
            setDeptOptions(options);
            const m = options.find(o => o.name === name);
            if (m) setEditing(s => (s.rowKey === rowKey && s.colKey === colKey) ? { ...s, value: String(m.id) } : s);
          }).catch(() => { });
        }
      }
    }
    if (isDeptHead && row) {
      const dhid = pickId(row.department_head_id, row.departmentHeadId, row.department_head?.id);
      if (dhid != null) initial = String(dhid);
      else if (typeof value === 'string' && value) {
        const matchLocal = deptHeadOptions.find(o => o.name === value);
        if (matchLocal) initial = String(matchLocal.id);
      }
      api.get('/employees/department-heads').then(res => {
        const options = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        setDeptHeadOptions(options);
        if (!dhid && typeof value === 'string') {
          const m = options.find(o => o.name === value || String(o.email || '') === String(value));
          if (m) setEditing(s => (s.rowKey === rowKey && s.colKey === colKey) ? { ...s, value: String(m.id) } : s);
        }
      }).catch(() => { });
    }
    if (isManager && row) {
      const rid = pickId(row.role_id, row.roleId, row.role_id_fk, row.Role?.id, row.user_role_id);
      const mid = pickId(row.manager_id, row.managerId, row.manager?.id);
      if (mid != null) initial = String(mid);
      else if (typeof value === 'string' && value) {
        const matchLocal = managerOptions.find(o => o.name === value);
        if (matchLocal) initial = String(matchLocal.id);
      }
      const fetchByRole = async (roleId) => {
        try {
          const res = await api.get('/employees/manager-candidates', { params: { roleId } });
          let options = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
          // ensure current manager appears in list for prefill
          if (mid && !options.find(o => String(o.id) === String(mid))) {
            options = [{ id: mid, name: 'Current Manager', email: '' }, ...options];
          }
          setManagerOptions(options);
          if (!mid && typeof value === 'string') {
            const m = options.find(o => o.name === value || String(o.email || '') === String(value));
            if (m) setEditing(s => (s.rowKey === rowKey && s.colKey === colKey) ? { ...s, value: String(m.id) } : s);
          }
        } catch (_) { /* ignore */ }
      };
      if (rid != null) {
        fetchByRole(rid);
      } else {
        const uid = row.user_id || row.id;
        api.get(`/employees/by-user/${uid}`).then(resp => {
          const data = resp?.data?.data || {};
          const user = data.user || {};
          const employee = data.employee || {};
          const roleId2 = pickId(user?.role?.id, user?.role_id, user?.roleId, employee?.role_id, employee?.roleId);
          if (roleId2 != null) fetchByRole(roleId2);
        }).catch(() => { });
      }
    }
    if (isActive) {
      if (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'active') initial = 'true';
      else initial = 'false';
    }
    setEditing({ rowKey, colKey, value: String(initial ?? '') });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditing({ rowKey: null, colKey: null, value: '' });
  };

  const confirmEdit = async () => {
    if (!editing.rowKey || !editing.colKey) return;
    if (editError) { alert(editError); return; }
    setSavingEdit(true);
    try {
      const row = rows.find(r => r.user_id === editing.rowKey) || {};
      const isRole = /role/i.test(editing.colKey);
      const isDeptHead = /(department_head(_id)?)/i.test(editing.colKey);
      const isDept = /(^department(_id)?$|^department_name$)/i.test(editing.colKey);
      const isManager = /manager/i.test(editing.colKey);
      const isActive = editing.colKey === 'is_active' || editing.colKey === 'active';
      const applyForUser = async (userId) => {
        let userName = row.associates_name || row.user_name || row.name || '';
        let userEmail = row.email || row.user_email || '';
        try {
          const resp = await api.get(`/employees/by-user/${userId}`);
          const data = resp?.data?.data;
          if (data && data.user) {
            userName = data.user.name || userName;
            userEmail = data.user.email || userEmail;
          }
        } catch (_) { }
        const userPayload = { id: userId, name: userName, email: userEmail };
        const empPayload = { user_id: userId };
        if (isRole) {
          userPayload.roleId = editing.value;
        } else if (isDept) {
          empPayload.department_id = editing.value;
          const dep = deptOptions.find(d => String(d.id) === String(editing.value));
          if (dep && dep.name) empPayload.department_name = dep.name;
        } else if (isManager) {
          empPayload.manager_id = editing.value;
        } else if (isDeptHead) {
          empPayload.department_head_id = editing.value;
        } else if (isActive) {
          userPayload.is_active = (editing.value === 'true' || editing.value === true);
        } else {
          const isEmailKey = /^(email|user_email|contact_email)$/i.test(editing.colKey);
          if (isEmailKey) {
            userPayload.email = editing.value;
            empPayload.email = editing.value;
          } else {
            empPayload[editing.colKey] = editing.value;
          }
        }
        await api.post('/employees/create-or-update', { user: userPayload, employee: empPayload });
      };

      if (bulkColKey && bulkColKey === editing.colKey && selected.size > 0) {
        const ids = Array.from(selected);
        for (const id of ids) {
          const r2 = rows.find(r => r.user_id === id);
          if (r2 && r2.user_id) await applyForUser(r2.user_id);
        }
      } else {
        const userId = row.user_id;
        await applyForUser(userId);
      }
      await fetch({ page, limit });
      cancelEdit();
      clearSelection();
      setBulkColKey(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const sanitizeDecimal = (raw) => {
    let v = (raw || '').replace(/[^\d.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const intPart = v.slice(0, firstDot).replace(/\./g, '');
      const decPart = v.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
      v = intPart + (decPart.length ? '.' + decPart : '.');
    } else {
      v = v.replace(/\./g, '');
    }
    return v;
  };

  const isMoneyKey = (key) => ['basic', 'hra', 'conveyance', 'other_allowance', 'bonus', 'gross', 'ctc'].includes(String(key));
  const isPhoneKey = (key) => ['contact_primary', 'contact_secondary'].includes(String(key));
  const isAadharKey = (key) => ['aadhar_number_encrypted', 'aadhar_number'].includes(String(key));
  const isNumberKey = (key) => ['total_experience'].includes(String(key));
  const isEmailKey = (key) => /^(email|user_email|contact_email)$/i.test(String(key));
  const isNameKey = (key) => {
    const k = String(key);
    if (/designation/i.test(k)) return false;
    return k === 'name' || /_name$/i.test(k);
  };

  const makeSelectedInactive = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    for (const id of ids) {
      try { await api.post(`/employees/make-inactive/${id}`); } catch (e) { }
    }
    clearSelection();
    // refresh current page data
    fetch({ page, limit });
  };

  return (
    <section className={`min-h-0 flex flex-col min-w-0 overflow-hidden z-10 ml-4 ${className || 'h-screen'}`}>

      <div className="sticky top-0 z-20 bg-white  shrink-0">
        <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex justify-between items-center w-full gap-2">
            <div className='flex items-center gap-4'>
              <FiltersPanel columns={columns} onApply={applyAdvancedFilters} onSave={async ({ name, filterJson }) => {
                try { await saveFilter({ name, filterJson }); alert('Saved'); } catch (e) { alert('Save failed'); }
              }} />
            </div>

            <div className='flex gap-4'>
              <RequirePermission permission="user.create">
                <Button 
                  className='' 
                  size="" 
                  aria-label="Add New Employee" 
                  onClick={() => {
                    const companyId = staticFilters?.company_id?.value;
                    navigate('/employees/add-employee', { 
                      state: { 
                        from: location.pathname + location.search,
                        company_id: companyId 
                      } 
                    });
                  }}
                >
                  Add New Employee
                </Button>
              </RequirePermission>

              {/* <AddAdminDialog /> */}

              <TableConfigPanel
                tableKey="employees"
                onSaved={() => {
                  setPage(1);
                  fetch({ page: 1, limit });
                }}
              />

              <RequirePermission permission="user.makeInactive">
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" aria-label="Make Inactive" disabled={selected.size === 0}>
                          <FiTrash2 />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Make Inactive</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Make {selected.size} selected inactive?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This marks the selected employees as inactive.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={makeSelectedInactive}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RequirePermission>
            </div>

          </div>
        </div>
        <div className="p-2 bg-white">
          <FilterChips columnFilters={columnFilters} advancedFilters={advancedFilters} onRemoveColumnFilter={(k) => setColumnFilter(k, null)} onClearAll={clearAllFilters} />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white ">
        <div className="border rounded overflow-hidden h-full">
          <div className='relative h-full overflow-x-auto overflow-y-auto'>
            <Table className="min-w-max">
              <TableHeader className="sticky top-0 z-30 bg-white">
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-30 bg-white w-32 min-w-[8rem] shadow-[1px_0_0_0_#e5e7eb]">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                      <span className="text-xs text-gray-500">Select</span>
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
                  {columns.filter((col) => col.key !== "user_id").map((c, idx) => (
                    <TableHead
                      key={c.key}
                      className={`sticky top-0 group hover:bg-sky-100 bg-white ${idx === 0 ? 'left-32 z-20 border-r' : ''}`}
                      onContextMenu={(e) => { e.preventDefault(); setHeaderMenuFor(c.key); }}
                    >
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
                {showColumnSearch && <ColumnSearchRow columns={columns} columnFilters={columnFilters} onChange={onColumnFilterChange} stickyFirstDataColumn={true} stickyOffsetClass="left-32" leadingStickyWidthClass="w-32 min-w-[8rem] border-none shadow-[1px_0_0_0_#e5e7eb]" />}
              </TableHeader>

              <TableBody className={'border-b'}>
                {loading ? (
                  <TableRow><TableCell colSpan={columns.length + 1}>Loading...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length + 1}>No employees found.</TableCell></TableRow>
                ) : rows.map((r, i) => (
                  <TableRow key={r.user_id || i} className={`group ${selected.has(rowId(r)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-50' : '')} hover:bg-sky-100`}>
                    <TableCell className={`sticky left-0 z-20 w-32 min-w-[8rem] shadow-[1px_0_0_0_#e5e7eb] ${selected.has(rowId(r)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200`}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selected.has(rowId(r))} onCheckedChange={() => toggleOne(rowId(r))} />
                        <Button className={''} variant="outline" size="xs" onClick={() => openPreview(r.user_id || r.id)} aria-label="Preview"><FiInfo className='text-gray-400' /></Button>
                      </div>
                    </TableCell>
                    {columns.filter((col) => col.key !== "user_id").map((c, idx) => (
                      <TableCell
                        key={c.key}
                        onContextMenu={(e) => { e.preventDefault(); const val = r[c.key]; setCtx({ open: true, x: e.clientX, y: e.clientY, colKey: c.key, colLabel: c.label, value: val, userId: r.user_id || r.id }); }}
                        onClick={(e) => { if (e.ctrlKey) { setBulkColKey(c.key); toggleOne(rowId(r)); } else if (idx === 0) { navigate(`/employees/${r.user_id || r.id}/edit`, { state: { from: location.pathname + location.search } }); } }}
                        className={
                          (idx === 0
                            ? `sticky left-32 z-10 border-r ${selected.has(rowId(r)) ? 'bg-sky-100' : (i % 2 === 1 ? 'bg-gray-100' : 'bg-white')} group-hover:bg-sky-100 hover:bg-sky-200 cursor-pointer text-sky-500`
                            : 'hover:bg-sky-200')
                          + ((bulkColKey === c.key && selected.has(rowId(r))) ? ' ring-2 ring-sky-400' : '')
                          + (c.key === 'profile_picture' ? ' text-center' : '')
                        }
                      >
                        {c.key === 'profile_picture' ? (
                          (() => {
                            const raw = r[c.key];
                            if (!raw) {
                              return (
                                <button
                                  className="text-xs px-2 py-1 border rounded hover:bg-sky-50"
                                  onClick={() => openUpload(r.user_id || r.id, null)}
                                >
                                  Upload
                                </button>
                              );
                            }
                            const src = String(raw).startsWith('http') ? raw : `${import.meta.env.VITE_BASE_URL}/uploads/${raw}`;
                            return (
                              <div onDoubleClick={() => openUpload(r.user_id || r.id, raw)} className="flex items-center justify-center cursor-pointer ">
                                <img
                                  src={src}
                                  alt={r.associates_name || 'Profile'}
                                  className="w-10 h-10 rounded-lg object-cover border"
                                />
                              </div>
                            );
                          })()
                        ) : (
                          (() => {
                            const rk = rowId(r);
                            const v = r[c.key];
                            const isEditing = editing.rowKey === rk && editing.colKey === c.key;
                            if (isEditing) {
                              return (
                                <div className="flex items-center gap-2">
                                  {c.type === 'date' ? (
                                    <Input type="date" value={toDateInput(editing.value)} onChange={(e) => setEditing(s => ({ ...s, value: e.target.value }))} className="h-8 w-48" />
                                  ) : (c.key === 'is_active' || c.key === 'active') ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (/role/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {roleOptions.map(o => (<SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/department_head/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {deptHeadOptions.map(o => (<SelectItem key={o.id} value={String(o.id)}>{o.name} {o.email ? `(${o.email})` : ''}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/department(?!_head)/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {deptOptions.map(o => (<SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/manager/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {managerOptions.map(o => (<SelectItem key={o.id} value={String(o.id)}>{o.name} {o.email ? `(${o.email})` : ''}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/designation/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {designationOptions.map(o => (<SelectItem key={o.id} value={String(o.name)}>{o.name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/^gender$/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {genders.map(g => (<SelectItem key={g} value={String(g)}>{g}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/^blood_group$/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {bloodGroups.map(b => (<SelectItem key={b} value={String(b)}>{b}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (/^marital_status$/i.test(c.key)) ? (
                                    <Select value={String(editing.value)} onValueChange={(v) => setEditing(s => ({ ...s, value: v }))}>
                                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {maritalStatuses.map(m => (<SelectItem key={m} value={String(m)}>{m}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    (() => {
                                      const k = c.key;
                                      const val = String(editing.value ?? '');
                                      const commonProps = { className: 'h-8 w-48' };
                                      if (isMoneyKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              inputMode="numeric"
                                              value={val}
                                              onChange={(e) => {
                                                const next = (e.target.value || '').replace(/\D/g, '');
                                                setEditing(s => ({ ...s, value: next }));
                                                if (!/^\d+$/.test(next)) setEditError('Numbers only'); else setEditError('');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      if (isPhoneKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              inputMode="numeric"
                                              value={val}
                                              onChange={(e) => {
                                                const next = (e.target.value || '').replace(/\D/g, '').slice(0, 10);
                                                setEditing(s => ({ ...s, value: next }));
                                                if (next.length !== 10) setEditError('Phone must be exactly 10 digits'); else setEditError('');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      if (isAadharKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              inputMode="numeric"
                                              value={val}
                                              onChange={(e) => {
                                                const next = (e.target.value || '').replace(/\D/g, '').slice(0, 12);
                                                setEditing(s => ({ ...s, value: next }));
                                                if (next.length !== 12) setEditError('Aadhar must be 12 digits'); else setEditError('');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      if (isNumberKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              inputMode="numeric"
                                              value={val}
                                              onChange={(e) => {
                                                const next = (e.target.value || '').replace(/\D/g, '');
                                                setEditing(s => ({ ...s, value: next }));
                                                if (!/^\d+$/.test(next)) setEditError('Numbers only'); else setEditError('');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      if (isEmailKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="email"
                                              value={val}
                                              onChange={(e) => {
                                                const next = (e.target.value || '').trim();
                                                setEditing(s => ({ ...s, value: next }));
                                                const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next);
                                                setEditError(ok || next === '' ? '' : 'Invalid email');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      if (isNameKey(k)) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              value={val}
                                              onChange={(e) => {
                                                const raw = e.target.value || '';
                                                const next = raw.replace(/[^A-Za-z\s]/g, '');
                                                setEditing(s => ({ ...s, value: next }));
                                                setEditError('');
                                              }}
                                              {...commonProps}
                                            />
                                            {editError ? <span className="text-red-600 text-xs">{editError}</span> : null}
                                          </div>
                                        );
                                      }
                                      return (
                                        <Input value={val} onChange={(e) => { setEditing(s => ({ ...s, value: e.target.value })); setEditError(''); }} {...commonProps} />
                                      );
                                    })()
                                  )}
                                  <Button variant="secondary" size="xs" onClick={confirmEdit} disabled={savingEdit} aria-label="Save"><FiCheck /></Button>
                                  <Button variant="outline" size="xs" onClick={cancelEdit} disabled={savingEdit} aria-label="Cancel"><FiX /></Button>
                                </div>
                              );
                            }
                            if (typeof v === 'undefined' || v === null || v === '') return (
                              <div onDoubleClick={() => startEdit(rk, c.key, v)}>-</div>
                            );
                            if (c.type === 'boolean') return (
                              <div onDoubleClick={() => startEdit(rk, c.key, v)}>
                                {c.key === 'is_active' || c.key === 'active' ? (v ? 'Active' : 'Inactive') : (v ? 'Yes' : 'No')}
                              </div>
                            );
                            if (c.type === 'date') return (
                              <div onDoubleClick={() => startEdit(rk, c.key, v)}>{(/^(created_at|updated_at)$/i.test(c.key)) ? dateTimeFormator(v) : dateOnlyFormator(v)}</div>
                            );
                            return (
                              <div onDoubleClick={() => startEdit(rk, c.key, v)}>{String(v)}</div>
                            );
                          })()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {ctx.open && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeCtx} />
              <div className="fixed z-50 bg-white border rounded shadow-md min-w-[14rem]" style={{ left: ctx.x, top: ctx.y }}>
                <div className="px-3 py-2 text-xs text-gray-500 border-b">{ctx.colLabel}</div>
                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={applyInclude}>Show matching</button>
                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={applyExclude}>Filter out</button>
                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setPwOpen(true); closeCtx(); }}>Change password…</button>
              </div>
            </>
          )}
          <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Employee Preview</span>

                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {previewLoading ? (
                  <div>Loading…</div>
                ) : previewData && !previewData.error ? (
                  <div className="text-sm">
                    <div className="flex items-start gap-4">
                      {previewData.profile_picture ? (
                        <img
                          src={String(previewData.profile_picture).startsWith('http') ? previewData.profile_picture : `${import.meta.env.VITE_BASE_URL}/uploads/${previewData.profile_picture}`}
                          alt={previewData.associates_name || 'Profile'}
                          className="w-16 h-16 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 border flex items-center justify-center text-gray-600">
                          {(previewData.associates_name || '-').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-base font-semibold">{previewData.associates_name || '-'}</div>
                        <div className="text-xs text-gray-600">
                          {(previewData.designation || '-')}{previewData.department_name ? ` • ${previewData.department_name}` : ''}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded border">ID: {previewData.payroll_code || '-'}</span>
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded border">DOJ: {dateOnlyFormator(previewData.doj)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2"><span className="text-gray-500">Email:</span><span>{previewData.email || '-'}</span></div>
                      <div className="flex items-center gap-2"><span className="text-gray-500">Manager:</span><span>{(previewData.manager && previewData.manager.name) || previewData.manager_id || '-'}</span></div>
                    </div>

                    <div className="mt-3 flex items-center justify-between ">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Employee Edit Enabled:</span>
                        <span>{typeof previewData.employee_edit_enabled === 'boolean' ? (previewData.employee_edit_enabled ? 'Yes' : 'No') : '-'}</span>
                      </div>
                      {/* <RequirePermission permission="user.update">
                        <Button
                          size="sm"
                          variant={previewData?.employee_edit_enabled ? 'outline' : 'default'}
                          onClick={async () => {
                            try {
                              const uid = previewData?.user_id;
                              if (!uid) return;
                              const next = !previewData?.employee_edit_enabled;
                              await setEmployeeEditEnabled(uid, next);
                              setPreviewData(prev => ({ ...(prev || {}), employee_edit_enabled: next }));
                              toast.success(next ? 'Enabled edit mode' : 'Disabled edit mode');
                            } catch (e) {
                              toast.error(e?.response?.data?.message || 'Failed to toggle edit mode');
                            }
                          }}
                        >
                          {previewData?.employee_edit_enabled ? 'Disable Edit' : 'Enable Edit'}
                        </Button>
                      </RequirePermission> */}
                    </div>

                    <div className='mt-3 '>
                      <RequirePermission permission="user.update">
                        <div className="flex gap-4">
                          <Button size="sm" onClick={() => { if (previewData && (previewData.user_id || previewData.userId)) navigate(`/employees/${previewData.user_id || previewData.userId}/edit`, { state: { from: location.pathname + location.search } }); }}><FiEdit2 /> Edit</Button>
                          <Button
                            size="sm"
                            className={previewData?.employee_edit_enabled ? 'bg-yellow-500 hover:bg-yellow-600 ' : 'bg-blue-600 hover:bg-blue-700 '}
                            onClick={toggleEditAccess}
                          >
                            {previewData?.employee_edit_enabled ? 'Disable Edit Access' : 'Enable Edit Access'}
                          </Button>
                        </div>
                      </RequirePermission>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">{previewData && previewData.error ? previewData.error : 'Failed to load'}</div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) closeUpload(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {uploadTarget.currentFile ? (
                  (() => {
                    const src = String(uploadTarget.currentFile).startsWith('http')
                      ? uploadTarget.currentFile
                      : `${import.meta.env.VITE_BASE_URL}/uploads/${uploadTarget.currentFile}`;
                    return <img src={src} alt="Current" className="w-20 h-20 rounded-lg object-cover border" />;
                  })()
                ) : (
                  <div className="text-xs text-gray-500">No current photo</div>
                )}
                <Input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => setUploadFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                {uploadError ? <div className="text-red-600 text-xs">{uploadError}</div> : null}
                <div className="flex items-center gap-2">
                  <Button onClick={doUpload} disabled={uploadLoading || !uploadFile}>Upload</Button>
                  <Button variant="outline" onClick={closeUpload} disabled={uploadLoading}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={pwOpen} onOpenChange={setPwOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">New Password</label>
                  <div className="relative mt-1">
                    <Input type={pwShow ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="********" />
                    <button type="button" onClick={() => setPwShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm" aria-label={pwShow ? 'Hide password' : 'Show password'}>
                      {pwShow ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pw && !pwStrong && (
                    <p className="text-red-500 text-xs mt-1">Password must be 8+ chars and include uppercase, number, and special character</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={doChangePassword} disabled={pwSaving || !pwStrong}>Change</Button>
                  <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSaving}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 p-4 bg-white flex items-center justify-between shrink-0">
        <div>Showing page {meta.page} of {meta.totalPages} — {meta.total} total</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2"><label>Per page:</label>
            <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map(n => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <div>{page}</div>
          <Button onClick={() => setPage(p => p < meta.totalPages ? p + 1 : p)} disabled={page >= meta.totalPages}>Next</Button>
        </div>
      </div>

    </section>
  );
}

