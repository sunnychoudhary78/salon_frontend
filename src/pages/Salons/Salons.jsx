import React, {
  useState,
} from "react";

import AdminQueryPage from "@/components/common/AdminQueryPage";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import api from "@/api/axios";
import toast from "react-hot-toast";

import {
  Star,
  StarOff,
  Loader2,
} from "lucide-react";

/* ============================================================
   SALON STATUSES
   EXISTING VALUES — DO NOT CHANGE
   ============================================================ */

const SALON_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
];

/* ============================================================
   STATUS SELECT
   LOGIC SAME
   UI IMPROVED
   ============================================================ */

function SalonStatusSelect({
  row,
  onUpdated,
}) {
  const [pending, setPending] =
    useState(false);

  const handleChange = async (
    newStatus
  ) => {
    if (
      newStatus === row.status ||
      pending
    ) {
      return;
    }

    if (newStatus !== "ACTIVE") {
      const label =
        newStatus.toLowerCase();

      const confirmed =
        window.confirm(
          `Set "${row.salon_name}" to ${label}?`
        );

      if (!confirmed) {
        return;
      }
    }

    setPending(true);

    try {
      await api.patch(
        `/salons/${row.id}/status`,
        {
          status: newStatus,
        }
      );

      toast.success(
        `Salon status updated to ${newStatus}`
      );

      onUpdated();
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          "Failed to update status"
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="
        min-w-[130px]
      "
    >
      <Select
        value={row.status}
        onValueChange={
          handleChange
        }
        disabled={pending}
      >
        <SelectTrigger
          className="
            h-9
            rounded-lg
            border-slate-200
            bg-white
            px-3
            text-[10px]
            font-bold
            text-slate-600
            shadow-sm
            transition-all
            hover:border-indigo-200
            focus:ring-2
            focus:ring-indigo-100
          "
        >
          {pending ? (
            <div
              className="
                flex
                items-center
                gap-2
                text-slate-400
              "
            >
              <Loader2
                size={12}
                className="animate-spin"
              />

              Updating...
            </div>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>

        <SelectContent
          className="
            rounded-xl
            border-slate-200
            shadow-xl
          "
        >
          {SALON_STATUSES.map(
            (status) => (
              <SelectItem
                key={status}
                value={status}
                className="
                  rounded-lg
                  text-[11px]
                  font-medium
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
                    className={`
                      h-1.5
                      w-1.5
                      rounded-full
                      ${
                        status ===
                        "ACTIVE"
                          ? "bg-emerald-500"
                          : status ===
                            "SUSPENDED"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }
                    `}
                  />

                  {status}
                </div>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ============================================================
   SALONS PAGE
   ============================================================ */

export default function SalonsPage() {
  return (
    <AdminQueryPage
      title="Approved Salons"
      endpoint="/salons"
      statusFilter="status"
      statusOptions={
        SALON_STATUSES
      }

      renderActions={(
        row,
        refresh
      ) => (
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {/* Status */}
          <SalonStatusSelect
            row={row}
            onUpdated={
              refresh
            }
          />

          {/* Feature */}
          {row.status ===
            "ACTIVE" && (
            <Button
              size="sm"
              variant={
                row.is_featured
                  ? "secondary"
                  : "outline"
              }
              onClick={async () => {
                try {
                  await api.patch(
                    `/salons/${row.id}/feature`,
                    {
                      is_featured:
                        !row.is_featured,
                    }
                  );

                  toast.success(
                    row.is_featured
                      ? "Salon removed from featured"
                      : "Salon marked featured"
                  );

                  refresh();
                } catch (e) {
                  toast.error(
                    e?.response
                      ?.data
                      ?.message ||
                      "Failed"
                  );
                }
              }}
              className={`
                h-9
                rounded-lg
                px-3
                text-[10px]
                font-bold
                transition-all

                ${
                  row.is_featured
                    ? `
                      border
                      border-violet-200
                      bg-violet-50
                      text-violet-700
                      hover:bg-violet-100
                    `
                    : `
                      border-slate-200
                      bg-white
                      text-slate-600
                      hover:border-violet-200
                      hover:bg-violet-50
                      hover:text-violet-600
                    `
                }
              `}
            >
              {row.is_featured ? (
                <>
                  <StarOff
                    size={13}
                    className="mr-1.5"
                  />

                  Unfeature
                </>
              ) : (
                <>
                  <Star
                    size={13}
                    className="mr-1.5"
                  />

                  Feature
                </>
              )}
            </Button>
          )}
        </div>
      )}
    />
  );
}

