import React, {
  useCallback,
  useEffect,
  useMemo,
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

import {
  Landmark,
  RefreshCw,
  Search,
  Clock3,
  IndianRupee,
  CheckCircle2,
  FileText,
} from "lucide-react";


/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }) {
  const normalized = String(
    status || ""
  ).toUpperCase();

  const styles = {
    PENDING: {
      wrapper:
        "border-amber-100 bg-amber-50 text-amber-600",
      dot: "bg-amber-500",
    },

    APPROVED: {
      wrapper:
        "border-sky-100 bg-sky-50 text-sky-600",
      dot: "bg-sky-500",
    },

    SETTLED: {
      wrapper:
        "border-emerald-100 bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
    },

    FAILED: {
      wrapper:
        "border-rose-100 bg-rose-50 text-rose-600",
      dot: "bg-rose-500",
    },
  };

  const theme =
    styles[normalized] || {
      wrapper:
        "border-slate-200 bg-slate-50 text-slate-500",
      dot: "bg-slate-400",
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
        text-[9px]
        font-bold
        tracking-wide
        ${theme.wrapper}
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${theme.dot}
        `}
      />

      {normalized || "UNKNOWN"}
    </span>
  );
}


/* ============================================================
   FORMAT AMOUNT
   ============================================================ */

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}


/* ============================================================
   STAT CARD
   ============================================================ */

function FinanceStatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  suffix,
}) {
  const themes = {
    indigo: {
      border: "border-indigo-100",
      background:
        "bg-gradient-to-br from-white to-indigo-50/60",
      icon:
        "bg-indigo-50 text-indigo-600",
    },

    amber: {
      border: "border-amber-100",
      background:
        "bg-gradient-to-br from-white to-amber-50/60",
      icon:
        "bg-amber-50 text-amber-600",
    },

    green: {
      border: "border-emerald-100",
      background:
        "bg-gradient-to-br from-white to-emerald-50/60",
      icon:
        "bg-emerald-50 text-emerald-600",
    },
  };

  const theme = themes[tone];

  return (
    <div
      className={`
        flex
        min-h-[88px]
        items-center
        gap-3
        rounded-[12px]
        border
        ${theme.border}
        ${theme.background}
        px-4
        py-3
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[10px]
          ${theme.icon}
        `}
      >
        <Icon
          size={18}
          strokeWidth={2}
        />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.08em]
            text-slate-400
          "
        >
          {label}
        </p>

        <div
          className="
            mt-1
            flex
            items-baseline
            gap-1
          "
        >
          {suffix && (
            <span
              className="
                text-[15px]
                font-bold
                text-slate-700
              "
            >
              {suffix}
            </span>
          )}

          <p
            className="
              text-[21px]
              font-bold
              leading-none
              tracking-[-0.035em]
              text-slate-950
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   PAGE
   ============================================================ */

export default function SettlementLedgerPage() {
  const [rows, setRows] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");


  /* ==========================================================
     FETCH DATA
     API UNCHANGED
     ========================================================== */

  const fetchData = useCallback(
    async () => {
      setLoading(true);

      try {
        const res = await api.post(
          "/settlements/ledger/query",
          {
            page: 1,
            limit: 50,
            status: "PENDING",
          }
        );

        setRows(
          res.data.rows || []
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to load settlement ledger"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /* ==========================================================
     SEARCH
     ========================================================== */

  const filteredRows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return [
        row.entry_type,
        row.status,
        row.settings_version,
        row.amount,
        row.id,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);


  /* ==========================================================
     TOTAL
     ========================================================== */

  const totalAmount = useMemo(
    () =>
      filteredRows.reduce(
        (sum, row) =>
          sum +
          Number(row.amount || 0),
        0
      ),
    [filteredRows]
  );


  /* ==========================================================
     MAIN UI
     ========================================================== */

  return (
    <div
      className="
        min-h-full
        bg-[#f7f8fc]
        px-4
        py-4
        sm:px-5
        sm:py-5
        lg:px-6
      "
    >
      <div
        className="
          mx-auto
          max-w-[1600px]
          space-y-4
        "
      >

        {/* ==================================================
            HEADER
            Dashboard-style
            NO DARK BLUE
            ================================================== */}

        <section
          className="
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
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          {/* LEFT */}

          <div>
            <div
              className="
                flex
                flex-wrap
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
                  rounded-[9px]
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <Landmark
                  size={16}
                  strokeWidth={2}
                />
              </div>

              <h1
                className="
                  text-[24px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-slate-950
                "
              >
                Settlement Ledger
              </h1>

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-amber-100
                  bg-amber-50
                  px-2.5
                  py-1
                  text-[9px]
                  font-bold
                  text-amber-600
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-amber-500
                  "
                />

                Pending
              </span>
            </div>

            <p
              className="
                mt-1
                text-[10.5px]
                font-medium
                text-slate-500
              "
            >
              Review pending settlement entries
              before batch processing.
            </p>
          </div>


          {/* RIGHT */}

          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="
              h-9
              rounded-[9px]
              border-slate-200
              bg-white
              px-3.5
              text-[10px]
              font-semibold
              text-slate-600
              shadow-none
              hover:bg-slate-50
            "
          >
            <RefreshCw
              size={13}
              className={`
                mr-1.5
                ${
                  loading
                    ? "animate-spin"
                    : ""
                }
              `}
            />

            Refresh
          </Button>

        </section>


        {/* ==================================================
            STATS
            ================================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >

          <FinanceStatCard
            label="Pending Entries"
            value={filteredRows.length}
            icon={Clock3}
            tone="amber"
          />

          <FinanceStatCard
            label="Ledger Amount"
            value={formatAmount(
              totalAmount
            )}
            suffix="₹"
            icon={IndianRupee}
            tone="indigo"
          />

        </section>


        {/* ==================================================
            SEARCH
            ================================================== */}

        <section
          className="
            rounded-[12px]
            border
            border-slate-200
            bg-white
            p-3
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
          "
        >

          <div
            className="
              relative
              w-full
              sm:max-w-[420px]
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
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search ledger entries..."
              className="
                h-9
                rounded-[9px]
                border-slate-200
                bg-slate-50
                pl-9
                text-[11px]
                shadow-none
                placeholder:text-slate-400
                focus:border-indigo-200
                focus:bg-white
                focus:ring-2
                focus:ring-indigo-100
              "
            />
          </div>

        </section>


        {/* ==================================================
            TABLE
            ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[12px]
            border
            border-slate-200
            bg-white
            shadow-[0_3px_18px_rgba(15,23,42,0.035)]
          "
        >

          {/* TABLE HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
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
                  rounded-[9px]
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <FileText
                  size={15}
                />
              </div>

              <div>
                <h2
                  className="
                    text-[12px]
                    font-bold
                    text-slate-900
                  "
                >
                  Settlement Entries
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-slate-400
                  "
                >
                  Pending ledger records
                  available for settlement.
                </p>
              </div>

            </div>


            <span
              className="
                hidden
                text-[9px]
                font-medium
                text-slate-400
                sm:block
              "
            >
              {filteredRows.length} records
            </span>

          </div>


          {/* ==================================================
              LOADING
              ================================================== */}

          {loading ? (
            <div
              className="
                flex
                min-h-[280px]
                flex-col
                items-center
                justify-center
                gap-3
              "
            >
              <div
                className="
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-slate-200
                  border-t-indigo-500
                "
              />

              <p
                className="
                  text-[11px]
                  font-medium
                  text-slate-400
                "
              >
                Loading settlement ledger...
              </p>
            </div>

          ) : filteredRows.length === 0 ? (

            /* ==================================================
                EMPTY
                ================================================== */

            <div
              className="
                flex
                min-h-[280px]
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
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-[12px]
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <CheckCircle2
                  size={21}
                />
              </div>

              <h3
                className="
                  mt-3
                  text-[12px]
                  font-bold
                  text-slate-700
                "
              >
                No pending entries
              </h3>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                The settlement ledger
                is currently clear.
              </p>

            </div>

          ) : (

            /* ==================================================
                TABLE
                ================================================== */

            <div className="overflow-x-auto">

              <Table>

                <TableHeader>

                  <TableRow
                    className="
                      border-slate-100
                      bg-slate-50/70
                    "
                  >

                    <TableHead
                      className="
                        h-10
                        px-5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Entry Type
                    </TableHead>

                    <TableHead
                      className="
                        h-10
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Amount
                    </TableHead>

                    <TableHead
                      className="
                        h-10
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Status
                    </TableHead>

                    <TableHead
                      className="
                        h-10
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Settings Version
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {filteredRows.map(
                    (row) => (
                      <TableRow
                        key={row.id}
                        className="
                          border-slate-100
                          transition-colors
                          hover:bg-indigo-50/20
                        "
                      >

                        {/* ENTRY */}

                        <TableCell
                          className="
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
                                shrink-0
                                items-center
                                justify-center
                                rounded-[8px]
                                bg-indigo-50
                                text-indigo-600
                              "
                            >
                              <FileText
                                size={14}
                              />
                            </div>

                            <div>

                              <p
                                className="
                                  whitespace-nowrap
                                  text-[10.5px]
                                  font-bold
                                  text-slate-800
                                "
                              >
                                {row.entry_type ||
                                  "Ledger Entry"}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[8.5px]
                                  text-slate-400
                                "
                              >
                                Entry #{row.id}
                              </p>

                            </div>

                          </div>

                        </TableCell>


                        {/* AMOUNT */}

                        <TableCell
                          className="
                            whitespace-nowrap
                            text-[12px]
                            font-bold
                            text-slate-900
                          "
                        >
                          ₹
                          {formatAmount(
                            row.amount
                          )}
                        </TableCell>


                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            status={
                              row.status
                            }
                          />
                        </TableCell>


                        {/* VERSION */}

                        <TableCell>

                          <span
                            className="
                              inline-flex
                              rounded-full
                              border
                              border-slate-200
                              bg-slate-50
                              px-2
                              py-1
                              font-mono
                              text-[9px]
                              font-semibold
                              text-slate-500
                            "
                          >
                            v
                            {row.settings_version ??
                              "—"}
                          </span>

                        </TableCell>

                      </TableRow>
                    )
                  )}

                </TableBody>

              </Table>

            </div>
          )}

        </section>

      </div>
    </div>
  );
}