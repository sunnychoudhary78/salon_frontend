import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';

const PAGE_LIMIT = 20;
const EMPTY_FILTERS = Object.freeze({});

export default function AdminQueryPage({
  title,
  endpoint,
  extraFilters = EMPTY_FILTERS,
  renderActions,
  onRowClick,
  statusFilter,
  statusOptions = [],
}) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hasLoadedRef = useRef(false);
  const searchRef = useRef(search);
  const filterStatusRef = useRef(filterStatus);
  searchRef.current = search;
  filterStatusRef.current = filterStatus;

  const fetchData = useCallback(async (page = 1, overrides = {}) => {
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const activeSearch = overrides.search !== undefined ? overrides.search : searchRef.current;
    const activeFilterStatus = overrides.filterStatus !== undefined ? overrides.filterStatus : filterStatusRef.current;

    try {
      const body = {
        page,
        limit: PAGE_LIMIT,
        search: activeSearch || undefined,
        ...extraFilters,
      };
      if (statusFilter && activeFilterStatus) {
        body[statusFilter] = activeFilterStatus;
      }
      const res = await api.post(`${endpoint}/query`, body);
      setRows(res.data.rows || []);
      setColumns(res.data.columns || []);
      setMeta(res.data.meta || { page, limit: PAGE_LIMIT, total: 0, totalPages: 0 });
      hasLoadedRef.current = true;
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, extraFilters, statusFilter]);

  useEffect(() => {
    hasLoadedRef.current = false;
    setLoading(true);
    setRows([]);
    setColumns([]);
    fetchData(1);
  }, [endpoint, fetchData]);

  const handleSearch = () => {
    fetchData(1);
  };

  const handleStatusChange = (value) => {
    setFilterStatus(value);
    filterStatusRef.current = value;
    fetchData(1, { filterStatus: value });
  };

  const getCellValue = (row, key) => {
    if (row[key] !== undefined && row[key] !== null) return String(row[key]);
    const parts = key.split('.');
    let val = row;
    for (const p of parts) {
      val = val?.[p];
    }
    return val != null ? String(val) : '—';
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-48"
          />
          {statusOptions.length > 0 && (
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
          <Button onClick={handleSearch} disabled={refreshing}>Search</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className={`bg-white rounded-lg border overflow-x-auto relative ${refreshing ? 'opacity-60' : ''}`}>
          {refreshing && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Spinner />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                {renderActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="text-center py-8 text-gray-500">
                    No records found
                  </TableCell>
                </TableRow>
              ) : rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>{getCellValue(row, col.key)}</TableCell>
                  ))}
                  {renderActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {renderActions(row, () => fetchData(meta.page))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={meta.page <= 1 || refreshing} onClick={() => fetchData(meta.page - 1)}>Previous</Button>
            <Button variant="outline" disabled={meta.page >= meta.totalPages || refreshing} onClick={() => fetchData(meta.page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
