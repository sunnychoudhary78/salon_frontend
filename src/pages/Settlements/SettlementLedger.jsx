import React, { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SettlementLedgerPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/settlements/ledger/query', { page: 1, limit: 50, status: 'PENDING' });
      setRows(res.data.rows || []);
    } catch {
      toast.error('Failed to load settlement ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settlement Ledger</h1>
      <Button onClick={fetchData}>Refresh</Button>
      {loading ? <p>Loading...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Settings v</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.entry_type}</TableCell>
                <TableCell>₹{row.amount}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>v{row.settings_version}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
