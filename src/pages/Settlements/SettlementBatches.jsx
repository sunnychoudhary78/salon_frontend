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
  RefreshCw,
  Plus,
  WalletCards,
  Layers3,
  Clock3,
  CheckCircle2,
  IndianRupee,
  Search,
  ArrowRight,
  Building2,
} from "lucide-react";

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }) {
  const styles = {
    DRAFT:
      "border-slate-200 bg-slate-50 text-slate-600",

    APPROVED:
      "border-blue-100 bg-blue-50 text-blue-700",

    SETTLED:
      "border-emerald-100 bg-emerald-50 text-emerald-700",

    FAILED:
      "border-rose-100 bg-rose-50 text-rose-700",
  };

  const dots = {
    DRAFT: "bg-slate-400",
    APPROVED: "bg-blue-500",
    SETTLED: "bg-emerald-500",
    FAILED: "bg-rose-500",
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
        uppercase
        tracking-wide
        ${
          styles[status] ||
          "border-slate-200 bg-slate-50 text-slate-600"
        }
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${dots[status] || "bg-slate-400"}
        `}
      />

      {status || "Unknown"}
    </span>
  );
}

/* ============================================================
   AMOUNT FORMATTER
   ============================================================ */

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  suffix,
}) {
  const tones = {
    indigo: {
      card:
        "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/45",
      icon: "bg-indigo-50 text-indigo-600",
    },

    slate: {
      card:
        "border-slate-200 bg-gradient-to-br from-white to-slate-50",
      icon: "bg-slate-100 text-slate-600",
    },

    blue: {
      card:
        "border-blue-100 bg-gradient-to-br from-white to-blue-50/40",
      icon: "bg-blue-50 text-blue-600",
    },

    green: {
      card:
        "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/45",
      icon: "bg-emerald-50 text-emerald-600",
    },
  };

  const theme = tones[tone];

  return (
    <div
      className={`
        group
        flex
        min-h-[88px]
        items-center
        gap-3
        rounded-[12px]
        border
        px-4
        py-3
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
        transition-all
        duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)]
        ${theme.card}
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

      <div className="min-w-0 flex-1">
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

        <div className="mt-1 flex items-baseline gap-1.5">
          <p
            className="
              text-[22px]
              font-bold
              leading-none
              tracking-[-0.04em]
              text-slate-950
            "
          >
            {value}
          </p>

          {suffix && (
            <span className="text-[9px] font-medium text-slate-400">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SECTION HEADER
   ============================================================ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div
      className="
        flex
        flex-col
        gap-3
        border-b
        border-slate-100
        px-4
        py-3.5
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-[9px]
            bg-indigo-50
            text-indigo-600
          "
        >
          <Icon
            size={17}
            strokeWidth={2}
          />
        </div>

        <div className="min-w-0">
          <h2
            className="
              text-[13px]
              font-bold
              text-slate-900
            "
          >
            {title}
          </h2>

          {description && (
            <p
              className="
                mt-0.5
                text-[9.5px]
                font-medium
                text-slate-400
              "
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function SettlementBatchesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [salonId, setSalonId] = useState("");
  const [ledgerIds, setLedgerIds] = useState("");
  const [utr, setUtr] = useState("");

  /* ==========================================================
     FETCH BATCHES
     ========================================================== */

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.post(
        "/settlements/batches/query",
        {
          page: 1,
          limit: 50,
        }
      );

      setRows(res.data.rows || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to load batches"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ==========================================================
     CREATE BATCH
     ========================================================== */

  const createBatch = async () => {
    if (!salonId.trim()) {
      toast.error("Salon ID is required");
      return;
    }

    if (!ledgerIds.trim()) {
      toast.error("Ledger entry IDs are required");
      return;
    }

    try {
      await api.post(
        "/settlements/batches",
        {
          salon_id: salonId.trim(),

          ledger_entry_ids: ledgerIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }
      );

      toast.success("Batch created");

      setSalonId("");
      setLedgerIds("");

      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to create batch"
      );
    }
  };

  /* ==========================================================
     APPROVE
     ========================================================== */

  const approve = async (id) => {
    try {
      await api.patch(
        `/settlements/batches/${id}/approve`
      );

      toast.success("Batch approved");

      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to approve"
      );
    }
  };

  /* ==========================================================
     SETTLE
     ========================================================== */

  const settle = async (id) => {
    if (!utr.trim()) {
      toast.error(
        "UTR / settlement reference is required"
      );

      return;
    }

    try {
      await api.patch(
        `/settlements/batches/${id}/settle`,
        {
          settlement_reference: utr.trim(),
        }
      );

      toast.success("Batch settled");

      setUtr("");

      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to settle"
      );
    }
  };

  /* ==========================================================
     TOTALS
     ========================================================== */

  const totals = useMemo(() => {
    return rows.reduce(
      (result, row) => {
        result.total += Number(
          row.total_salon_net || 0
        );

        if (row.status === "DRAFT") {
          result.draft += 1;
        }

        if (row.status === "APPROVED") {
          result.approved += 1;
        }

        if (row.status === "SETTLED") {
          result.settled += 1;
        }

        return result;
      },
      {
        total: 0,
        draft: 0,
        approved: 0,
        settled: 0,
      }
    );
  }, [rows]);

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
        lg:py-5
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
            Dashboard-style compact header
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
            sm:px-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-[9px]
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <WalletCards
                  size={16}
                  strokeWidth={2}
                />
              </div>

              <h1
                className="
                  text-[23px]
                  font-bold
                  leading-tight
                  tracking-[-0.04em]
                  text-slate-950
                  sm:text-[25px]
                "
              >
                Settlement Batches
              </h1>

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
                  text-[8.5px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-indigo-600
                "
              >
                Finance
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
              Create, approve and settle salon payout
              batches.
            </p>
          </div>

          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="
              h-9
              shrink-0
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
              className={`mr-1.5 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </Button>
        </section>

        {/* ==================================================
            SUMMARY
            ================================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <SummaryCard
            label="Total Batches"
            value={rows.length}
            icon={Layers3}
            tone="indigo"
          />

          <SummaryCard
            label="Draft"
            value={totals.draft}
            icon={Clock3}
            tone="slate"
          />

          <SummaryCard
            label="Approved"
            value={totals.approved}
            icon={CheckCircle2}
            tone="blue"
          />

          <SummaryCard
            label="Total Net"
            value={`₹${formatAmount(
              totals.total
            )}`}
            icon={IndianRupee}
            tone="green"
          />
        </section>

        {/* ==================================================
            CREATE BATCH
            ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[12px]
            border
            border-slate-200
            bg-white
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
          "
        >
          <SectionHeader
            icon={Plus}
            title="Create Settlement Batch"
            description="Group settlement ledger entries into a draft batch."
          />

          <div
            className="
              grid
              gap-3.5
              p-4
              lg:grid-cols-[0.75fr_1.5fr_auto]
              lg:items-end
            "
          >
            {/* Salon ID */}

            <div>
              <label
                className="
                  mb-1.5
                  block
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.07em]
                  text-slate-500
                "
              >
                Salon ID
              </label>

              <Input
                placeholder="Enter salon ID"
                value={salonId}
                onChange={(e) =>
                  setSalonId(e.target.value)
                }
                className="
                  h-9
                  rounded-[9px]
                  border-slate-200
                  bg-white
                  text-[11px]
                  shadow-none
                  focus-visible:ring-indigo-100
                "
              />
            </div>

            {/* Ledger IDs */}

            <div>
              <label
                className="
                  mb-1.5
                  block
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.07em]
                  text-slate-500
                "
              >
                Ledger Entry IDs
              </label>

              <Input
                placeholder="Example: 101, 102, 103"
                value={ledgerIds}
                onChange={(e) =>
                  setLedgerIds(e.target.value)
                }
                className="
                  h-9
                  rounded-[9px]
                  border-slate-200
                  bg-white
                  text-[11px]
                  shadow-none
                  focus-visible:ring-indigo-100
                "
              />
            </div>

            {/* Create */}

            <Button
              onClick={createBatch}
              className="
                h-9
                rounded-[9px]
                bg-indigo-600
                px-5
                text-[10px]
                font-bold
                text-white
                shadow-none
                hover:bg-indigo-700
              "
            >
              <Plus
                size={13}
                className="mr-1.5"
              />

              Create Draft
            </Button>
          </div>
        </section>

        {/* ==================================================
            SETTLEMENT REFERENCE
            ================================================== */}

        <section
          className="
            rounded-[12px]
            border
            border-slate-200
            bg-white
            p-4
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-emerald-50
                    text-emerald-600
                  "
                >
                  <Search
                    size={15}
                    strokeWidth={2}
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
                    Settlement Reference
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-[9.5px]
                      text-slate-400
                    "
                  >
                    Enter the UTR/reference before settling
                    an approved batch.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full lg:max-w-[380px]">
              <Input
                placeholder="UTR / settlement reference"
                value={utr}
                onChange={(e) =>
                  setUtr(e.target.value)
                }
                className="
                  h-9
                  rounded-[9px]
                  border-slate-200
                  bg-white
                  text-[11px]
                  shadow-none
                  focus-visible:ring-emerald-100
                "
              />
            </div>
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
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
          "
        >
          {/* Table Header */}

          <div
            className="
              flex
              flex-col
              gap-2
              border-b
              border-slate-100
              px-4
              py-3.5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-2.5">
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
                <Layers3
                  size={15}
                  strokeWidth={2}
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
                  Settlement Batches
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    font-medium
                    text-slate-400
                  "
                >
                  Manage batch approval and settlement
                  workflow.
                </p>
              </div>
            </div>

            <span
              className="
                inline-flex
                w-fit
                rounded-full
                bg-slate-50
                px-2.5
                py-1
                text-[9px]
                font-semibold
                text-slate-500
              "
            >
              {rows.length} records
            </span>
          </div>

          {/* Loading */}

          {loading ? (
            <div
              className="
                flex
                min-h-[260px]
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
                    text-[10px]
                    font-medium
                    text-slate-400
                  "
                >
                  Loading settlement batches...
                </p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            /* ==================================================
               EMPTY STATE
               ================================================== */

            <div
              className="
                flex
                min-h-[260px]
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
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-[14px]
                  bg-indigo-50
                  text-indigo-500
                "
              >
                <Layers3
                  size={24}
                  strokeWidth={1.7}
                />
              </div>

              <h3
                className="
                  mt-3
                  text-[12px]
                  font-bold
                  text-slate-800
                "
              >
                No settlement batches
              </h3>

              <p
                className="
                  mt-1
                  max-w-[300px]
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                Create a draft batch to start the
                settlement process.
              </p>
            </div>
          ) : (
            /* ==================================================
               TABLE CONTENT
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
                        px-4
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Batch
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
                      Salon
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
                      Total Net
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
                        pr-4
                        text-right
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => {
                    const salonName =
                      row.salon?.salon_name ||
                      row.salon_id ||
                      "—";

                    const salonInitial =
                      String(salonName)
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <TableRow
                        key={row.id}
                        className="
                          border-slate-100
                          transition-colors
                          hover:bg-indigo-50/20
                        "
                      >
                        {/* Batch */}

                        <TableCell
                          className="
                            px-4
                            py-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[11px]
                                font-bold
                                text-slate-800
                              "
                            >
                              {row.batch_number ||
                                `Batch #${row.id}`}
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[9px]
                                font-medium
                                text-slate-400
                              "
                            >
                              ID #{row.id}
                            </p>
                          </div>
                        </TableCell>

                        {/* Salon */}

                        <TableCell>
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
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-[8px]
                                bg-indigo-50
                                text-[9px]
                                font-bold
                                text-indigo-600
                              "
                            >
                              {salonInitial}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  max-w-[180px]
                                  truncate
                                  text-[10.5px]
                                  font-semibold
                                  text-slate-700
                                "
                              >
                                {salonName}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[8.5px]
                                  text-slate-400
                                "
                              >
                                Salon
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Amount */}

                        <TableCell>
                          <span
                            className="
                              text-[11px]
                              font-bold
                              text-slate-900
                            "
                          >
                            ₹
                            {formatAmount(
                              row.total_salon_net
                            )}
                          </span>
                        </TableCell>

                        {/* Status */}

                        <TableCell>
                          <StatusBadge
                            status={row.status}
                          />
                        </TableCell>

                        {/* Actions */}

                        <TableCell>
                          <div
                            className="
                              flex
                              justify-end
                              gap-2
                              pr-0
                            "
                          >
                            {row.status === "DRAFT" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  approve(row.id)
                                }
                                className="
                                  h-8
                                  rounded-[8px]
                                  bg-indigo-600
                                  px-3
                                  text-[9px]
                                  font-bold
                                  shadow-none
                                  hover:bg-indigo-700
                                "
                              >
                                Approve

                                <ArrowRight
                                  size={12}
                                  className="ml-1"
                                />
                              </Button>
                            )}

                            {row.status === "APPROVED" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  settle(row.id)
                                }
                                disabled={!utr.trim()}
                                className="
                                  h-8
                                  rounded-[8px]
                                  bg-emerald-600
                                  px-3
                                  text-[9px]
                                  font-bold
                                  shadow-none
                                  hover:bg-emerald-700
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                Settle

                                <CheckCircle2
                                  size={12}
                                  className="ml-1"
                                />
                              </Button>
                            )}

                            {row.status === "SETTLED" && (
                              <span
                                className="
                                  inline-flex
                                  h-8
                                  items-center
                                  gap-1.5
                                  rounded-[8px]
                                  bg-emerald-50
                                  px-3
                                  text-[9px]
                                  font-bold
                                  text-emerald-700
                                "
                              >
                                <CheckCircle2
                                  size={12}
                                />

                                Completed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* ==================================================
            BOTTOM INFORMATION
            ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            px-1
            pb-2
            text-[9px]
            text-slate-400
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-center gap-1.5">
            <Building2 size={11} />

            <span>
              Settlement management
            </span>
          </div>

          <span>
            {totals.settled} settled batches
          </span>
        </div>
      </div>
    </div>
  );
}

