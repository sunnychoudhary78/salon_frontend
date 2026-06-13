import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';

export default function AuditLogsPage() {
  return <AdminQueryPage title="Audit Logs" endpoint="/audit-logs" />;
}
