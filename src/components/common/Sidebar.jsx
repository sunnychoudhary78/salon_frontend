import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  AiOutlineHome,
  AiOutlineLogout,
} from "react-icons/ai";

import {
  IoIosArrowDown,
  IoIosArrowForward,
} from "react-icons/io";

import {
  HiOutlineMenu,
  HiX,
} from "react-icons/hi";

import {
  CircleUser as LuCircleUser,
  Building2 as LuBuilding2,
  CalendarDays,
  Megaphone,
  WalletCards,
  Star,
  LockKeyhole,
  Cog,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { logout } from "../../store/auth/authSlice";
import { selectMyPermissions } from "../../store/permissions/permissionsSlice";
import { appConfig } from "@/config/appConfig";

/* ============================================================
   SIDEBAR
   Premium Light / White Design
   ============================================================ */

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();

  /* ==========================================================
     AUTH
     ========================================================== */

  const myPermissions =
    useSelector(selectMyPermissions) || [];

  const user =
    useSelector((state) => state.auth.user) || {};

  /* ==========================================================
     USER ROLES
     ========================================================== */

  const userRoles = (() => {
    if (!user) {
      return [];
    }

    if (user.role?.name) {
      return [String(user.role.name)];
    }

    if (
      user.role &&
      typeof user.role === "string"
    ) {
      return [user.role];
    }

    if (Array.isArray(user.roles)) {
      return user.roles
        .map((role) =>
          typeof role === "string"
            ? role
            : role?.name || role?.roleName
        )
        .filter(Boolean);
    }

    return [];
  })();

  /* ==========================================================
     ROLE VISIBILITY
     ========================================================== */

  const isHiddenForUser = (item) => {
    if (
      !item.hideForRoles ||
      item.hideForRoles.length === 0
    ) {
      return false;
    }

    const hideList =
      item.hideForRoles.map((role) =>
        String(role).toLowerCase()
      );

    return userRoles.some((userRole) =>
      hideList.includes(
        String(userRole).toLowerCase()
      )
    );
  };

  /* ==========================================================
     STATE
     ========================================================== */

  const [expandedMenus, setExpandedMenus] =
    useState({});

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* ==========================================================
     SIDEBAR COLLAPSE
     ========================================================== */

  const [collapsed, setCollapsed] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "salon_sidebarCollapsed"
          ) === "true"
        );
      } catch {
        return false;
      }
    });

  /* ==========================================================
     SAVE COLLAPSE STATE
     ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        "salon_sidebarCollapsed",
        collapsed ? "true" : "false"
      );
    } catch {
      // Ignore storage errors
    }
  }, [collapsed]);

  /* ==========================================================
     CLOSE MOBILE MENU ON ROUTE CHANGE
     ========================================================== */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* ==========================================================
     PERMISSION CHECK
     ========================================================== */

  const hasAny = (required = []) => {
    if (
      !required ||
      required.length === 0
    ) {
      return true;
    }

    return required.some((permission) =>
      myPermissions.includes(permission)
    );
  };

  /* ============================================================
     MENU
     ROUTES + PERMISSIONS PRESERVED
     ============================================================ */

  const menu = [
    /* ==========================================================
       DASHBOARD
       ========================================================== */

    {
      key: "home",
      label: "Dashboard",
      to: "/dashboard",
      icon: <AiOutlineHome />,
      perms: [],
    },

    /* ==========================================================
       SALON MANAGEMENT
       ========================================================== */

    {
      key: "salon-mgmt",
      label: "Salon Management",
      to: "#",
      icon: <LuBuilding2 />,
      perms: [
        "salonApplication.read",
        "salon.read",
        "service.read",
      ],

      subItems: [
        {
          key: "salon-apps",
          label: "Salon Applications",
          to: "/salon-applications",
          perms: ["salonApplication.read"],
        },

        {
          key: "salons",
          label: "Approved Salons",
          to: "/salons",
          perms: ["salon.read"],
        },

        {
          key: "services",
          label: "Services",
          to: "/services",
          perms: ["service.read"],
        },
      ],
    },

    /* ==========================================================
       CUSTOMERS
       ========================================================== */

    {
      key: "customers",
      label: "Customers",
      to: "/customers",
      icon: <LuCircleUser />,
      perms: ["customer.read"],
    },

    /* ==========================================================
       BOOKINGS
       ========================================================== */

    {
      key: "bookings",
      label: "Bookings",
      to: "/bookings",
      icon: <CalendarDays />,
      perms: ["booking.read"],
    },

    /* ==========================================================
       MARKETING
       ========================================================== */

    {
      key: "marketing",
      label: "Marketing",
      to: "#",
      icon: <Megaphone />,
      perms: [
        "coupon.read",
        "banner.read",
      ],

      subItems: [
        {
          key: "coupons",
          label: "Coupons",
          to: "/coupons",
          perms: ["coupon.read"],
        },

        {
          key: "banners",
          label: "Promotional Banners",
          to: "/promotional-banners",
          perms: ["banner.read"],
        },
      ],
    },

    /* ==========================================================
       REVIEWS
       ========================================================== */

    {
      key: "reviews",
      label: "Reviews & Ratings",
      to: "/reviews",
      icon: <Star />,
      perms: ["review.read"],
    },

    /* ==========================================================
       ACCESS CONTROL
       ========================================================== */

    {
      key: "access",
      label: "Access Control",
      to: "#",
      icon: <LockKeyhole />,
      perms: [
        "role.read",
        "permission.read",
      ],

      subItems: [
        {
          key: "roles",
          label: "Roles & Permissions",
          to: "/roles",
          perms: ["role.read"],
        },
      ],
    },

    /* ==========================================================
       FINANCE
       ========================================================== */

    {
      key: "finance",
      label: "Finance",
      to: "#",
      icon: <WalletCards />,
      perms: [
        "payment.read",
        "settlement.read",
        "payoutAccount.read",
        "financeSetting.read",
      ],

      subItems: [
        {
          key: "payments",
          label: "Payments",
          to: "/payments",
          perms: ["payment.read"],
        },

        {
          key: "settlement-ledger",
          label: "Settlement Ledger",
          to: "/settlement-ledger",
          perms: ["settlement.read"],
        },

        {
          key: "settlement-batches",
          label: "Settlement Batches",
          to: "/settlement-batches",
          perms: ["settlement.read"],
        },

        {
          key: "payout-accounts",
          label: "Payout Accounts",
          to: "/salon-payout-accounts",
          perms: ["payoutAccount.read"],
        },
      ],
    },

    /* ==========================================================
       SYSTEM
       ========================================================== */

    {
      key: "system",
      label: "System",
      to: "#",
      icon: <Cog />,
      perms: [
        "platformSetting.read",
        "financeSetting.read",
        "auditLog.read",
      ],

      subItems: [
        {
          key: "settings",
          label: "Platform Settings",
          to: "/platform-settings",
          perms: ["platformSetting.read"],
        },

        {
          key: "audit",
          label: "Audit Logs",
          to: "/audit-logs",
          perms: ["auditLog.read"],
        },
      ],
    },
  ];

  /* ==========================================================
     ACTIVE ROUTE
     ========================================================== */

  const isActive = (to) => {
    if (!to || to === "#") {
      return false;
    }

    if (
      to === "/dashboard" ||
      to === "/"
    ) {
      return location.pathname === to;
    }

    return (
      location.pathname === to ||
      location.pathname.startsWith(`${to}/`)
    );
  };

  /* ==========================================================
     ACTIVE CHILD
     ========================================================== */

  const hasActiveChild = (item) => {
    if (!item.subItems) {
      return false;
    }

    return item.subItems.some((subItem) =>
      isActive(subItem.to)
    );
  };

  /* ==========================================================
     TOGGLE MENU
     ========================================================== */

  const toggleMenu = (key) => {
    setExpandedMenus((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  /* ==========================================================
     SECTION
     ========================================================== */

  const getSection = (key) => {
    if (key === "home") {
      return "Overview";
    }

    if (
      [
        "salon-mgmt",
        "customers",
        "bookings",
        "marketing",
        "reviews",
      ].includes(key)
    ) {
      return "Operations";
    }

    if (
      [
        "access",
        "finance",
        "system",
      ].includes(key)
    ) {
      return "Management";
    }

    return null;
  };

  /* ==========================================================
     NAV ITEM
     ========================================================== */

  const renderNavItem = (item) => {
    if (isHiddenForUser(item)) {
      return null;
    }

    if (!hasAny(item.perms)) {
      return null;
    }

    const hasChildren =
      Array.isArray(item.subItems) &&
      item.subItems.length > 0;

    const active =
      isActive(item.to);

    const childActive =
      hasActiveChild(item);

    const menuOpen =
      !!expandedMenus[item.key];

    return (
      <li
        key={item.key}
        className="relative"
      >
        {/* ==================================================
            MAIN ITEM WRAPPER
            ================================================== */}

        <div
          className={`
            relative
            overflow-hidden
            rounded-2xl
            border
            transition-all
            duration-200

            ${
              active || childActive
                ? `
                  border-violet-200
                  bg-gradient-to-r
                  from-violet-50
                  via-purple-50
                  to-white
                  shadow-[0_6px_22px_rgba(124,58,237,0.08)]
                `
                : `
                  border-transparent
                  bg-transparent
                  hover:border-slate-100
                  hover:bg-slate-50
                `
            }
          `}
        >

          {/* ==================================================
              ACTIVE LEFT ACCENT
              ================================================== */}

          {(active || childActive) && (
            <span
              className="
                absolute
                left-0
                top-1/2
                h-9
                w-[3px]
                -translate-y-1/2
                rounded-r-full
                bg-gradient-to-b
                from-violet-500
                via-purple-500
                to-indigo-500
                shadow-[0_0_12px_rgba(139,92,246,0.45)]
              "
            />
          )}

          {/* ==================================================
              WITH CHILDREN
              ================================================== */}

          {hasChildren ? (
            <button
              type="button"
              onClick={() =>
                toggleMenu(item.key)
              }
              className="
                group
                flex
                w-full
                items-center
                gap-2.5
                px-2
                py-1.5
                text-left
              "
              aria-expanded={menuOpen}
            >

              {/* ICON */}

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  transition-all
                  duration-200

                  ${
                    active || childActive
                      ? `
                        border-violet-200
                        bg-gradient-to-br
                        from-violet-500
                        via-purple-500
                        to-indigo-600
                        text-white
                        shadow-[0_7px_18px_rgba(124,58,237,0.28)]
                      `
                      : `
                        border-slate-200
                        bg-white
                        text-violet-500
                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                        group-hover:border-violet-200
                        group-hover:bg-violet-50
                        group-hover:text-violet-600
                      `
                  }
                `}
              >
                {React.cloneElement(
                  item.icon,
                  {
                    size: 19,
                    strokeWidth: 1.8,
                  }
                )}
              </span>

              {/* LABEL */}

              {!collapsed && (
                <span
                  className={`
                    min-w-0
                    flex-1
                    truncate
                    text-[13px]
                    font-semibold
                    tracking-[-0.01em]

                    ${
                      active || childActive
                        ? "text-slate-900"
                        : "text-slate-700 group-hover:text-slate-950"
                    }
                  `}
                >
                  {item.label}
                </span>
              )}

              {/* ARROW */}

              {!collapsed && (
                <span
                  className={`
                    shrink-0
                    transition-all
                    duration-200

                    ${
                      menuOpen
                        ? "text-violet-600"
                        : "text-slate-400 group-hover:text-violet-500"
                    }
                  `}
                >
                  {menuOpen ? (
                    <IoIosArrowDown size={16} />
                  ) : (
                    <IoIosArrowForward size={16} />
                  )}
                </span>
              )}
            </button>
          ) : (

            /* ==================================================
               NORMAL LINK
               ================================================== */

            <Link
              to={item.to}
              className={`
                group
                flex
                items-center
                gap-2.5
                px-2
                py-1.5

                ${
                  collapsed
                    ? "justify-center"
                    : ""
                }
              `}
            >

              {/* ICON */}

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                        border-violet-200
                        bg-gradient-to-br
                        from-violet-500
                        via-purple-500
                        to-indigo-600
                        text-white
                        shadow-[0_7px_18px_rgba(124,58,237,0.28)]
                      `
                      : `
                        border-slate-200
                        bg-white
                        text-violet-500
                        shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                        group-hover:border-violet-200
                        group-hover:bg-violet-50
                        group-hover:text-violet-600
                      `
                  }
                `}
              >
                {React.cloneElement(
                  item.icon,
                  {
                    size: 19,
                    strokeWidth: 1.8,
                  }
                )}
              </span>

              {/* LABEL */}

              {!collapsed && (
                <span
                  className={`
                    min-w-0
                    flex-1
                    truncate
                    text-[13px]
                    font-semibold
                    tracking-[-0.01em]

                    ${
                      active
                        ? "text-slate-950"
                        : "text-slate-700 group-hover:text-slate-950"
                    }
                  `}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* ======================================================
            SUB MENU
            ====================================================== */}

        {hasChildren &&
          menuOpen &&
          !collapsed && (
            <div
              className="
                ml-5
                mt-0
                mb-0
                border-l
                border-violet-100
                pl-3
              "
            >
              <ul className="space-y-0">

                {item.subItems.map(
                  (subItem) => {

                    if (
                      !hasAny(
                        subItem.perms
                      )
                    ) {
                      return null;
                    }

                    if (
                      isHiddenForUser(
                        subItem
                      )
                    ) {
                      return null;
                    }

                    const subActive =
                      isActive(
                        subItem.to
                      );

                    return (
                      <li
                        key={subItem.key}
                      >
                        <Link
                          to={subItem.to}
                          className={`
                            relative
                            flex
                            items-center
                            gap-3
                            rounded-[9px]
                            px-2
                            py-1
                            text-[12px]
                            font-medium
                            transition-all
                            duration-200

                            ${
                              subActive
                                ? `
                                  border
                                  border-violet-100
                                  bg-violet-50
                                  text-violet-700
                                  shadow-[0_4px_15px_rgba(124,58,237,0.07)]
                                `
                                : `
                                  border
                                  border-transparent
                                  text-slate-500
                                  hover:bg-slate-50
                                  hover:text-violet-600
                                `
                            }
                          `}
                        >

                          {/* DOT */}

                          <span
                            className={`
                              h-1.5
                              w-1.5
                              shrink-0
                              rounded-full

                              ${
                                subActive
                                  ? `
                                    bg-violet-500
                                    shadow-[0_0_8px_rgba(139,92,246,0.5)]
                                  `
                                  : `
                                    bg-slate-300
                                  `
                              }
                            `}
                          />

                          {/* LABEL */}

                          <span className="truncate">
                            {subItem.label}
                          </span>
                        </Link>
                      </li>
                    );
                  }
                )}

              </ul>
            </div>
          )}
      </li>
    );
  };

  /* ==========================================================
     LOGOUT
     ========================================================== */

  const handleLogout = () => {
    dispatch(logout());
  };

  /* ==========================================================
     LOGO URL
     ========================================================== */

  const logoUrl =
    `${import.meta.env.VITE_FRONTEND_BASE_PATH || "/"}${appConfig.logo}`;

  /* ==========================================================
     COMPONENT
     ========================================================== */

  return (
    <>
      {/* ========================================================
          MOBILE TOP BAR
          ======================================================== */}

      <div
        className="
          fixed
          left-0
          right-0
          top-0
          z-[100]
          flex
          h-16
          items-center
          justify-between
          border-b
          border-slate-200
          bg-white
          px-4
          shadow-[0_2px_15px_rgba(15,23,42,0.04)]
          md:hidden
        "
      >

        {/* MENU BUTTON */}

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            text-violet-600
            shadow-sm
            transition
            hover:border-violet-200
            hover:bg-violet-50
          "
        >
          {mobileMenuOpen ? (
            <HiX size={22} />
          ) : (
            <HiOutlineMenu size={22} />
          )}
        </button>

        {/* LOGO */}

        <img
          src={logoUrl}
          alt="Catchy Admin"
          className="
            h-10
            max-w-[130px]
            object-contain
          "
        />

        <div className="w-10" />
      </div>

      {/* ========================================================
          MOBILE DRAWER
          ======================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[90]
          bg-[#F4F3FA]
          pt-16
          transition-transform
          duration-300
          md:hidden

          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <nav
          className="
            sidebar-scroll
            h-full
            overflow-y-auto
            overflow-x-hidden
            px-2
            py-2.5
            pb-24
          "
        >
          <ul className="space-y-0">
            {menu.map((item) =>
              renderNavItem(item)
            )}
          </ul>

          {/* MOBILE LOGOUT */}

          <div
            className="
              mt-6
              border-t
              border-slate-100
              pt-5
            "
          >
            <button
              type="button"
              onClick={handleLogout}
              className="
                group
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                border
                border-[#DEDCEC]
                bg-[#F7F5FC]
                px-3
                py-3
                text-left
                shadow-sm
                transition
                hover:border-red-100
                hover:bg-red-50
              "
            >

              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-violet-100
                  bg-violet-50
                  text-violet-600
                  transition
                  group-hover:border-red-100
                  group-hover:bg-red-50
                  group-hover:text-red-500
                "
              >
                <AiOutlineLogout size={20} />
              </span>

              <div>
                <div
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  Logout
                </div>

                <div
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Sign out
                </div>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* ========================================================
          DESKTOP SIDEBAR SPACER

          Sidebar remains fixed while page scrolls.
          ======================================================== */}

      <div
        aria-hidden="true"
        className={`
          hidden
          shrink-0
          md:block
          transition-all
          duration-300
          ease-in-out

          ${
            collapsed
              ? "w-[88px]"
              : "w-[270px]"
          }
        `}
      />

      {/* ========================================================
          DESKTOP SIDEBAR
          ======================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          bottom-0
          h-screen
          z-[100]
          hidden
          flex-col
          overflow-hidden

          border-r
          border-slate-200

          bg-white

          shadow-[8px_0_30px_rgba(15,23,42,0.035)]

          transition-all
          duration-300
          ease-in-out

          md:flex

          ${
            collapsed
              ? "w-[88px]"
              : "w-[270px]"
          }
        `}
        aria-label="Sidebar"
        role="navigation"
      >

        {/* ======================================================
            SUBTLE LIGHT BACKGROUND
            ====================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-b
            from-[#F8F7FC]
            via-[#F4F3FA]
            to-[#EFEDF7]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            overflow-hidden
          "
        >

          {/* Purple top glow */}

          <div
            className="
              absolute
              -left-24
              -top-32
              h-56
              w-56
              rounded-full
              bg-violet-200
              opacity-35
              blur-3xl
            "
          />

          {/* Bottom glow */}

          <div
            className="
              absolute
              -bottom-28
              -right-28
              h-48
              w-48
              rounded-full
              bg-indigo-100
              opacity-55
              blur-3xl
            "
          />
        </div>

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div
          className={`
            relative
            flex
            h-[70px]
            shrink-0
            items-center
            border-b
            border-slate-100

            ${
              collapsed
                ? "justify-center px-3"
                : "px-3"
            }
          `}
        >

          {!collapsed ? (
            <div
              className="
                flex
                h-full
                w-full
                items-center
              "
            >

              {/* LOGO */}

              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  items-center
                  justify-center
                "
              >
                <img
                  src={logoUrl}
                  alt="Catchy Admin"
                  className="
                    h-[72px]
                    max-w-[132px]
                    object-contain
                    object-center
                  "
                />
              </div>

              {/* =================================================
                  CROSS BUTTON
                  RIGHT SIDE
                  ================================================= */}

              <button
                type="button"
                onClick={() =>
                  setCollapsed(
                    (value) => !value
                  )
                }
                aria-label="Collapse sidebar"
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-400
                  shadow-[0_3px_12px_rgba(15,23,42,0.05)]
                  transition-all
                  duration-200
                  hover:border-violet-200
                  hover:bg-violet-50
                  hover:text-violet-600
                  hover:shadow-[0_5px_18px_rgba(124,58,237,0.10)]
                "
              >
                <HiX size={21} />
              </button>
            </div>
          ) : (

            /* ==================================================
               COLLAPSED BUTTON
               ================================================== */

            <button
              type="button"
              onClick={() =>
                setCollapsed(
                  (value) => !value
                )
              }
              aria-label="Expand sidebar"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-500
                via-purple-500
                to-indigo-600
                text-white
                shadow-[0_7px_20px_rgba(124,58,237,0.25)]
                transition
                hover:scale-[1.03]
              "
            >
              <HiOutlineMenu size={22} />
            </button>
          )}
        </div>

        {/* ======================================================
            NAVIGATION

            Scrollbar hidden.
            Sidebar itself stays fixed.
            ====================================================== */}

        <nav
          className="
            sidebar-scroll
            relative
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            px-2
            py-2
          "
        >
          <ul className="space-y-0">

            {menu.map(
              (item, index) => {

                if (
                  isHiddenForUser(item)
                ) {
                  return null;
                }

                if (
                  !hasAny(item.perms)
                ) {
                  return null;
                }

                const section =
                  getSection(item.key);

                const previous =
                  menu[index - 1];

                const previousSection =
                  previous
                    ? getSection(
                        previous.key
                      )
                    : null;

                return (
                  <React.Fragment
                    key={item.key}
                  >

                    {/* ==================================================
                        SECTION TITLE
                        ================================================== */}

                    {/* Section labels intentionally hidden for a cleaner, compact sidebar. */}

                    {renderNavItem(item)}
                  </React.Fragment>
                );
              }
            )}

          </ul>
        </nav>

        {/* ======================================================
            LOGOUT
            ====================================================== */}

        <div
          className="
            relative
            shrink-0
            border-t
            border-slate-100
            bg-white
            p-2
          "
        >

          {!collapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              className="
                group
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                border
                border-[#DEDCEC]
                bg-[#F7F5FC]
                px-2
                py-2
                text-left
                shadow-[0_3px_12px_rgba(15,23,42,0.035)]
                transition-all
                duration-200
                hover:border-red-100
                hover:bg-red-50/60
                hover:shadow-[0_7px_20px_rgba(239,68,68,0.07)]
              "
            >

              {/* LOGOUT ICON */}

              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-violet-100
                  bg-violet-50
                  text-violet-600
                  transition
                  group-hover:border-red-100
                  group-hover:bg-red-50
                  group-hover:text-red-500
                "
              >
                <AiOutlineLogout
                  size={19}
                />
              </div>

              {/* LOGOUT TEXT */}

              <div className="min-w-0">

                <div
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                    group-hover:text-red-600
                  "
                >
                  Logout
                </div>

                <div
                  className="
                    mt-0.5
                    text-xs
                    text-slate-400
                  "
                >
                  Sign out
                </div>

              </div>
            </button>
          ) : (

            /* ==================================================
               COLLAPSED LOGOUT
               ================================================== */

            <Tooltip>
              <TooltipTrigger asChild>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#DEDCEC]
                    bg-[#F7F5FC]
                    py-2
                    shadow-sm
                    transition
                    hover:border-red-100
                    hover:bg-red-50
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
                      bg-violet-50
                      text-violet-600
                      transition
                      hover:bg-red-50
                      hover:text-red-500
                    "
                  >
                    <AiOutlineLogout
                      size={19}
                    />
                  </div>
                </button>

              </TooltipTrigger>

              <TooltipContent side="right">
                Logout
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* ========================================================
          GLOBAL SIDEBAR SCROLLBAR HIDER
          ======================================================== */}

      <style>{`
        .sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          display: none;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          display: none;
        }
      `}</style>
    </>
  );
}