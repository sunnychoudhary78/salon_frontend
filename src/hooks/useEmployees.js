// File: src/hooks/useEmployees.js
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/api/axios';

// Helper debounce
function useDebouncedCallback(fn, wait) {
  const timer = useRef();
  const callback = useRef(fn);
  useEffect(() => { callback.current = fn; }, [fn]);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback.current(...args), wait);
  }, [wait]);
}

export default function useEmployees({ initialPage = 1, initialLimit = 20, staticFilters = {} } = {}) {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: initialPage, limit: initialLimit, total: 0, totalPages: 0 });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // per-column quick filters (simple map key -> { op, value })
  const [columnFilters, setColumnFilters] = useState({});

  // advanced filters array (json shape described earlier)
  const [advancedFilters, setAdvancedFilters] = useState([]);

  // saved filters list
  const [savedFilters, setSavedFilters] = useState([]);
  // sorting
  const [sort, setSort] = useState(null); // { key, dir: 'asc'|'desc' }

  // abort controller for in-flight requests
  const abortCtrlRef = useRef(null);

  const fetch = useCallback(async ({ page: p = page, limit: l = limit, global = globalSearch, columnFilters: cf = columnFilters, advanced = advancedFilters, is_active = isActive, columns: requestedColumns = null, sort: s = sort } = {}) => {
    if (abortCtrlRef.current) {
      try { abortCtrlRef.current.abort(); } catch (e) { }
    }
    const ac = new AbortController();
    abortCtrlRef.current = ac;

    setLoading(true);
    try {
      // Merge staticFilters into columnFilters
      const finalColumnFilters = { ...cf, ...staticFilters };

      const payload = {
        page: p,
        limit: l,
        search: global || undefined,
        is_active: (typeof is_active === 'boolean') ? is_active : undefined,
        columnFilters: Object.keys(finalColumnFilters).length ? finalColumnFilters : undefined,
        advancedFilters: Array.isArray(advanced) && advanced.length ? advanced : undefined,
        columns: requestedColumns || undefined,
        sort: (s && s.key && s.dir) ? s : undefined,
      };

      // use POST /employees/query
      const resp = await api.post('/employees/query', payload, { signal: ac.signal });
      const data = resp.data || {};
      setColumns(Array.isArray(data.columns) ? data.columns : []);
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setMeta(data.meta || { page: p, limit: l, total: 0, totalPages: 0 });
      setPage((data.meta && data.meta.page) || p);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        // cancelled, ignore
      } else {
        console.error('Failed fetching employees', err);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, globalSearch, columnFilters, advancedFilters, isActive, sort, JSON.stringify(staticFilters)]);

  // debounced fetch for live search
  const debouncedFetch = useDebouncedCallback(fetch, 300);

  // initial load and when page/limit changes
  useEffect(() => {
    fetch({ page, limit });
  }, [page, limit]);

  // helpers to mutate filters and trigger debounced fetch
  const setColumnFilter = (key, spec) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!spec || spec.value === '' || typeof spec.value === 'undefined' || spec.value === null) {
        delete next[key];
      } else {
        next[key] = spec;
      }
      // reset page and fetch with updated filters
      setPage(1);
      debouncedFetch({ page: 1, limit, columnFilters: next });
      return next;
    });
  };

  const setGlobal = (val) => {
    setGlobalSearch(val);
    setPage(1);
    debouncedFetch({ page: 1, limit, global: val });
  };

  const applyAdvancedFilters = (filtersArray) => {
    setAdvancedFilters(filtersArray || []);
    setPage(1);
    fetch({ page: 1, limit, advanced: filtersArray });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setAdvancedFilters([]);
    setGlobalSearch('');
    setPage(1);
    fetch({ page: 1, limit, columnFilters: {}, advanced: [], sort: null });
  };

  // saved filters CRUD
  const loadSavedFilters = async () => {
    try {
      const resp = await api.get('/employees/filters');
      setSavedFilters(resp.data || []);
    } catch (e) { console.error('failed loading saved filters', e); }
  };

  const saveFilter = async ({ name, filterJson, is_shared = false, table_key = 'employees_table' }) => {
    try {
      const resp = await api.post('/employees/filters/save', { name, table_key, filter_json: filterJson, is_shared });
      await loadSavedFilters();
      return resp.data;
    } catch (e) { throw e; }
  };

  const loadSavedFilter = async (id) => {
    try {
      const resp = await api.get(`/employees/filters/${id}`);
      const f = resp.data;
      // apply filter
      if (f && f.filter_json) {
        // apply as advancedFilters
        setAdvancedFilters(f.filter_json.advancedFilters || []);
        setColumnFilters(f.filter_json.columnFilters || {});
        setGlobalSearch(f.filter_json.search || '');
        setPage(1);
        fetch({ page: 1, limit, columnFilters: f.filter_json.columnFilters || {}, advanced: f.filter_json.advancedFilters || [], global: f.filter_json.search || '' });
      }
    } catch (e) { console.error('failed loading saved filter', e); }
  };

  const deleteSavedFilter = async (id) => {
    try {
      await api.delete(`/employees/filters/${id}`);
      await loadSavedFilters();
    } catch (e) { console.error('failed deleting saved filter', e); }
  };

  useEffect(() => { loadSavedFilters(); }, []);

  return {
    columns,
    rows,
    meta,
    page,
    limit,
    loading,
    globalSearch,
    setGlobalSearch: setGlobal,
    isActive,
    setIsActive,
    setPage,
    setLimit,
    columnFilters,
    setColumnFilter,
    advancedFilters,
    applyAdvancedFilters,
    clearAllFilters,
    fetch,
    // saved filters
    savedFilters,
    saveFilter,
    loadSavedFilter,
    deleteSavedFilter,
    sort,
    setSort: ({ key, dir }) => { const next = { key, dir }; setSort(next); setPage(1); fetch({ page: 1, limit, sort: next }); },
  };
}
