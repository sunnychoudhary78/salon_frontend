import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';
import api from '@/api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function StatCard({ label, value, to, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  const inner = (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const permissions = useSelector(selectMyPermissions) || [];
  const hasStats = permissions.includes('stats.read');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (!hasStats) return;
    Promise.all([
      api.get('/stats/salon-overview'),
      api.get('/stats/charts'),
      api.get('/stats/recent-activity'),
    ]).then(([s, c, a]) => {
      setStats(s.data);
      setCharts(c.data);
      setActivity(a.data);
    }).catch(console.error);
  }, [hasStats]);

  if (!hasStats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Salon Marketplace Admin</h1>
        <p className="text-gray-500 mt-2">Welcome to the platform admin panel.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Salons" value={stats?.totalSalons} to="/salons" />
        <StatCard label="Pending Applications" value={stats?.pendingApplications} to="/salon-applications" color="amber" />
        <StatCard label="Total Customers" value={stats?.totalCustomers} to="/customers" color="green" />
        <StatCard label="Total Bookings" value={stats?.totalBookings} to="/bookings" />
        <StatCard label="Pending Bookings" value={stats?.pendingBookings} to="/bookings" color="amber" />
        <StatCard label="Completed Bookings" value={stats?.completedBookings} to="/bookings" color="green" />
        <StatCard label="Approved Salons" value={stats?.approvedSalons} to="/salons" color="rose" />
      </div>

      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { title: 'Salon Growth', data: charts.salonGrowth, color: '#6366f1' },
            { title: 'Customer Growth', data: charts.customerGrowth, color: '#10b981' },
            { title: 'Booking Trends', data: charts.bookingTrends, color: '#f59e0b' },
          ].map(({ title, data, color }) => (
            <div key={title} className="bg-white border rounded-xl p-4">
              <h3 className="font-medium mb-4">{title}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {activity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActivityList title="New Salon Applications" items={activity.newApplications?.map((a) => ({
            primary: a.salon_name,
            secondary: a.owner?.user?.name,
            date: a.created_at,
          }))} />
          <ActivityList title="New Bookings" items={activity.newBookings?.map((b) => ({
            primary: b.booking_number,
            secondary: `${b.customer?.user?.name} → ${b.salon?.salon_name}`,
            date: b.created_at,
          }))} />
          <ActivityList title="New Reviews" items={activity.newReviews?.map((r) => ({
            primary: `${r.rating}★ — ${r.salon?.salon_name}`,
            secondary: r.customer?.user?.name,
            date: r.created_at,
          }))} />
        </div>
      )}
    </div>
  );
}

function ActivityList({ title, items = [] }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <h3 className="font-medium mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No recent activity</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm border-b pb-2 last:border-0">
              <p className="font-medium">{item.primary}</p>
              <p className="text-gray-500">{item.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
