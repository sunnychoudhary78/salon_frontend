// File: src/components/FilterChips.jsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FilterChips({ columnFilters, advancedFilters, onRemoveColumnFilter, onClearAll }) {
  const colKeys = Object.keys(columnFilters || {});
  return (
    <div className="flex gap-2 items-center flex-wrap">
      {colKeys.map(k => (
        <Badge key={k} className="px-2 py-1">
          {k}: {String(columnFilters[k].value)}
          <button className="ml-2 text-xs" onClick={()=>onRemoveColumnFilter(k)}>x</button>
        </Badge>
      ))}
      {(advancedFilters || []).map((f, i) => (
        <Badge key={i} className="px-2 py-1">{f.field} {f.op} {String(f.value)}</Badge>
      ))}
      {colKeys .length > 0 || (advancedFilters || []).length > 0 && <Button variant="ghost" size="sm" onClick={onClearAll}>Clear</Button>}
    </div>
  );
}