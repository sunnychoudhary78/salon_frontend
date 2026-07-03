// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AiOutlineHome, AiOutlineLogout } from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { logout } from "../../store/auth/authSlice";
import { selectMyPermissions } from "../../store/permissions/permissionsSlice";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CircleUser as LuCircleUser, 
  Shield as LuShield, 
  Settings2 as LuSettings2, 
  Building2 as LuBuilding2
} from "lucide-react";
import api from "@/api/axios";
import { appConfig } from "@/config/appConfig";

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const myPermissions = useSelector(selectMyPermissions) || [];
  // user still available if you want avatar later
  const user = useSelector((state) => state.auth.user) || {};

  const userRoles = (() => {
    if (!user) return [];
    // case 1: user.role is an object { name: 'SuperAdmin' }
    if (user.role && user.role.name) return [String(user.role.name)];
    // case 2: user.role is string 'SuperAdmin'
    if (user.role && typeof user.role === "string") return [user.role];
    // case 3: user.roles is array of role names or objects
    if (Array.isArray(user.roles)) {
      return user.roles
        .map((r) => (typeof r === "string" ? r : r.name || r.roleName))
        .filter(Boolean);
    }
    return [];
  })();

  const isHiddenForUser = (item) => {
    if (!item.hideForRoles || item.hideForRoles.length === 0) return false;
    const hideList = item.hideForRoles.map((r) => String(r).toLowerCase());
    return userRoles.some((ur) => hideList.includes(String(ur).toLowerCase()));
  };

  // UI state for expanded menus
  const [expandedMenus, setExpandedMenus] = useState({});

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // collapsed = icon-only (true) / expanded = descriptive (false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem("salon_sidebarCollapsed");
      return v === "true";
    } catch {
      return false;
    }
  });

  // persist collapsed
  useEffect(() => {
    try {
      localStorage.setItem("salon_sidebarCollapsed", collapsed ? "true" : "false");
    } catch { }
  }, [collapsed]);

  // convenience permission check
  const hasAny = (required = []) => {
    if (!required || required.length === 0) return true;
    return required.some((p) => myPermissions.includes(p));
  };

  // Menu structure (main items and optional subItems)
  // keep icons and keys here — labels will only show when expanded
  const menu = [
    {
      key: "home",
      label: "Dashboard",
      to: "/dashboard",
      icon: <AiOutlineHome className="text-lg" />,
      perms: [],
    },
    {
      key: "salon-mgmt",
      label: "Salon Management",
      to: "#",
      icon: <LuBuilding2 className="text-lg" />,
      perms: ["salonApplication.read", "salon.read", "serviceCategory.read", "service.read"],
      subItems: [
        { key: "salon-apps", label: "Salon Applications", to: "/salon-applications", perms: ["salonApplication.read"] },
        { key: "salons", label: "Approved Salons", to: "/salons", perms: ["salon.read"] },
        { key: "categories", label: "Service Categories", to: "/service-categories", perms: ["serviceCategory.read"] },
        { key: "services", label: "Services", to: "/services", perms: ["service.read"] },
      ],
    },
    {
      key: "customers",
      label: "Customers",
      to: "/customers",
      icon: <LuCircleUser className="text-lg" />,
      perms: ["customer.read"],
    },
    {
      key: "bookings",
      label: "Bookings",
      to: "/bookings",
      icon: <LuSettings2 className="text-lg" />,
      perms: ["booking.read"],
    },
    {
      key: "marketing",
      label: "Marketing",
      to: "#",
      icon: <LuSettings2 className="text-lg" />,
      perms: ["coupon.read", "banner.read"],
      subItems: [
        { key: "coupons", label: "Coupons", to: "/coupons", perms: ["coupon.read"] },
        { key: "banners", label: "Promotional Banners", to: "/promotional-banners", perms: ["banner.read"] },
      ],
    },
    {
      key: "reviews",
      label: "Reviews & Ratings",
      to: "/reviews",
      icon: <LuShield className="text-lg" />,
      perms: ["review.read"],
    },
    {
      key: "access",
      label: "Access Control",
      to: "#",
      icon: <LuShield className="text-lg" />,
      perms: ["role.read", "permission.read"],
      subItems: [
        { key: "roles", label: "Roles & Permissions", to: "/roles", perms: ["role.read"] },
      ],
    },
    {
      key: "finance",
      label: "Finance",
      to: "#",
      icon: <LuSettings2 className="text-lg" />,
      perms: ["payment.read", "settlement.read", "payoutAccount.read", "financeSetting.read"],
      subItems: [
        { key: "payments", label: "Payments", to: "/payments", perms: ["payment.read"] },
        { key: "settlement-ledger", label: "Settlement Ledger", to: "/settlement-ledger", perms: ["settlement.read"] },
        { key: "settlement-batches", label: "Settlement Batches", to: "/settlement-batches", perms: ["settlement.read"] },
        { key: "payout-accounts", label: "Payout Accounts", to: "/salon-payout-accounts", perms: ["payoutAccount.read"] },
      ],
    },
    {
      key: "system",
      label: "System",
      to: "#",
      icon: <LuSettings2 className="text-lg" />,
      perms: ["platformSetting.read", "financeSetting.read", "auditLog.read"],
      subItems: [
        { key: "settings", label: "Platform Settings", to: "/platform-settings", perms: ["platformSetting.read"] },
        { key: "audit", label: "Audit Logs", to: "/audit-logs", perms: ["auditLog.read"] },
      ],
    },
  ];

  // helper to check active path
  const isActive = (to) => {
    if (!to || to === "#") return false;
    if (to === "/dashboard" || to === "/") return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white shadow-sm border-b sticky top-0 z-50 h-16 flex items-center justify-between px-4 w-full shrink-0">
        {/* Left: Hamburger/Close */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 text-sky-600"
        >
          {mobileMenuOpen ? <HiX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
        </button>

        {/* Right: Logo */}
        <div className="flex items-center">
             <img src={`${import.meta.env.VITE_FRONTEND_BASE_PATH || '/'}impower_logo.jpg`} alt="logo" className="h-10" />
        </div>
      </div>

      {/* Mobile Menu Shutter */}
      <div 
        className={`md:hidden fixed inset-0 z-40 bg-white pt-16 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="h-full overflow-y-auto px-4 py-6 pb-20">
          <ul className="space-y-2">
            {menu.map((m) => {
              if (isHiddenForUser(m)) return null;
              if (!hasAny(m.perms)) return null;
              const topHasSub = Array.isArray(m.subItems) && m.subItems.length > 0;
              const active = isActive(m.to);
              
              return (
                <li key={m.key} className="group">
                  <div className={`rounded-md overflow-hidden ${active ? "bg-sky-50" : "hover:bg-gray-50"}`}>
                     {topHasSub ? (
                       <button
                         onClick={() => setExpandedMenus(s => ({ ...s, [m.key]: !s[m.key] }))}
                         className="flex items-center justify-between w-full p-3 text-left"
                       >
                         <div className="flex items-center gap-3">
                           <span className={`${active ? "text-primary" : "text-gray-500"}`}>{m.icon}</span>
                           <span className={`font-medium ${active ? "text-sky-700" : "text-gray-700"}`}>{m.label}</span>
                         </div>
                         {expandedMenus[m.key] ? <IoIosArrowDown /> : <IoIosArrowForward />}
                       </button>
                     ) : (
                       <Link to={m.to} className="flex items-center gap-3 p-3 w-full">
                          <div className="relative">
                            <span className={`${active ? "text-primary" : "text-gray-500"}`}>{m.icon}</span>
                             {/* Badge logic removed */}
                          </div>
                          <span className={`font-medium ${active ? "text-sky-700" : "text-gray-700"}`}>{m.label}</span>
                       </Link>
                     )}
                  </div>
                  
                  {/* Mobile Submenu */}
                  {topHasSub && expandedMenus[m.key] && (
                    <ul className="ml-4 mt-1 border-l-2 border-gray-100 pl-2 space-y-1">
                      {m.subItems.map(s => {
                         if (!hasAny(s.perms)) return null;
                         const sActive = isActive(s.to);
                         return (
                           <li key={s.key}>
                             <Link to={s.to} className={`block px-3 py-2 rounded-md text-sm ${sActive ? "text-sky-700 font-medium bg-sky-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
                               {s.label}
                             </Link>
                           </li>
                         )
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
             <button
                onClick={() => dispatch(logout())}
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 text-red-600 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                  <AiOutlineLogout className="text-lg" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
          </div>
        </nav>
      </div>

      <aside
        className={`hidden md:flex bg-white  shadow-lg min-h-screen sticky top-0 z-50 h-screen transition-all duration-200 flex-col justify-between ${collapsed ? "w-20 md:w-20" : "w-64 md:w-64"
          }`}
        aria-label="Sidebar"
        role="navigation"
      >
        {/* Top bar: logo + hamburger */}
        <div className={`flex items-center px-4  border-b`}>
          {collapsed ? (
            <button
              aria-label="Expand sidebar"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((s) => !s)}
              className="w-10 h-10 rounded-md bg-sky-400 text-white flex items-center justify-center my-4 cursor-pointer"
            >
              <HiOutlineMenu className="text-xl" />
            </button>
          ) : (
            <div className="flex items-center gap-4 w-full ">
              <button
                aria-label="Collapse sidebar"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((s) => !s)}
                className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center my-4 cursor-pointer"
              >
                <HiX className="text-xl" />
              </button>
              <img src={`${import.meta.env.VITE_FRONTEND_BASE_PATH || '/'}${appConfig.logo}`} alt="logo" className="h-14" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-auto">
          <ul className="space-y-1">
            {menu.map((m) => {
              if (isHiddenForUser(m)) return null;
              if (!hasAny(m.perms)) return null;
              const topHasSub =
                Array.isArray(m.subItems) && m.subItems.length > 0;
              const active = isActive(m.to);

              return (
                <li key={m.key} className="group">
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                      ${active
                        ? "bg-sky-100 "
                        : "hover:bg-gray-50"
                      }`}
                  >
                    <div className="relative">
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={m.to}
                              className={`w-8 h-8 rounded-md flex items-center justify-center ${active
                                ? "bg-primary text-white"
                                : "bg-primary text-white"
                                }`}
                              aria-hidden
                            >
                              {m.icon || null}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <span className="text-sm">{m.label}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          className={`relative w-8 h-8 rounded-md flex items-center justify-center ${active
                            ? 'primary-background text-white'
                            : 'bg-primary text-white'
                            }`}
                        >
                          {m.icon || null}
                        </div>
                      )}
                    </div>

                    {/* Link / label area */}
                    <div className="flex-1 min-w-0">
                      {topHasSub ? (
                        <button
                          onClick={() =>
                            setExpandedMenus((s) => ({
                              ...s,
                              [m.key]: !s[m.key],
                            }))
                          }
                          className="flex items-center justify-between w-full text-left"
                          aria-expanded={!!expandedMenus[m.key]}
                        >
                          {/* label shown only when expanded */}
                          {!collapsed ? (
                            <span
                              className={`font-medium text-sm text-gray-800 ${active ? "text-sky-600" : ""
                                }`}
                            >
                              {m.label}
                            </span>
                          ) : null}

                          {/* chevron (only visible in expanded mode) */}
                          {!collapsed && (
                            <span className="ml-2">
                              {expandedMenus[m.key] ? (
                                <IoIosArrowDown />
                              ) : (
                                <IoIosArrowForward />
                              )}
                            </span>
                          )}
                        </button>
                      ) : (
                        <Link
                          to={m.to}
                          className={`flex items-center gap-2 w-full ${collapsed ? "justify-center" : ""
                            }`}
                          title={collapsed ? m.label : undefined}
                        >
                          {/* label shown only in expanded mode */}
                          {!collapsed ? (
                            <span
                              className={`font-medium text-sm text-gray-800 whitespace-nowrap overflow-x-hidden ${active ? "text-sky-600" : ""
                                }`}
                            >
                              {m.label}
                            </span>
                          ) : null}
                          {(() => {
                            if (collapsed) return null;
                            return null;
                          })()}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Sub items (only visible when expanded) */}
                  {topHasSub && expandedMenus[m.key] && !collapsed && (
                    <ul className="mt-2 ml-12 space-y-1">
                      {m.subItems.map((s) => {
                        if (!hasAny(s.perms)) return null;
                        const sActive = isActive(s.to);
                        return (
                          <li key={s.key}>
                            <Link
                              to={s.to}
                              className={`block px-3 py-2 rounded-md text-sm ${sActive
                                ? "bg-sky-50 border-l-4 border-primary text-sky-700"
                                : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              {s.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout at bottom */}
        <div className="p-3 ">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => dispatch(logout())}
                  className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl bg-white shadow-sm hover:shadow-md transition justify-center cursor-pointer"
                  aria-label="Logout"
                  title="Logout"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-400 flex items-center justify-center text-white">
                    <AiOutlineLogout />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="text-sm">Logout</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => dispatch(logout())}
              className={`w-full flex items-center gap-3 py-2 px-2 rounded-2xl bg-white shadow-sm hover:shadow-md transition cursor-pointer`}
            >
              <div className="w-10 h-10 rounded-full bg-sky-400 flex items-center justify-center text-white">
                <AiOutlineLogout />
              </div>

              <div className="text-left">
                <div className="text-sm font-medium">Logout</div>
                <div className="text-xs text-gray-500">Sign out</div>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
