import React, { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SettlementBatchesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState('');
  const [ledgerIds, setLedgerIds] = useState('');
  const [utr, setUtr] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/settlements/batches/query', { page: 1, limit: 50 });
      setRows(res.data.rows || []);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createBatch = async () => {
    try {
      await api.post('/settlements/batches', {
        salon_id: salonId,
        ledger_entry_ids: ledgerIds.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Batch created');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create batch');
    }
  };

  const approve = async (id) => {
    try {
      await api.patch(`/settlements/batches/${id}/approve`);
      toast.success('Batch approved');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    }
  };

  const settle = async (id) => {
    try {
      await api.patch(`/settlements/batches/${id}/settle`, {
        settlement_reference: utr,
      });
      toast.success('Batch settled');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to settle');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settlement Batches</h1>

      <div className="border rounded-lg p-4 space-y-3 max-w-2xl">
        <h2 className="font-medium">Create batch</h2>
        <Input placeholder="Salon ID" value={salonId} onChange={(e) => setSalonId(e.target.value)} />
        <Input placeholder="Ledger entry IDs (comma-separated)" value={ledgerIds} onChange={(e) => setLedgerIds(e.target.value)} />
        <Button onClick={createBatch}>Create Draft Batch</Button>
      </div>

      <div className="flex gap-2 items-center">
        <Input placeholder="UTR / reference for settle" value={utr} onChange={(e) => setUtr(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={fetchData}>Refresh</Button>
      </div>

      {loading ? <p>Loading...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Salon</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.batch_number}</TableCell>
                <TableCell>{row.salon?.salon_name || row.salon_id}</TableCell>
                <TableCell>₹{row.total_salon_net}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="space-x-2">
                  {row.status === 'DRAFT' && <Button size="sm" onClick={() => approve(row.id)}>Approve</Button>}
                  {row.status === 'APPROVED' && <Button size="sm" onClick={() => settle(row.id)}>Settle</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
