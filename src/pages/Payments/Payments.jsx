import React, {
  useCallback,
  useEffect,
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
  CreditCard,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  WalletCards,
  CircleCheck,
  Clock3,
  CircleX,
  Ban,
} from "lucide-react";


/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  const styles = {
    PAID: {
      wrapper:
        "border-emerald-100 bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
      icon: CircleCheck,
    },

    PENDING: {
      wrapper:
        "border-amber-100 bg-amber-50 text-amber-600",
      dot: "bg-amber-500",
      icon: Clock3,
    },

    FAILED: {
      wrapper:
        "border-rose-100 bg-rose-50 text-rose-600",
      dot: "bg-rose-500",
      icon: CircleX,
    },

    EXPIRED: {
      wrapper:
        "border-slate-200 bg-slate-100 text-slate-500",
      dot: "bg-slate-400",
      icon: Ban,
    },
  };

  const theme =
    styles[normalized] || {
      wrapper:
        "border-indigo-100 bg-indigo-50 text-indigo-600",
      dot: "bg-indigo-500",
      icon: Clock3,
    };

  const Icon = theme.icon;

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
   PAYMENT STAT CARD
   ============================================================ */

function PaymentStatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
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

        <p
          className="
            mt-1
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
  );
}


/* ============================================================
   PAYMENTS PAGE
   ============================================================ */

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);

  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 0,
  });

  const [status, setStatus] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);


  /* ==========================================================
     FETCH DATA
     API LOGIC PRESERVED
     ========================================================== */

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const res = await api.post(
          "/payments/query",
          {
            page,
            limit: 20,
            status: status || undefined,
          }
        );

        setRows(res.data.rows || []);

        setMeta(
          res.data.meta || {
            page: 1,
            totalPages: 0,
          }
        );
      } catch {
        toast.error(
          "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    },
    [status]
  );


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);


  /* ==========================================================
     SEARCH
     CLIENT SIDE
     Does not change API
     ========================================================== */

  const filteredRows = rows.filter((row) => {
    if (!search.trim()) {
      return true;
    }

    const query =
      search.trim().toLowerCase();

    return [
      row.checkout_kind,
      row.payment_type,
      row.status,
      row.method,
      row.salon?.salon_name,
      String(row.amount),
    ]
      .filter(Boolean)
      .some((value) =>
        String(value)
          .toLowerCase()
          .includes(query)
      );
  });


  /* ==========================================================
     SUMMARY
     ========================================================== */

  const paidCount = rows.filter(
    (row) =>
      String(row.status).toUpperCase() ===
      "PAID"
  ).length;

  const pendingCount = rows.filter(
    (row) =>
      String(row.status).toUpperCase() ===
      "PENDING"
  ).length;

  const totalAmount = rows.reduce(
    (sum, row) =>
      sum + Number(row.amount || 0),
    0
  );


  /* ==========================================================
     MAIN
     ========================================================== */

  return (
    <div
      className="
        min-h-screen
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
            PAGE HEADER
            Dashboard-style
            ================================================== */}

        <div
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
              <h1
                className="
                  text-[24px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-slate-950
                "
              >
                Payments
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
                  text-[9px]
                  font-bold
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

                {rows.length} payments
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
              Review and monitor payment transactions.
            </p>
          </div>


          {/* RIGHT */}

          <Button
            variant="outline"
            onClick={() => fetchData(1)}
            disabled={loading}
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
                ${loading ? "animate-spin" : ""}
              `}
            />

            Refresh
          </Button>
        </div>


        {/* ==================================================
            SUMMARY CARDS
            ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >

          <PaymentStatCard
            label="Total Amount"
            value={`₹${totalAmount.toFixed(2)}`}
            icon={WalletCards}
            tone="indigo"
          />

          <PaymentStatCard
            label="Pending Payments"
            value={pendingCount}
            icon={Clock3}
            tone="amber"
          />

          <PaymentStatCard
            label="Paid Payments"
            value={paidCount}
            icon={CircleCheck}
            tone="green"
          />

        </div>


        {/* ==================================================
            FILTER BAR
            ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2.5
            rounded-[12px]
            border
            border-slate-200
            bg-white
            p-3
            shadow-[0_3px_14px_rgba(15,23,42,0.035)]
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          {/* Search */}

          <div
            className="
              relative
              w-full
              sm:max-w-[360px]
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
              placeholder="Search payments..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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


          {/* Status */}

          <select
            className="
              h-9
              w-full
              rounded-[9px]
              border
              border-slate-200
              bg-slate-50
              px-3
              text-[11px]
              font-medium
              text-slate-600
              outline-none
              transition
              focus:border-indigo-200
              focus:bg-white
              focus:ring-2
              focus:ring-indigo-100
              sm:w-[150px]
            "
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option value="">
              All statuses
            </option>

            <option value="PENDING">
              PENDING
            </option>

            <option value="PAID">
              PAID
            </option>

            <option value="FAILED">
              FAILED
            </option>

            <option value="EXPIRED">
              EXPIRED
            </option>
          </select>

        </div>


        {/* ==================================================
            TABLE
            ================================================== */}

        <div
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
                <CreditCard
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
                  Payment Transactions
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-slate-400
                  "
                >
                  Recent payment records
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


          {/* LOADING */}

          {loading ? (
            <div
              className="
                flex
                min-h-[260px]
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
                Loading payments...
              </p>
            </div>
          ) : filteredRows.length === 0 ? (

            /* EMPTY */

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
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-[12px]
                  bg-slate-50
                  text-slate-400
                "
              >
                <CreditCard
                  size={20}
                />
              </div>

              <p
                className="
                  mt-3
                  text-[12px]
                  font-bold
                  text-slate-700
                "
              >
                No payments found
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                Try changing the status or search filter.
              </p>
            </div>

          ) : (

            /* TABLE */

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
                        whitespace-nowrap
                        px-5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Checkout
                    </TableHead>

                    <TableHead
                      className="
                        h-10
                        whitespace-nowrap
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
                        whitespace-nowrap
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
                        whitespace-nowrap
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Method
                    </TableHead>

                    <TableHead
                      className="
                        h-10
                        whitespace-nowrap
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
                        whitespace-nowrap
                        pr-5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.07em]
                        text-slate-400
                      "
                    >
                      Version
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
                          hover:bg-slate-50/70
                        "
                      >

                        {/* Checkout */}

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
                              <CreditCard
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
                                {row.checkout_kind ||
                                  row.payment_type ||
                                  "-"}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[8.5px]
                                  text-slate-400
                                "
                              >
                                Payment
                              </p>
                            </div>
                          </div>
                        </TableCell>


                        {/* Amount */}

                        <TableCell
                          className="
                            whitespace-nowrap
                            text-[12px]
                            font-bold
                            text-slate-900
                          "
                        >
                          ₹
                          {Number(
                            row.amount || 0
                          ).toFixed(2)}
                        </TableCell>


                        {/* Status */}

                        <TableCell>
                          <StatusBadge
                            status={
                              row.status
                            }
                          />
                        </TableCell>


                        {/* Method */}

                        <TableCell
                          className="
                            whitespace-nowrap
                            text-[10.5px]
                            font-medium
                            text-slate-600
                          "
                        >
                          {row.method ||
                            "-"}
                        </TableCell>


                        {/* Salon */}

                        <TableCell>
                          <div>
                            <p
                              className="
                                whitespace-nowrap
                                text-[10.5px]
                                font-bold
                                text-slate-800
                              "
                            >
                              {row.salon
                                ?.salon_name ||
                                "-"}
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
                        </TableCell>


                        {/* Version */}

                        <TableCell
                          className="
                            pr-5
                          "
                        >
                          <span
                            className="
                              inline-flex
                              rounded-full
                              border
                              border-slate-200
                              bg-slate-50
                              px-2
                              py-1
                              text-[9px]
                              font-semibold
                              text-slate-500
                            "
                          >
                            v
                            {row.settings_version ??
                              "-"}
                          </span>
                        </TableCell>

                      </TableRow>
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

        <div
          className="
            flex
            items-center
            justify-between
            rounded-[12px]
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            shadow-[0_3px_12px_rgba(15,23,42,0.025)]
          "
        >

          <p
            className="
              text-[9px]
              font-medium
              text-slate-400
            "
          >
            Page{" "}
            <span className="font-bold text-slate-600">
              {meta.page || 1}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-600">
              {meta.totalPages || 1}
            </span>
          </p>


          <div
            className="
              flex
              items-center
              gap-1.5
            "
          >

            <Button
              variant="outline"
              size="sm"
              disabled={
                meta.page <= 1 ||
                loading
              }
              onClick={() =>
                fetchData(
                  meta.page - 1
                )
              }
              className="
                h-8
                rounded-[8px]
                border-slate-200
                px-2.5
                text-[9px]
                font-semibold
                text-slate-600
                shadow-none
                hover:bg-slate-50
              "
            >
              <ChevronLeft
                size={13}
                className="mr-1"
              />

              Previous
            </Button>


            <Button
              variant="outline"
              size="sm"
              disabled={
                meta.page >=
                  meta.totalPages ||
                loading
              }
              onClick={() =>
                fetchData(
                  meta.page + 1
                )
              }
              className="
                h-8
                rounded-[8px]
                border-slate-200
                px-2.5
                text-[9px]
                font-semibold
                text-slate-600
                shadow-none
                hover:bg-slate-50
              "
            >
              Next

              <ChevronRight
                size={13}
                className="ml-1"
              />
            </Button>

          </div>

        </div>

      </div>
    </div>
  );
}