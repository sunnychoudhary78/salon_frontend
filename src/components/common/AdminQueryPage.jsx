import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "@/api/axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Spinner } from "@/components/ui/spinner";

import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Inbox,
  CircleDot,
  CalendarDays,
  MapPin,
  UserRound,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

/* ============================================================
   CONSTANTS
   ============================================================ */

const PAGE_LIMIT = 20;

const EMPTY_FILTERS = Object.freeze({});

/* ============================================================
   STATUS BADGE
   UI ONLY
   ============================================================ */

function StatusBadge({ value }) {
  if (!value) {
    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }

  const status = String(value).toUpperCase();

  const styles = {
    ACTIVE: {
      wrapper:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },

    APPROVED: {
      wrapper:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },

    SUSPENDED: {
      wrapper:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      icon: Clock3,
    },

    PENDING: {
      wrapper:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      icon: Clock3,
    },

    CLOSED: {
      wrapper:
        "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
      icon: AlertCircle,
    },

    REJECTED: {
      wrapper:
        "border-rose-100 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
      icon: AlertCircle,
    },
  };

  const style =
    styles[status] || {
      wrapper:
        "border-indigo-100 bg-indigo-50 text-indigo-700",
      dot: "bg-indigo-500",
      icon: CircleDot,
    };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-bold
        tracking-wide
        ${style.wrapper}
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${style.dot}
        `}
      />

      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ============================================================
   FEATURED BADGE
   UI ONLY
   ============================================================ */

function FeaturedBadge({ value }) {
  const isFeatured =
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1";

  if (isFeatured) {
    return (
      <span
        className="
          inline-flex
          items-center
          rounded-full
          border
          border-violet-100
          bg-violet-50
          px-2.5
          py-1
          text-[10px]
          font-bold
          text-violet-700
        "
      >
        Featured
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        border
        border-slate-200
        bg-slate-50
        px-2.5
        py-1
        text-[10px]
        font-medium
        text-slate-400
      "
    >
      Standard
    </span>
  );
}

/* ============================================================
   COLUMN ICON
   UI ONLY
   ============================================================ */

function getColumnIcon(key, label) {
  const value =
    `${key || ""} ${label || ""}`.toLowerCase();

  if (value.includes("status")) {
    return CircleDot;
  }

  if (
    value.includes("city") ||
    value.includes("state") ||
    value.includes("location")
  ) {
    return MapPin;
  }

  if (
    value.includes("owner") ||
    value.includes("customer") ||
    value.includes("user")
  ) {
    return UserRound;
  }

  if (
    value.includes("created") ||
    value.includes("date")
  ) {
    return CalendarDays;
  }

  return null;
}

/* ============================================================
   GET CELL VALUE
   ORIGINAL LOGIC PRESERVED
   ============================================================ */

function getCellValue(row, key) {
  if (
    row[key] !== undefined &&
    row[key] !== null
  ) {
    return String(row[key]);
  }

  const parts = key.split(".");

  let val = row;

  for (const p of parts) {
    val = val?.[p];
  }

  return val != null
    ? String(val)
    : "—";
}

/* ============================================================
   DATA CELL
   UI ONLY
   ============================================================ */

function DataCell({
  row,
  column,
}) {
  const value = getCellValue(
    row,
    column.key
  );

  const key =
    String(column.key || "").toLowerCase();

  const label =
    String(column.label || "").toLowerCase();

  const combined =
    `${key} ${label}`;

  /* STATUS */
  if (
    combined.includes("status") &&
    value !== "—"
  ) {
    return (
      <StatusBadge value={value} />
    );
  }

  /* FEATURED */
  if (
    combined.includes("featured") ||
    combined.includes("is_featured")
  ) {
    return (
      <FeaturedBadge value={value} />
    );
  }

  /* SALON NAME */
  if (
    combined.includes("salon_name") ||
    key === "salon"
  ) {
    return (
      <div className="min-w-[175px]">
        <p
          className="
            truncate
            text-[12px]
            font-bold
            text-slate-800
          "
          title={value}
        >
          {value}
        </p>

        <p
          className="
            mt-0.5
            text-[9px]
            font-medium
            text-slate-400
          "
        >
          Salon
        </p>
      </div>
    );
  }

  /* OWNER */
  if (combined.includes("owner")) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-indigo-50
            text-[9px]
            font-bold
            text-indigo-600
          "
        >
          {value !== "—"
            ? value.charAt(0).toUpperCase()
            : "?"}
        </div>

        <span
          className="
            max-w-[140px]
            truncate
            text-[11px]
            font-semibold
            text-slate-700
          "
          title={value}
        >
          {value}
        </span>
      </div>
    );
  }

  /* CITY / STATE */
  if (
    combined.includes("city") ||
    combined.includes("state") ||
    combined.includes("location")
  ) {
    return (
      <div className="flex items-center gap-1.5">
        <MapPin
          size={12}
          className="shrink-0 text-slate-400"
        />

        <span
          className="
            max-w-[130px]
            truncate
            text-[11px]
            font-medium
            text-slate-600
          "
          title={value}
        >
          {value}
        </span>
      </div>
    );
  }

  /* CREATED DATE */
  if (
    combined.includes("created") ||
    combined.includes("date")
  ) {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <CalendarDays
          size={12}
          className="text-slate-400"
        />

        <span
          className="
            text-[10px]
            font-medium
            text-slate-500
          "
        >
          {value}
        </span>
      </div>
    );
  }

  /* DEFAULT */
  return (
    <span
      className="
        block
        max-w-[180px]
        truncate
        text-[11px]
        font-medium
        text-slate-600
      "
      title={value}
    >
      {value}
    </span>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function EmptyState({
  columnsCount,
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={columnsCount}
        className="border-0"
      >
        <div
          className="
            flex
            min-h-[330px]
            flex-col
            items-center
            justify-center
            px-5
            text-center
          "
        >
          <div
            className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-slate-50
              text-slate-400
            "
          >
            <Inbox
              size={28}
              strokeWidth={1.6}
            />
          </div>

          <h3
            className="
              mt-5
              text-[14px]
              font-bold
              text-slate-700
            "
          >
            No records found
          </h3>

          <p
            className="
              mt-1.5
              max-w-[280px]
              text-[11px]
              leading-5
              text-slate-400
            "
          >
            Try adjusting your search
            or filter to find what
            you're looking for.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function AdminQueryPage({
  title,
  endpoint,
  extraFilters = EMPTY_FILTERS,
  renderActions,
  onRowClick,
  statusFilter,
  statusOptions = [],
}) {
  /* ==========================================================
     EXISTING STATE
     ========================================================== */

  const [rows, setRows] = useState([]);

  const [columns, setColumns] =
    useState([]);

  const [meta, setMeta] =
    useState({
      page: 1,
      limit: PAGE_LIMIT,
      total: 0,
      totalPages: 0,
    });

  const [search, setSearch] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     EXISTING REFS
     ========================================================== */

  const hasLoadedRef =
    useRef(false);

  const searchRef =
    useRef(search);

  const filterStatusRef =
    useRef(filterStatus);

  searchRef.current = search;

  filterStatusRef.current =
    filterStatus;

  /* ==========================================================
     EXISTING FETCH LOGIC
     ========================================================== */

  const fetchData = useCallback(
    async (
      page = 1,
      overrides = {}
    ) => {
      const isFirstLoad =
        !hasLoadedRef.current;

      if (isFirstLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const activeSearch =
        overrides.search !== undefined
          ? overrides.search
          : searchRef.current;

      const activeFilterStatus =
        overrides.filterStatus !== undefined
          ? overrides.filterStatus
          : filterStatusRef.current;

      try {
        const body = {
          page,
          limit: PAGE_LIMIT,
          search:
            activeSearch || undefined,
          ...extraFilters,
        };

        if (
          statusFilter &&
          activeFilterStatus
        ) {
          body[statusFilter] =
            activeFilterStatus;
        }

        const res =
          await api.post(
            `${endpoint}/query`,
            body
          );

        setRows(
          res.data.rows || []
        );

        setColumns(
          res.data.columns || []
        );

        setMeta(
          res.data.meta || {
            page,
            limit: PAGE_LIMIT,
            total: 0,
            totalPages: 0,
          }
        );

        hasLoadedRef.current =
          true;
      } catch (e) {
        toast.error(
          e?.response?.data?.message ||
            "Failed to load data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      endpoint,
      extraFilters,
      statusFilter,
    ]
  );

  /* ==========================================================
     EXISTING EFFECT
     ========================================================== */

  useEffect(() => {
    hasLoadedRef.current = false;

    setLoading(true);
    setRows([]);
    setColumns([]);

    fetchData(1);
  }, [
    endpoint,
    fetchData,
  ]);

  /* ==========================================================
     SEARCH
     ========================================================== */

  const handleSearch = () => {
    fetchData(1);
  };

  /* ==========================================================
     STATUS FILTER
     ========================================================== */

  const handleStatusChange = (
    value
  ) => {
    setFilterStatus(value);

    filterStatusRef.current =
      value;

    fetchData(1, {
      filterStatus: value,
    });
  };

  /* ==========================================================
     MAIN UI
     ========================================================== */

  return (
    <div
      className="
        min-h-full
        bg-[#f8fafc]
        px-4
        py-5
        sm:px-6
        lg:px-7
      "
    >
      <div
        className="
          mx-auto
          max-w-[1600px]
        "
      >

        {/* ==================================================
            COMPACT PAGE HEADER
            Dashboard-style white header
            ================================================== */}

        <div
          className="
            mb-4
            flex
            flex-col
            gap-3
            rounded-[12px]
            border
            border-slate-200
            bg-white
            px-5
            py-3.5
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
            sm:px-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className="
                  text-[24px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-slate-950
                  sm:text-[25px]
                "
              >
                {title}
              </h1>

              {meta.total > 0 && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-indigo-100
                    bg-indigo-50
                    px-2.5
                    py-1
                    text-[9px]
                    font-bold
                    tracking-wide
                    text-indigo-600
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-indigo-500
                    "
                  />
                  {meta.total} salons
                </span>
              )}
            </div>

            <p
              className="
                mt-1
                text-[10.5px]
                font-medium
                text-slate-500
              "
            >
              Manage and monitor your salon listings
            </p>
          </div>

          {/* SEARCH / FILTER */}
          <div
            className="
              relative
              flex
              w-full
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              lg:w-auto
            "
          >
            {/* Search input */}
            <div
              className="
                relative
                w-full
                sm:w-[230px]
              "
            >
              <Search
                size={14}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <Input
                placeholder="Search salons..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleSearch()
                }
                className="
                  h-9.5
                  rounded-[10px]
                  border-slate-200
                  bg-slate-50
                  pl-9
                  pr-3
                  text-[11px]
                  font-medium
                  text-slate-700
                  shadow-none
                  placeholder:text-slate-400
                  focus:border-indigo-200
                  focus:bg-white
                  focus:ring-2
                  focus:ring-indigo-100
                "
              />
            </div>

            {/* Status */}
            {statusOptions.length > 0 && (
              <div className="relative">
                <SlidersHorizontal
                  size={13}
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <select
                  className="
                    h-9.5
                    min-w-[135px]
                    appearance-none
                    rounded-[10px]
                    border
                    border-slate-200
                    bg-slate-50
                    pl-9
                    pr-8
                    text-[11px]
                    font-medium
                    text-slate-700
                    shadow-none
                    outline-none
                    transition
                    focus:border-indigo-200
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-100
                  "
                  value={filterStatus}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All statuses
                  </option>

                  {statusOptions.map((s) => (
                    <option
                      key={s}
                      value={s}
                    >
                      {s.replace(
                        /_/g,
                        " "
                      )}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={refreshing}
              className="
                h-9.5
                rounded-[10px]
                border
                border-indigo-500
                bg-indigo-600
                px-4
                text-[11px]
                font-bold
                text-white
                shadow-[0_4px_12px_rgba(79,70,229,0.18)]
                transition-all
                hover:bg-indigo-500
                hover:shadow-[0_6px_16px_rgba(79,70,229,0.24)]
              "
            >
              <Search
                size={13}
                className="mr-1.5"
              />
              Search
            </Button>
          </div>
        </div>

        {/* ==================================================
            TABLE CONTAINER
            ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-[18px]
            border
            border-slate-200/80
            bg-white
            shadow-[0_8px_30px_rgba(15,23,42,0.045)]
          "
        >
          {/* Table toolbar */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              bg-white
              px-5
              py-3.5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2.5
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <Database size={15} />
              </div>

              <div>
                <p
                  className="
                    text-[11px]
                    font-bold
                    text-slate-800
                  "
                >
                  Salon Directory
                </p>

                <p
                  className="
                    text-[9px]
                    text-slate-400
                  "
                >
                  Approved salon records
                </p>
              </div>
            </div>

            {/* Refresh */}

            <button
              type="button"
              onClick={() =>
                fetchData(meta.page)
              }
              disabled={
                refreshing ||
                loading
              }
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                border
                border-slate-200
                bg-white
                text-slate-500
                transition-all
                hover:border-indigo-200
                hover:bg-indigo-50
                hover:text-indigo-600
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              title="Refresh"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>

          {/* ==================================================
              LOADING
              ================================================== */}

          {loading ? (
            <div
              className="
                flex
                min-h-[430px]
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  flex-col
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                  "
                >
                  <Spinner />
                </div>

                <span
                  className="
                    text-[10px]
                    font-medium
                    text-slate-400
                  "
                >
                  Loading salons...
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`
                relative
                overflow-x-auto
                ${
                  refreshing
                    ? "opacity-60"
                    : ""
                }
              `}
            >
              {/* Refresh overlay */}

              {refreshing && (
                <div
                  className="
                    absolute
                    inset-0
                    z-20
                    flex
                    items-center
                    justify-center
                    bg-white/45
                    backdrop-blur-[1px]
                  "
                >
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      shadow-lg
                    "
                  >
                    <Spinner />
                  </div>
                </div>
              )}

              <Table>
                {/* =================================================
                    HEADER
                    ================================================= */}

                <TableHeader>
                  <TableRow
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50/70
                      hover:bg-slate-50/70
                    "
                  >
                    {columns.map(
                      (col) => {
                        const Icon =
                          getColumnIcon(
                            col.key,
                            col.label
                          );

                        return (
                          <TableHead
                            key={col.key}
                            className="
                              h-11
                              whitespace-nowrap
                              px-4
                              text-[9px]
                              font-bold
                              uppercase
                              tracking-[0.06em]
                              text-slate-400
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                              "
                            >
                              {Icon && (
                                <Icon
                                  size={11}
                                  className="
                                    text-slate-300
                                  "
                                />
                              )}

                              {col.label}
                            </div>
                          </TableHead>
                        );
                      }
                    )}

                    {renderActions && (
                      <TableHead
                        className="
                          h-11
                          whitespace-nowrap
                          px-4
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.06em]
                          text-slate-400
                        "
                      >
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                {/* =================================================
                    BODY
                    ================================================= */}

                <TableBody>
                  {rows.length === 0 ? (
                    <EmptyState
                      columnsCount={
                        columns.length +
                        (renderActions
                          ? 1
                          : 0)
                      }
                    />
                  ) : (
                    rows.map(
                      (row) => (
                        <TableRow
                          key={row.id}
                          className={`
                            group
                            border-b
                            border-slate-100
                            transition-colors
                            ${
                              onRowClick
                                ? "cursor-pointer"
                                : ""
                            }
                            hover:bg-indigo-50/25
                          `}
                          onClick={() =>
                            onRowClick?.(
                              row
                            )
                          }
                        >
                          {columns.map(
                            (col) => (
                              <TableCell
                                key={
                                  col.key
                                }
                                className="
                                  whitespace-nowrap
                                  px-4
                                  py-3
                                  align-middle
                                "
                              >
                                <DataCell
                                  row={
                                    row
                                  }
                                  column={
                                    col
                                  }
                                />
                              </TableCell>
                            )
                          )}

                          {renderActions && (
                            <TableCell
                              className="
                                px-4
                                py-3
                                align-middle
                              "
                              onClick={(
                                e
                              ) =>
                                e.stopPropagation()
                              }
                            >
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2
                                "
                              >
                                {renderActions(
                                  row,
                                  () =>
                                    fetchData(
                                      meta.page
                                    )
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ==================================================
            PAGINATION
            ================================================== */}

        {meta.totalPages > 1 && (
          <div
            className="
              mt-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                Showing page
              </span>

              <span
                className="
                  rounded-md
                  bg-slate-100
                  px-2
                  py-1
                  text-[10px]
                  font-bold
                  text-slate-600
                "
              >
                {meta.page}
              </span>

              <span
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                of
              </span>

              <span
                className="
                  text-[10px]
                  font-bold
                  text-slate-700
                "
              >
                {meta.totalPages}
              </span>

              <span
                className="
                  ml-1
                  text-[10px]
                  text-slate-400
                "
              >
                ({meta.total} total)
              </span>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Button
                variant="outline"
                disabled={
                  meta.page <= 1 ||
                  refreshing
                }
                onClick={() =>
                  fetchData(
                    meta.page - 1
                  )
                }
                className="
                  h-9
                  rounded-lg
                  border-slate-200
                  bg-white
                  px-3
                  text-[10px]
                  font-semibold
                  text-slate-600
                  shadow-sm
                  hover:border-indigo-200
                  hover:bg-indigo-50
                  hover:text-indigo-600
                "
              >
                <ChevronLeft
                  size={14}
                  className="mr-1"
                />

                Previous
              </Button>

              <Button
                variant="outline"
                disabled={
                  meta.page >=
                    meta.totalPages ||
                  refreshing
                }
                onClick={() =>
                  fetchData(
                    meta.page + 1
                  )
                }
                className="
                  h-9
                  rounded-lg
                  border-slate-200
                  bg-white
                  px-3
                  text-[10px]
                  font-semibold
                  text-slate-600
                  shadow-sm
                  hover:border-indigo-200
                  hover:bg-indigo-50
                  hover:text-indigo-600
                "
              >
                Next

                <ChevronRight
                  size={14}
                  className="ml-1"
                />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}