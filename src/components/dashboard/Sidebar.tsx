import {
  LayoutGrid,
  MonitorSmartphone,
  ShoppingCart,
  UtensilsCrossed,
  FileCheck,
  Receipt,
  Store,
  Info,
  LogOut,
  Menu as MenuIcon,
  X,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { SwitchUserModal } from "./SwitchUserModal";

const allLinkItems = [
  { label: "Dashboard", icon: LayoutGrid, to: "/", exact: true, adminOnly: true },
  { label: "POS", icon: MonitorSmartphone, to: "/pos", exact: false, adminOnly: false },
  { label: "Orders", icon: ShoppingCart, to: "/orders", exact: false, adminOnly: false },
  { label: "Menu", icon: UtensilsCrossed, to: "/menu", exact: false, adminOnly: true },
  { label: "Inventory", icon: FileCheck, to: "/inventory", exact: false, adminOnly: true },
  { label: "Expenses", icon: Receipt, to: "/expenses", exact: false, adminOnly: true },
  { label: "Manage", icon: Store, to: "/manage", exact: false, adminOnly: true },
] as const;

const stubItems = [{ label: "Help Center", icon: Info }] as const;

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const isStaff = currentUser?.role === "Staff";
  const visibleLinkItems = allLinkItems.filter(
    (item) => !isStaff || !item.adminOnly
  );

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-[10px] z-30 flex h-10 w-10 items-center justify-center rounded-[10px] bg-baky-card text-black lg:hidden"
      >
        <MenuIcon className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {/* Overlay (mobile only) */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col bg-baky-surface px-4 py-8 transition-all duration-300 lg:static lg:z-auto lg:h-full lg:w-[321px] lg:overflow-y-auto lg:translate-x-0 ${open
            ? "translate-x-0 opacity-100 visible pointer-events-auto"
            : "-translate-x-full opacity-0 invisible pointer-events-none"
          } lg:opacity-100 lg:visible lg:pointer-events-auto`}
      >
        {/* Brand + close */}
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/baky-logo.png"
              alt="Baky Logo"
              className="h-12 w-12 shrink-0 object-contain"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xl font-medium text-black lg:text-2xl">
                Baky Dessert House
              </p>
              <p className="text-base font-light text-black lg:text-lg">
                Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="shrink-0 lg:hidden"
          >
            <X className="h-6 w-6 text-black" strokeWidth={1.75} />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex flex-col gap-2 lg:mt-8">
          {visibleLinkItems.map(({ label, icon: Icon, to, exact }) => (
            <Link
              key={label}
              to={to}
              activeOptions={{ exact }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 rounded-[13px] px-4 py-3 text-left text-xl font-medium text-black transition-colors hover:bg-baky-card/60 lg:text-2xl [&.active]:bg-baky-card"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-6 w-6 shrink-0 lg:h-7 lg:w-7"
                    style={{ color: isActive ? "#000000" : "#8b8b8b" }}
                    strokeWidth={1.75}
                  />
                  {label}
                </>
              )}
            </Link>
          ))}
          {stubItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex items-center gap-4 rounded-[13px] px-4 py-3 text-left text-xl font-medium text-black transition-colors hover:bg-baky-card/60 lg:text-2xl"
            >
              <Icon
                className="h-6 w-6 shrink-0 lg:h-7 lg:w-7"
                style={{ color: "#8b8b8b" }}
                strokeWidth={1.75}
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Switch User / Logout */}
        <div className="mt-auto pt-4 space-y-2">
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="flex w-full items-center gap-4 rounded-[13px] px-4 py-3 text-left text-lg font-medium text-gray-700 hover:bg-baky-card/60 lg:text-xl"
          >
            <UserCheck className="h-6 w-6 shrink-0 text-[#1177E5] lg:h-7 lg:w-7" strokeWidth={1.75} />
            Switch User
          </button>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-4 rounded-[13px] px-4 py-3 text-left text-lg font-medium text-black hover:bg-baky-card/60 lg:text-xl"
          >
            <LogOut className="h-6 w-6 shrink-0 lg:h-7 lg:w-7" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>

      {/* Switch User Modal */}
      <SwitchUserModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
      />
    </>
  );
}
