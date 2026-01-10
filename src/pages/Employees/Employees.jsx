// src/components/EmployeesTable.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import api from "@/api/axios";
import TableConfigPanel from "@/components/config/TableConfigPanel";
import { useNavigate, useLocation } from 'react-router-dom';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Maximize2, Minimize2, MoreHorizontal as BiDotsHorizontalRounded, Edit2 as FiEdit2, Trash2 as FiTrash2 } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import RequirePermission from "@/components/common/RequirePermission";

export default function EmployeesTable({ initialPage = 1, initialLimit = 20 }) {


  useEffect(() => {
    document.title = "Employees | Immortal LMS";
  }, []);


  const [columns, setColumns] = useState([]); // server-provided columns meta [{key,label},...]
  const [rows, setRows] = useState([]); // server-provided rows (array of objects keyed by column key)
  const [meta, setMeta] = useState({
    total: 0,
    page: initialPage,
    limit: initialLimit,
    totalPages: 0,
  });

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [is_active, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // full screen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const navigate = useNavigate();

  // helper to format cell values (simple heuristics)
  function formatCell(key, value) {
    if (value === null || value === undefined || value === "") return "-";

    // profile picture is handled in render path, return raw for fallback
    if (key === "profile_picture") return value;

    // booleans
    if (typeof value === "boolean") return value ? "Yes" : "No";

    // numbers display raw
    if (typeof value === "number") return value;

    // dates: common keys or ISO strings
    const dateKeys = ["doj", "probation_end_date", "created_at", "updated_at"];
    if (dateKeys.includes(key) || /\d{4}-\d{2}-\d{2}T|\d{4}-\d{2}-\d{2}/.test(String(value))) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        // show date + time for created_at, only date for doj/probation_end
        if (key === "created_at" || key === "updated_at") return d.toLocaleString();
        return d.toLocaleDateString();
      }
    }

    return String(value);
  }

  const fetchEmployees = async (pageToFetch = page, limitToFetch = limit, searchTerm = search, is_active = 'true') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pageToFetch);
      params.set("limit", limitToFetch);
      params.set("is_active", is_active);
      if (searchTerm) params.set("search", searchTerm);

      const response = await api.get(`/admin/get-all-emp-details?${params.toString()}`);
      const data = response.data || {};
      console.log(data);

      // server now returns { meta, columns, rows }
      setColumns(Array.isArray(data.columns) ? data.columns : []);
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setMeta(data.meta || { total: 0, page: pageToFetch, limit: limitToFetch, totalPages: 0 });
      setPage((data.meta && data.meta.page) || pageToFetch);
    } catch (err) {
      console.error("Failed loading employees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(page, limit, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);


  const onSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchEmployees(1, limit, search);
  };

  const clearSearch = () => {
    setSearch("");
    setPage(1);
    fetchEmployees(1, limit, "");
  };

  // Called when the user saves a config in TableConfigPanel
  const handleConfigSaved = (savedConfig) => {
    // re-fetch shaped data so server-applied config takes effect
    fetchEmployees(1, limit, search);
  };

  // compute colSpan for messages (use columns.length or fallback)
  const colSpan = Math.max(columns.length, 1);

  // lock body scroll while fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return undefined;
  }, [isFullscreen]);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // table renderer (so we can render inline or in fullscreen overlay)
  const renderTable = useCallback(() => {
    return (
      <ScrollArea className="flex-1">
        <div className="">
          <Table>
            <TableHeader className=''>
              <TableRow className='bg-purple-50 relative'>
                <TableHead key="actions" className="whitespace-nowrap text-right sticky left-0 z-30 w-20 border-r bg-purple-50">
                  Actions
                </TableHead>
                {columns.filter((col) => col.key !== "user_id").map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap border-r">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-8">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (

                rows.map((row, rowIndex) => (
                  <TableRow key={row.id || rowIndex} className='relative'>
                    <TableCell key="actions" className="text-right border-r sticky left-0 bg-white z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            aria-label="Actions"
                          >
                            <BiDotsHorizontalRounded />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          <RequirePermission permission="user.update">
                            <DropdownMenuItem
                              onClick={() => navigate(`/employees/${row.user_id || row.id}/edit`)}
                              className="flex items-center gap-2"
                            >
                              <FiEdit2 /> Edit
                            </DropdownMenuItem>
                          </RequirePermission>

                          <RequirePermission permission="user.makeInactive">
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-red-600"
                              onClick={() => {
                                setSelectedEmployee(row);
                                setIsDeleteAlertOpen(true);
                              }}
                            >
                              <FiTrash2 /> Make Inactive
                            </DropdownMenuItem>
                          </RequirePermission>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    {columns.filter((col) => col.key !== "user_id").map((col) => {
                      const key = col.key;
                      const raw = row[key];

                      // special case: profile picture rendering
                      if (key === "profile_picture") {
                        const profileUrl =
                          raw && (String(raw).startsWith("http") ? raw : `${import.meta.env.VITE_BASE_URL}/uploads/${raw}`);
                        return (

                          <TableCell key={key} className="whitespace-nowrap border-r">
                            {profileUrl ? (
                              <img
                                src={profileUrl}
                                alt={row.associates_name || row.user_name || "avatar"}
                                className="w-10 h-10 rounded-lg object-cover border"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      }

                      const formatted = formatCell(key, raw);
                      return (
                        <TableCell key={key} className="whitespace-nowrap border-r">
                          {formatted}
                        </TableCell>

                      );
                    })}


                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
    // include dependencies used inside
  }, [columns, rows, loading, colSpan, navigate]);

  return (
    <section className=" h-screen bg-gray-100 w-full flex flex-col justify-between flex-1 min-w-0">

      {/* Controls: Search, Config button, Per-page select */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-white">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={onSearch} className="flex items-center gap-2 w-full md:w-auto">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, payroll code, designation..."
              className="min-w-0  bg-white"
            />
            <Button type="submit">Search</Button>
            <Button variant="outline" onClick={clearSearch}>Clear</Button>
          </form>
        </div>

        {/* Right side controls including the TableConfigPanel button and fullscreen */}
        <div className="flex items-center gap-3">

          {/* isActive toggle button */}

          <Select
            value={is_active ? "active" : "inactive"}
            onValueChange={(value) => {
              const newStatus = value === "active";
              setIsActive(newStatus);
              fetchEmployees(1, limit, search, newStatus);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Employees</SelectItem>
              <SelectItem value="inactive">Inactive Employees</SelectItem>
            </SelectContent>
          </Select>

          <RequirePermission permission="user.create">
            <Button onClick={() => navigate("/employees/add-employee", { state: { from: location.pathname + location.search } })}>Add New Employee</Button>
          </RequirePermission>
          <TableConfigPanel tableKey="employees" onSaved={handleConfigSaved} />

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen((s) => !s)}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="ml-2"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Inline table (normal) */}
      <div className="flex-1 min-w-0">
        <div className="border flex-1 rounded m-4 bg-white shadow-sm">
          {renderTable()}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 bg-white ">
        <div className="text-sm text-slate-600">
          Showing page {meta.page} of {meta.totalPages} — {meta.total} total
        </div>

        <div className="flex items-center gap-2">

          <div className="flex items-center gap-2">
            <label className="text-sm">Per page:</label>

            <Select
              value={String(limit)}
              onValueChange={(val) => {
                const num = Number(val) || 20;
                setLimit(num);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[90px] h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} variant="outline">
            Prev
          </Button>
          <div className="px-3">{page}</div>
          <Button onClick={() => setPage((p) => (p < meta.totalPages ? p + 1 : p))} disabled={page >= meta.totalPages} variant="outline">
            Next
          </Button>
        </div>
      </div>

      {/* Fullscreen overlay (rendered when toggled) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          {/* top bar inside fullscreen */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Employees — Fullscreen</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsFullscreen(false)}>Close</Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                aria-label="Exit fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="border rounded bg-white shadow-sm h-full">
              {renderTable()}
            </div>
          </div>

          {/* footer pagination in fullscreen */}
          <div className="flex items-center justify-between p-4 bg-white mt-4">
            <div className="text-sm text-slate-600">
              Showing page {meta.page} of {meta.totalPages} — {meta.total} total
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} variant="outline">
                Prev
              </Button>
              <div className="px-3">{page}</div>
              <Button onClick={() => setPage((p) => (p < meta.totalPages ? p + 1 : p))} disabled={page >= meta.totalPages} variant="outline">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to inactivate this employee?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                api.post(`/admin/make-emp-inactive/${selectedEmployee.user_id}`)
                  .then(() => {
                    fetchEmployees(page, limit, search);
                  })
                  .catch((err) => {
                    console.error("Failed deactivating employee", err);
                  });
              }}
            >
              Inactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </section>
  );
}
