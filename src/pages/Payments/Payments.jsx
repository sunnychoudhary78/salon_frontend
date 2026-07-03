import React, { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 0 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.post('/payments/query', {
        page,
        limit: 20,
        status: status || undefined,
      });
      setRows(res.data.rows || []);
      setMeta(res.data.meta || { page: 1, totalPages: 0 });
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <div className="flex gap-2">
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
        <Button onClick={() => fetchData(1)}>Refresh</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Checkout</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Salon</TableHead>
              <TableHead>Version</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.checkout_kind || row.payment_type}</TableCell>
                <TableCell>₹{row.amount}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.method}</TableCell>
                <TableCell>{row.salon?.salon_name || '-'}</TableCell>
                <TableCell>v{row.settings_version ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex gap-2">
        <Button disabled={meta.page <= 1} onClick={() => fetchData(meta.page - 1)}>Previous</Button>
        <Button disabled={meta.page >= meta.totalPages} onClick={() => fetchData(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}
