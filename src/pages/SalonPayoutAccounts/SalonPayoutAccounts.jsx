import React, { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SalonPayoutAccountsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/salon-payout-accounts/query', { page: 1, limit: 50 });
      setRows(res.data.rows || []);
    } catch {
      toast.error('Failed to load payout accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Salon Payout Accounts</h1>
      <Button onClick={fetchData}>Refresh</Button>
      {loading ? <p>Loading...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Holder</TableHead>
              <TableHead>IFSC</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.owner?.user?.name || row.salon_owner_id}</TableCell>
                <TableCell>{row.account_holder_name}</TableCell>
                <TableCell>{row.ifsc_code}</TableCell>
                <TableCell>{row.account_number_masked}</TableCell>
                <TableCell>{row.verification_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
