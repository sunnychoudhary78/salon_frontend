// File: src/components/ColumnSearchRow.jsx
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import api from '@/api/axios';

export default function ColumnSearchRow({ columns, columnFilters, onChange, stickyFirstDataColumn = false, stickyOffsetClass = '', leadingStickyPlaceholder = true, leadingStickyWidthClass = 'w-32 min-w-[8rem]' }) {
    // columns: [{ key, label, type, operators }]
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        const hasRoleColumn = Array.isArray(columns) && columns.some(c => ['role', 'role_name', 'role_id', 'roleId'].includes(c.key));
        if (!hasRoleColumn) return;
        let cancelled = false;
        const fetchRoles = async () => {
            try {
                const res = await api.get('/roles');
                const list = Array.isArray(res.data) ? res.data : (res.data?.roles || []);
                const normalized = list.map(r => ({
                    id: r.id ?? r.role_id ?? r.id,
                    name: r.name ?? r.role_name ?? r.name,
                })).filter(r => r.id != null && r.name);
                if (!cancelled) setRoles(normalized);
            } catch (e) {
                console.warn('Failed to load roles', e);
            }
        };
        fetchRoles();
        return () => { cancelled = true; };
    }, [columns]);
    const visibleCols = columns.filter((col) => col.key !== "user_id");
    return (
        <tr className="bg-gray-50 ">
            {leadingStickyPlaceholder ? <td className={`sticky left-0 z-30 bg-white border-r ${leadingStickyWidthClass}`} /> : null}
            {visibleCols.map((col, idx) => {
                const key = col.key;
                const filter = columnFilters[key] || {};
                const rawType = col.type || 'string';
                const isLikelyDateKey = /(^|_|\b)(date|dob|doj|dol|created_at|updated_at)(\b|$)/i.test(String(key));
                const t = isLikelyDateKey ? 'date' : rawType;
                const baseCellClass = " py-2 whitespace-nowrap px-2";
                const stickyClass = (stickyFirstDataColumn && idx === 0)
                    ? ` sticky z-20 ${stickyOffsetClass} bg-white`
                    : "";

                // Special: Accrual Strategy dropdown
                if (key === 'accrualStrategy') {
                    const currentVal = filter.value;
                    const selectValue = (currentVal === null || typeof currentVal === 'undefined' || currentVal === '')
                        ? '__any__'
                        : String(currentVal);
                    return (
                        <td key={key} className={`${baseCellClass}${stickyClass}`}>
                            <Select
                                value={selectValue}
                                onValueChange={(val) => {
                                    if (val === '__any__') return onChange(key, { op: 'eq', value: null });
                                    return onChange(key, { op: 'eq', value: val });
                                }}
                            >
                                <SelectTrigger className="w-44 h-8"><SelectValue placeholder="Any" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__any__">Any</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>
                        </td>
                    );
                }
                // Role dropdown filter
                if (key === 'role' || key === 'role_name' || key === 'role_id' || key === 'roleId') {
                    const isIdKey = key === 'role_id' || key === 'roleId';
                    const currentVal = filter.value;
                    const selectValue = (currentVal === null || typeof currentVal === 'undefined' || currentVal === '')
                        ? '__any__'
                        : isIdKey ? String(currentVal) : String(currentVal);
                    return (
                        <td key={key} className={`${baseCellClass}${stickyClass}`}>
                            <Select
                                value={selectValue}
                                onValueChange={(val) => {
                                    if (val === '__any__') return onChange(key, { op: 'eq', value: null });
                                    const out = isIdKey ? Number(val) : val;
                                    return onChange(key, { op: 'eq', value: out });
                                }}
                            >
                                <SelectTrigger className="w-44 h-8"><SelectValue placeholder="Any" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__any__">Any</SelectItem>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={isIdKey ? String(r.id) : r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </td>
                    );
                }
                if (t === 'boolean') {
                    return (
                        <td key={key} className={`${baseCellClass}${stickyClass}`}>
                            <Select
                                value={filter.value === true ? 'true' : filter.value === false ? 'false' : '__any__'}
                                onValueChange={(val) => {
                                    // translate sentinel back to null
                                    if (val === '__any__') return onChange(key, { op: 'eq', value: null });
                                    return onChange(key, { op: 'eq', value: val === 'true' });
                                }}
                            >
                                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__any__">Any</SelectItem>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </td>
                    );
                }

                if (t === 'date') {
                    // simple date input (ISO) - can be replaced with datepicker
                    return (
                        <td key={key} className={` py-2 px-2${stickyClass}`}>
                            <Input type="date" value={filter.value || ''} onChange={(e) => onChange(key, { op: 'eq', value: e.target.value || null })} />
                        </td>
                    );
                }

                // number/count: numeric-only input
                if (t === 'number' || t === 'count') {
                    const val = typeof filter.value === 'number' ? String(filter.value) : String(filter.value || '');
                    return (
                        <td key={key} className={`${baseCellClass}${stickyClass}`}>
                            <Input
                                type="number"
                                value={val}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    // allow empty, integers or decimals
                                    const cleaned = raw === '' ? '' : raw.replace(/[^0-9.\-]/g, '');
                                    const num = cleaned === '' ? null : Number(cleaned);
                                    onChange(key, { op: 'eq', value: num });
                                }}
                                placeholder={`Search ${col.label}`}
                            />
                        </td>
                    );
                }

                // default: string
                return (
                    <td key={key} className={`${baseCellClass}${stickyClass}`}>
                        <Input value={filter.value || ''} onChange={(e) => onChange(key, { op: 'contains', value: e.target.value })} placeholder={`Search ${col.label}`} />
                    </td>
                );
            })}
        </tr>
    );
}
