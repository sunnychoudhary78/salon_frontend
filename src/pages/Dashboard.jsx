// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import api from "../api/axios";
import { 
    Mail as FiMail, 
    Phone as FiPhone, 
    MapPin as FiMapPin, 
    User as FiUser, 
    Briefcase as FiBriefcase, 
    Calendar as FiCalendar, 
    UserCheck as FiUserCheck, 
    Clipboard as FiClipboard,
    Droplet as GiDrop,
    Building as FaBuilding,
    IdCard as FaIdBadge,
    Users as FaUsers,
    Building2 as FaOffice,
    Edit as MdEdit
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ChangePasswordDialog from "@/components/common/ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import RequirePermission from "@/components/common/RequirePermission";
import { toast } from "react-hot-toast";
import { selectMyPermissions } from "../store/permissions/permissionsSlice";

/**
 * Role helpers:
 * - normalize role(s) from many possible shapes in `user`
 * - return array of role names (strings)
 */
function extractUserRoles(user) {
    if (!user) return [];
    // common shapes
    if (user.role && typeof user.role === "string") return [user.role];
    if (user.role && user.role.name) return [user.role.name];
    if (Array.isArray(user.roles)) {
        // elements might be strings or objects with 'name'
        return user.roles.map(r => (typeof r === "string" ? r : r.name || r.roleName)).filter(Boolean);
    }
    // try fallback properties
    if (user.roleName) return [user.roleName];
    if (user.rolesNames && Array.isArray(user.rolesNames)) return user.rolesNames;
    return [];
}

export default function Dashboard() {
    const user = useSelector((state) => state.auth.user) || {};
    const navigate = useNavigate();
    const myPermissions = useSelector(selectMyPermissions);
    const hasStatsPermission = myPermissions.includes('stats.read') || user?.role?.permissions?.some(p => p.name === 'stats.read');

    const [open, setOpen] = useState(false);
    // determine roles
    const userRoles = extractUserRoles(user).map(r => String(r).toLowerCase());
    const isSuperAdmin = userRoles.includes("superadmin") || userRoles.includes("super admin");
    const isAdmin = userRoles.includes("admin") || userRoles.includes("administrator") || userRoles.includes("hr");
    const _isManager = userRoles.includes("manager");
    const _isDeptHead = userRoles.includes("departmenthead") || userRoles.includes("department head") || userRoles.includes("head");

    // Employee profile state (existing)
    const [empData, setEmpData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Admin stats state (for superadmin/admin)
    const [adminStats, setAdminStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState(null);

    useEffect(() => {
        document.title = "Dashboard | Immortal LMS";
    }, []);

    // ---------- employee data fetch ----------
    const fetchUserData = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const res = await api.get("employees/single");
            setEmpData(res.data);
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("Unable to fetch employee data.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        // if user has NO stats permission, fetch profile info
        if (!hasStatsPermission) {
            fetchUserData();
        } else {
            // otherwise fetch admin stats
            fetchAdminStats();
        }
    }, [hasStatsPermission]);

    // ---------- admin stats fetch ----------
    const fetchAdminStats = async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const res = await api.get("/stats/admin-overview");
            setAdminStats(res.data);
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
            setStatsError("Failed to load statistics.");
        } finally {
            setStatsLoading(false);
        }
    };

    // ---------- upload handler (same as your original) ----------
    const handleUpload = async () => {
        if (!profilePhoto) {
            setError("Please choose a file first.");
            return;
        }

        // Check file size (1MB limit)
        if (profilePhoto.size > 1024 * 1024) {
            const msg = "Image size too large. Image must be less than 1 MB.";
            toast.error(msg);
            setError(msg);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const form = new FormData();
            form.append("photo", profilePhoto);

            const res = await api.post("employee-photo/photo", form, {});
            console.log("upload success:", res.data);
            fetchUserData(true);
            setProfileDialogOpen(false);
            setProfilePhoto(null);
            toast.success("Profile photo updated successfully");
        } catch (err) {
            console.error("upload error", err);
            if (err.response) {
                const msg = err.response.data?.message || "";
                const stack = err.response.data?.stack || "";
                if (stack.includes("File too large") || msg.includes("File too large") || msg.includes("too large")) {
                    const friendlyMsg = "Image size too large. Image must be less than 1 MB.";
                    toast.error(friendlyMsg);
                    setError(friendlyMsg);
                } else {
                    setError(`Upload failed: ${err.response.status} - ${msg || "Something went wrong"}`);
                }
            } else {
                setError("Upload failed. See console for details.");
            }
        } finally {
            setUploading(false);
        }
    };

    // helpers reused from your code
    function formatDOJ(isoDate) {
        if (!isoDate) return "Not specified";
        try {
            const d = new Date(isoDate);
            return d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return isoDate;
        }
    }

    function formatExperience(yearsStr) {
        if (!yearsStr) return "0 Years";
        const yrs = parseInt(yearsStr, 10);
        if (isNaN(yrs)) return `${yearsStr} Years`;
        return `${yrs} ${yrs === 1 ? "Year" : "Years"}`;
    }

    const buildTiles = (d) => [
        { title: "Employee ID", value: d?.payroll_code || "—", icon: <FaIdBadge className="text-xl" /> },
        { title: "Full Name", value: d?.associates_name || "—", icon: <FiUser className="text-xl" /> },
        { title: "Designation", value: d?.designation || "—", icon: <FiBriefcase className="text-xl" /> },
        { title: "Department", value: d?.department?.name || "—", icon: <FaBuilding className="text-xl" /> },
        { title: "Reporting Manager", value: d?.manager?.name || "—", icon: <FiUserCheck className="text-xl" /> },
        { title: "Department Head", value: d?.department_head?.name || "—", icon: <FiClipboard className="text-xl" /> },
        { title: "Joining Date", value: formatDOJ(d?.doj), icon: <FiCalendar className="text-xl" /> },
        { title: "Experience", value: formatExperience(d?.total_experience), icon: <FiBriefcase className="text-xl" /> },
        { title: "Work Location", value: d?.work_location || "Not specified", icon: <FiMapPin className="text-xl" /> },
        { title: "Email", value: d?.email || "—", icon: <FiMail className="text-xl" /> },
        { title: "Contact", value: d?.contact_primary ? `+91 ${d.contact_primary}` : "—", icon: <FiPhone className="text-xl" /> },
        { title: "Blood Group", value: d?.blood_group || "—", icon: <GiDrop className="text-xl" /> },
    ];

    // ---------- UI ----------
    return (
        <div className="">
            {/* Super Admin / Admin overview */}
            {hasStatsPermission ? (
                <RequirePermission permission="stats.read">
                    <section className="space-y-6 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold">Admin Overview</h1>
                                <p className="text-sm text-gray-500">Company-level statistics</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={fetchAdminStats} className="px-3 py-2" disabled={statsLoading}>
                                    {statsLoading ? "Refreshing…" : "Refresh"}
                                </Button>
                            </div>
                        </div>

                        {statsError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{statsError}</div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link to="/employees" className="bg-white rounded-lg p-4 shadow hover:shadow-md cursor-pointer">
                                <div className="text-xs text-gray-500">Employees</div>
                                <div className="text-3xl font-semibold">
                                    {adminStats ? (adminStats.employeesCount ?? 0) : (statsLoading ? "…" : "—")}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Total employees</div>
                            </Link>

                            <Link to="/companies" className="bg-white rounded-lg p-4 shadow hover:shadow-md cursor-pointer">
                                <div className="text-xs text-gray-500">Companies</div>
                                <div className="text-3xl font-semibold">
                                    {adminStats ? (adminStats.companiesCount ?? 0) : (statsLoading ? "…" : "—")}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Total companies</div>
                            </Link>

                            <Link to="/admins" className="bg-white rounded-lg p-4 shadow hover:shadow-md cursor-pointer">
                                <div className="text-xs text-gray-500">Admins</div>
                                <div className="text-3xl font-semibold">
                                    {adminStats ? (adminStats.adminsCount ?? 0) : (statsLoading ? "…" : "—")}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Users with admin privileges</div>
                            </Link>
                        </div>
                    </section>
                </RequirePermission>
            ) : (
                // ---------- Employee / Manager / Dept Head UI (existing) ----------

                <main className="">
                    <div className=" ">
                        {loading && (
                            <div className="p-6 bg-white rounded-lg shadow text-center">Loading profile…</div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {!loading && !error && !empData && (
                            <div className="p-6 bg-white rounded-lg shadow text-center">No profile data.</div>
                        )}

                        {empData && (
                            <div className="bg-gray-50  overflow-hidden p-6 space-y-6">
                                <section className="shadow-sm p-8 rounded-xl bg-white flex justify-between flex-wrap gap-4">
                                    <h2 className="text-xl ">Welcome <span className="text-sky-500 font-semibold">{user?.name}</span></h2>
                                    {/* <div className="border-b mt-4"></div> */}

                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => setOpen(true)}>Change password</Button>
                                        {empData?.employee_edit_enabled ? (
                                            <Button variant="outline" onClick={() => navigate('/my-details')}>My Details</Button>
                                        ) : null}
                                    </div>
                                    <ChangePasswordDialog open={open} onOpenChange={setOpen} onSuccess={() => console.log('changed')} />
                                </section>

                                <section className=" shadow-sm p-8 rounded-xl bg-white">
                                    <div className="title mb-4">
                                        <h2 className="text-xl ">Profile Information</h2>
                                    </div>
                                    <div className="flex flex-col xl:flex-row gap-4 ">
                                        <div className=" w-full lg:w-1/2 xl:w-1/4 mx-auto">
                                            <div className="p-6 flex flex-col items-center shadow-inner shadow-gray-200 rounded-xl  h-max">
                                                <div className="w-full aspect-square rounded-md overflow-hidden group relative ">
                                                    <img
                                                        src={`${import.meta.env.VITE_BASE_URL}/uploads/${empData?.profile_picture}`}
                                                        alt={empData.associates_name || "Employee"}
                                                        className="w-full h-full object-cover group-hover:blur-xs transition duration-300 ease-in-out"
                                                    />

                                                    <div onClick={() => setProfileDialogOpen(true)} className="border border-sky-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out cursor-pointer">
                                                        <MdEdit className="text-lg  m-1 text-sky-500" />
                                                    </div>

                                                </div>

                                                <h2 className="mt-4 text-lg font-semibold text-gray-800">
                                                    {empData.associates_name || "Unknown"}
                                                </h2>
                                                {/* <p className="text-sm text-gray-500">
                                                Employee ID: {empData.payroll_code || "—"}
                                            </p> */}
                                            </div>

                                            {empData?.company && (
                                                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-3">
                                                    {empData.company.logo_filename && (
                                                        <div className="h-16 w-auto flex items-center justify-center">
                                                            <img 
                                                                src={`${import.meta.env.VITE_BASE_URL}/uploads/company/${empData.company.logo_filename}`}
                                                                alt={empData.company.name}
                                                                className="h-full w-auto object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <h3 className="text-lg font-bold text-gray-800 text-center leading-tight">
                                                        {empData.company.name}
                                                    </h3>
                                                </div>
                                            )}
                                        </div>

                                        <div className=" grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 3xl:grid-cols-3 gap-3 flex-1">
                                            {buildTiles(empData).map((t, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-inner shadow-gray-200">
                                                    <div className="shrink-0 w-12 h-12 rounded-md bg-sky-50 text-sky-500 flex items-center justify-center">
                                                        {t.icon}
                                                    </div>
                                                    <div className="flex-1 ">
                                                        <div className="text- text-gray-400 ">{t.title}</div>
                                                        <div className="text-sm font-medium text-gray-700 truncate whitespace-normal">{t.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>



                            </div>
                        )}
                    </div>


                </main>
            )}
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogTrigger />
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Profile Photo</DialogTitle>

                        <div className="my-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                    <span>Choose Photo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {profilePhoto && (
                                    <div className="h-16 w-16 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={URL.createObjectURL(profilePhoto)}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setProfileDialogOpen(false); setProfilePhoto(null); }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading || !profilePhoto}
                                >
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </div>

                            {error && <p className="text-red-600 mt-2">{error}</p>}
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}

