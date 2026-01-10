// File: src/components/FiltersPanel.jsx
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CiFilter } from "react-icons/ci";

// Simple single-level filter builder
export default function FiltersPanel({ columns, onApply, onSave }) {
  const [open, setOpen] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [nameToSave, setNameToSave] = useState('');

  const opsByType = useMemo(() => ({
    string: [
      { k: 'startsWith', l: 'starts with' },
      { k: 'endsWith', l: 'ends with' },
      { k: 'contains', l: 'contains' },
      { k: 'notContains', l: 'does not contain' },
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      // { k: 'isEmpty', l: 'is empty' },
      // { k: 'isNotEmpty', l: 'is not empty' },
      // { k: 'isAnything', l: 'is anything' },
      // { k: 'in', l: 'is one of' },
      // { k: 'isEmptyString', l: 'is empty string' },
      // { k: 'same', l: 'is same' },
      // { k: 'different', l: 'is different' },
    ],
    number: [
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      { k: 'lt', l: 'less than' },
      { k: 'lte', l: 'less than or equal to' },
      { k: 'gt', l: 'greater than' },
      { k: 'gte', l: 'greater than or equal to' },
      { k: 'between', l: 'between' },
      // { k: 'in', l: 'is one of' },
      // { k: 'isEmpty', l: 'is empty' },
      // { k: 'isNotEmpty', l: 'is not empty' },
      // { k: 'isAnything', l: 'is anything' },
      // { k: 'same', l: 'is same' },
      // { k: 'different', l: 'is different' },
    ],
    date: [
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      { k: 'lt', l: 'less than' },
      { k: 'lte', l: 'less than or equal to' },
      { k: 'gt', l: 'greater than' },
      { k: 'gte', l: 'greater than or equal to' },
      { k: 'between', l: 'between' },
      // { k: 'isEmpty', l: 'is empty' },
      // { k: 'isNotEmpty', l: 'is not empty' },
      // { k: 'isAnything', l: 'is anything' },
      // { k: 'same', l: 'is same' },
      // { k: 'different', l: 'is different' },
    ],
    boolean: [
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      // { k: 'isAnything', l: 'is anything' },
    ],
    uuid: [
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      // { k: 'in', l: 'is one of' },
      // { k: 'isEmpty', l: 'is empty' },
      // { k: 'isNotEmpty', l: 'is not empty' },
      // { k: 'isAnything', l: 'is anything' },
      // { k: 'same', l: 'is same' },
      // { k: 'different', l: 'is different' },
    ],
    count: [
      { k: 'eq', l: 'is' },
      { k: 'ne', l: 'is not' },
      { k: 'lt', l: 'less than' },
      { k: 'lte', l: 'less than or equal to' },
      { k: 'gt', l: 'greater than' },
      { k: 'gte', l: 'greater than or equal to' },
      // { k: 'between', l: 'between' },
      // { k: 'isEmpty', l: 'is empty' },
      // { k: 'isNotEmpty', l: 'is not empty' },
      // { k: 'isAnything', l: 'is anything' },
      // { k: 'same', l: 'is same' },
      // { k: 'different', l: 'is different' },
    ],
  }), []);

  const addCondition = () => {
    const first = columns[0];
    const t = first?.type || 'string';
    const defaultOp = t === 'string' ? 'contains' : 'eq';
    setConditions(c => [...c, { field: first?.key || '', op: defaultOp, value: '' }]);
  };
  const updateCondition = (idx, patch) => setConditions(c => { const clone = [...c]; clone[idx] = { ...clone[idx], ...patch }; return clone; });
  const removeCondition = (idx) => setConditions(c => c.filter((_, i) => i !== idx));

  const handleApply = () => {
    const advanced = conditions.map(cond => {
      const col = columns.find(c => c.key === cond.field);
      const t = col?.type || 'string';
      let value = cond.value;
      if (cond.op === 'isEmpty') {
        value = null;
      } else if (cond.op === 'isNotEmpty') {
        value = null;
      } else if (cond.op === 'isEmptyString') {
        value = '';
      }
      if (cond.op === 'between') {
        const from = cond.valueFrom ?? '';
        const to = cond.valueTo ?? '';
        value = [from, to];
      } else if (cond.op === 'in') {
        const v = String(value || '').split(',').map(s => s.trim()).filter(Boolean);
        value = v;
      } else if (t === 'number' || t === 'count') {
        if (Array.isArray(value)) value = value.map(v => v === '' ? null : Number(v));
        else value = value === '' ? null : Number(value);
      } else if (t === 'boolean') {
        value = String(value) === 'true' ? true : String(value) === 'false' ? false : null;
      } else if (t === 'date') {
        if (cond.op === 'between') {
          value = [cond.valueFrom || '', cond.valueTo || ''];
        }
      }
      const finalOp = cond.op === 'same' ? 'eq' : cond.op === 'different' ? 'ne' : cond.op;
      const isStringEq = (t === 'string') && (finalOp === 'eq' || finalOp === 'ne');
      const extra = isStringEq ? { caseInsensitive: true } : {};
      return { field: cond.field, op: finalOp, value, ...extra };
    });
    onApply(advanced);
    setOpen(false);
  };

  const handleSave = () => {
    const filterJson = { advancedFilters: conditions.map(c => ({ field: c.field, op: c.op, value: c.value })) };
    if (!nameToSave) return;
    onSave({ name: nameToSave, filterJson });
    setNameToSave('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <h2 className='border border-gray-300 rounded-md cursor-pointer'>
              <CiFilter className='text-2xl m-1.5 ' />
            </h2>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Advanced filters</TooltipContent>
      </Tooltip>
      <DialogContent className="w-[900px] max-w-full">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {conditions.map((cond, idx) => {
            const col = columns.find(c => c.key === cond.field) || columns[0] || {};
            const t = col.type || 'string';
            const ops = opsByType[t] || opsByType.string;
            const showValue = !['isEmpty','isNotEmpty','isAnything','isEmptyString'].includes(cond.op);
            const isBetween = cond.op === 'between';
            const isBoolean = t === 'boolean';
            const isDate = t === 'date';
            return (
            <div key={idx} className="flex flex-wrap gap-2 items-center">
              <Select value={cond.field} onValueChange={v => {
                const nextCol = columns.find(c => c.key === v);
                const nt = nextCol?.type || 'string';
                const defaultOp = nt === 'string' ? 'contains' : 'eq';
                updateCondition(idx, { field: v, op: defaultOp, value: '' , valueFrom: '', valueTo: ''});
              }}>
                <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map(col => <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={cond.op} onValueChange={v => updateCondition(idx, { op: v })}>
                <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ops.map(o => <SelectItem key={o.k} value={o.k}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>

              {showValue && !isBetween && !isBoolean && (
                isDate ? (
                  <Input type="date" value={cond.value || ''} onChange={e => updateCondition(idx, { value: e.target.value })} />
                ) : (
                  <Input value={cond.value || ''} onChange={e => updateCondition(idx, { value: e.target.value })} placeholder="Value" />
                )
              )}
              {showValue && isBoolean && (
                <Select value={String(cond.value)} onValueChange={v => updateCondition(idx, { value: v })}>
                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {showValue && isBetween && (
                <div className="flex gap-2 items-center">
                  {isDate ? (
                    <>
                      <Input type="date" value={cond.valueFrom || ''} onChange={e => updateCondition(idx, { valueFrom: e.target.value })} />
                      <Input type="date" value={cond.valueTo || ''} onChange={e => updateCondition(idx, { valueTo: e.target.value })} />
                    </>
                  ) : (
                    <>
                      <Input value={cond.valueFrom || ''} onChange={e => updateCondition(idx, { valueFrom: e.target.value })} placeholder="From" />
                      <Input value={cond.valueTo || ''} onChange={e => updateCondition(idx, { valueTo: e.target.value })} placeholder="To" />
                    </>
                  )}
                </div>
              )}

              <Button variant="ghost" onClick={() => removeCondition(idx)}>Remove</Button>
            </div>
            );
          })}

          <div className="flex gap-2">
            <Button onClick={addCondition}>Add Condition</Button>
            <Button variant="ghost" onClick={() => { setConditions([]); }}>Clear All</Button>
          </div>

          {/* <div className="flex items-center gap-2">
            <Input placeholder="Save as..." value={nameToSave} onChange={e=>setNameToSave(e.target.value)} />
            <Button onClick={handleSave}>Save Filter</Button>
          </div> */}

        </div>

        <DialogFooter>
          <Button onClick={handleApply}>Apply</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
