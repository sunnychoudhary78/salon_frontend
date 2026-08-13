import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectMyPermissions } from "@/store/permissions/permissionsSlice";
import api from "@/api/axios";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Building2,
  ClipboardList,
  Users,
  CalendarDays,
  Clock3,
  CheckCircle2,
  BadgeCheck,
  BarChart3,
  Inbox,
  ArrowUpRight,
  Bell,
} from "lucide-react";

/* ============================================================
   PREMIUM COMPACT DASHBOARD
   - No dark blue hero panel
   - Smaller cards / less empty space
   - Designed to show more content in one viewport
   - API, permissions and routes preserved
   ============================================================ */

const STAT_THEMES = {
  indigo: {
    icon: "bg-[#EEF0FF] text-[#6256F5]",
    border: "border-[#E1E4FF]",
    glow: "bg-[#6256F5]",
    dot: "bg-[#6256F5]",
    line: "#6256F5",
    soft: "from-[#FDFDFF] to-[#F5F5FF]",
  },
  amber: {
    icon: "bg-[#FFF5D9] text-[#F59E0B]",
    border: "border-[#F7E8B5]",
    glow: "bg-[#F59E0B]",
    dot: "bg-[#F59E0B]",
    line: "#F59E0B",
    soft: "from-[#FFFDFC] to-[#FFF9EA]",
  },
  green: {
    icon: "bg-[#DFF8ED] text-[#08B77A]",
    border: "border-[#C9F0DF]",
    glow: "bg-[#08B77A]",
    dot: "bg-[#08B77A]",
    line: "#08B77A",
    soft: "from-[#FDFFFE] to-[#F0FBF6]",
  },
  rose: {
    icon: "bg-[#FFE7EC] text-[#F43F5E]",
    border: "border-[#F9D7DF]",
    glow: "bg-[#F43F5E]",
    dot: "bg-[#F43F5E]",
    line: "#F43F5E",
    soft: "from-[#FFFEFE] to-[#FFF5F7]",
  },
};

function StatCard({ label, value, to, color = "indigo", icon: Icon }) {
  const theme = STAT_THEMES[color];

  const content = (
    <div
      className={[
        "group relative h-[88px] overflow-hidden rounded-[12px] border",
        "bg-gradient-to-br",
        theme.soft,
        theme.border,
        "px-3.5 py-3",
        "transition-all duration-200",
        "hover:-translate-y-[1px]",
        "hover:shadow-[0_10px_26px_rgba(35,28,80,0.07)]",
      ].join(" ")}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full ${theme.glow} opacity-[0.035] blur-2xl`}
      />

      <div className="relative flex h-full items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
            theme.icon,
            "border border-white/70",
          ].join(" ")}
        >
          <Icon size={18} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold leading-4 text-slate-600">
            {label}
          </p>

          <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.045em] text-slate-950">
            {value ?? "—"}
          </p>
        </div>


      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function ChartCard({ title, data, color, icon: Icon, footerText }) {
  const gradientId = useMemo(
    () =>
      `dashboard-${title
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toLowerCase()}`,
    [title]
  );

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E7E8F0] bg-white shadow-[0_5px_22px_rgba(25,20,70,0.035)]">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F6FA] text-slate-700">
            <Icon size={15} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold text-slate-900">
              {title}
            </h3>
            <p className="text-[9px] font-medium text-slate-400">
              Monthly performance
            </p>
          </div>
        </div>

        <button
          type="button"
          className="hidden h-8 shrink-0 items-center rounded-lg border border-[#E4E6EE] bg-white px-2.5 text-[9px] font-semibold text-slate-600 sm:flex"
        >
          This Month
        </button>
      </div>

      <div className="mt-1 px-1">
        <ResponsiveContainer width="100%" height={158}>
          <AreaChart
            data={data || []}
            margin={{ top: 10, right: 12, left: -14, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0.015} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#E8EAF1"
              strokeDasharray="2 4"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "#94A3B8" }}
              dy={6}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "#94A3B8" }}
              width={25}
            />

            <Tooltip
              cursor={{
                stroke: "#CBD5E1",
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                background: "#fff",
                boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                fontSize: "10px",
              }}
            />

            <Area
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              dot={{
                r: 3,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 border-t border-[#F0F1F5] px-4 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ArrowUpRight size={12} />
        </span>
        <span className="text-[9px] font-bold text-emerald-600">Growth</span>
        <span className="truncate text-[9px] text-slate-400">
          {footerText}
        </span>
      </div>
    </div>
  );
}

function ActivityCard({ title, items = [], icon: Icon }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E7E8F0] bg-white shadow-[0_5px_22px_rgba(25,20,70,0.035)]">
      <div className="flex items-center gap-2 border-b border-[#F0F1F5] px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={14} />
        </div>
        <h3 className="text-[12px] font-bold text-slate-900">{title}</h3>
      </div>

      <div className="px-4 py-2">
        {items.length === 0 ? (
          <div className="flex min-h-[90px] items-center justify-center gap-2 text-center">
            <Inbox size={18} className="text-slate-300" />
            <span className="text-[10px] text-slate-400">
              No recent activity
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.slice(0, 4).map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-2.5 py-2.5"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-slate-800">
                    {item.primary}
                  </p>
                  <p className="truncate text-[9px] text-slate-400">
                    {item.secondary || "—"}
                  </p>
                </div>

                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const permissions = useSelector(selectMyPermissions) || [];
  const hasStats = permissions.includes("stats.read");

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (!hasStats) return;

    Promise.all([
      api.get("/stats/salon-overview"),
      api.get("/stats/charts"),
      api.get("/stats/recent-activity"),
    ])
      .then(([s, c, a]) => {
        setStats(s.data);
        setCharts(c.data);
        setActivity(a.data);
      })
      .catch(console.error);
  }, [hasStats]);

  if (!hasStats) {
    return (
      <div className="min-h-screen bg-[#F5F4F9] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E4EC] bg-white p-7 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 size={20} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Salon Marketplace Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome to the platform admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F9] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1600px] space-y-3">

        {/* ========================================================
            COMPACT HEADER
            Dark blue hero removed.
            ======================================================== */}
        <header className="flex min-h-[64px] items-center justify-between rounded-[12px] border border-[#E5E4EC] bg-white px-4 shadow-[0_3px_14px_rgba(35,30,75,0.035)] sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[23px] font-bold tracking-[-0.045em] text-slate-950 sm:text-[25px]">
                Dashboard
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                LIVE
              </span>

              <span className="hidden items-center gap-1.5 text-[9px] font-medium text-slate-400 sm:inline-flex">
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                Platform Overview
              </span>
            </div>

            <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px]">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E5EC] bg-[#F8F8FB] text-slate-500"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>

            <div className="flex h-9 items-center gap-2 rounded-xl border border-[#E4E5EC] bg-[#F8F8FB] px-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                A
              </span>
              <div>
                <p className="text-[9px] font-bold leading-3 text-slate-800">
                  Admin
                </p>
                <p className="text-[7px] text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================
            STATS
            4 columns on desktop, compact height.
            ======================================================== */}
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            label="Total Salons"
            value={stats?.totalSalons}
            to="/salons"
            color="indigo"
            icon={Building2}
          />

          <StatCard
            label="Pending Applications"
            value={stats?.pendingApplications}
            to="/salon-applications"
            color="amber"
            icon={ClipboardList}
          />

          <StatCard
            label="Total Customers"
            value={stats?.totalCustomers}
            to="/customers"
            color="green"
            icon={Users}
          />

          <StatCard
            label="Total Bookings"
            value={stats?.totalBookings}
            to="/bookings"
            color="indigo"
            icon={CalendarDays}
          />

          <StatCard
            label="Pending Bookings"
            value={stats?.pendingBookings}
            to="/bookings"
            color="amber"
            icon={Clock3}
          />

          <StatCard
            label="Completed Bookings"
            value={stats?.completedBookings}
            to="/bookings"
            color="green"
            icon={CheckCircle2}
          />

          <StatCard
            label="Approved Salons"
            value={stats?.approvedSalons}
            to="/salons"
            color="rose"
            icon={BadgeCheck}
          />
        </section>

        {/* ========================================================
            CHARTS
            Smaller cards so dashboard remains compact.
            ======================================================== */}
        {charts && (
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <ChartCard
              title="Salon Growth"
              data={charts.salonGrowth}
              color="#6256F5"
              icon={BarChart3}
              footerText="New salons this month"
            />

            <ChartCard
              title="Customer Growth"
              data={charts.customerGrowth}
              color="#08B77A"
              icon={Users}
              footerText="New customers this month"
            />

            <ChartCard
              title="Booking Trends"
              data={charts.bookingTrends}
              color="#F59E0B"
              icon={CalendarDays}
              footerText="New bookings this month"
            />
          </section>
        )}

        {/* ========================================================
            ACTIVITY
            Kept below the main viewport instead of consuming
            the first screen.
            ======================================================== */}
        {activity && (
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <ActivityCard
              title="New Salon Applications"
              icon={Building2}
              items={activity.newApplications?.map((a) => ({
                primary: a.salon_name,
                secondary: a.owner?.user?.name,
              }))}
            />

            <ActivityCard
              title="New Bookings"
              icon={CalendarDays}
              items={activity.newBookings?.map((b) => ({
                primary: b.booking_number,
                secondary: `${b.customer?.user?.name || "Customer"} → ${
                  b.salon?.salon_name || "Salon"
                }`,
              }))}
            />

            <ActivityCard
              title="New Reviews"
              icon={BadgeCheck}
              items={activity.newReviews?.map((r) => ({
                primary: `${r.rating}★ — ${r.salon?.salon_name || "Salon"}`,
                secondary: r.customer?.user?.name,
              }))}
            />
          </section>
        )}
      </div>
    </div>
  );
}

