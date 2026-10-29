import { useState } from "react";
import { Bell, Settings, ChevronDown, UserCheck, ShieldCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useStore, type DateRangeFilter } from "@/lib/store";
import { SwitchUserModal } from "./SwitchUserModal";

const DATE_RANGES: DateRangeFilter[] = ["Today", "Last 7 Days", "Last 30 Days", "All Time"];

export function Topbar({ title = "Dashboard" }: { title?: string }) {
  const { currentUser, dateRange, setDateRange, orders, inventory } = useStore();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();

  const isStaff = currentUser?.role === "Staff";
  const activeOrders = orders.filter((o) => o.status !== "Past Orders");
  const lowStock = inventory.filter((i) => i.current <= Math.max(2, Math.round(i.max * 0.3)));
  const notifCount = activeOrders.length + lowStock.length;

  return (
    <>
      <header className="relative flex h-[60px] shrink-0 items-center justify-between gap-2 bg-baky-surface pl-[60px] pr-3 lg:h-[72px] lg:px-6">
        <h1 className="min-w-0 truncate text-lg font-medium text-black lg:text-xl">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* Active Role Pill */}
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className={`flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-xs font-bold transition-all sm:text-sm lg:h-10 lg:rounded-xl ${isStaff
                ? "bg-blue-100 text-blue-900 border border-blue-200 hover:bg-blue-200"
                : "bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-200"
              }`}
          >
            {isStaff ? (
              <>
                <UserCheck className="h-4 w-4 text-blue-700 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  Staff: {currentUser?.staffMember?.name || "Staff"}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Admin</span>
              </>
            )}
          </button>

          {/* Date Range Filter */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setShowDateMenu((v) => !v);
                setShowNotifMenu(false);
              }}
              className="flex h-9 items-center gap-2 rounded-[10px] bg-baky-card px-3 text-sm font-medium text-baky-muted lg:h-10 lg:rounded-xl lg:px-4 lg:text-base"
            >
              {dateRange}
              <ChevronDown className="h-4 w-4" />
            </button>
            {showDateMenu && (
              <div className="absolute right-0 top-full z-40 mt-1.5 w-40 rounded-xl border border-baky-muted/30 bg-white p-1 shadow-lg">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setDateRange(r);
                      setShowDateMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm ${dateRange === r
                        ? "bg-baky-card font-semibold text-black"
                        : "text-baky-muted hover:bg-baky-card/50 hover:text-black"
                      }`}
                  >
                    <span>{r}</span>
                    {dateRange === r && <span className="text-[#1177E5]">•</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu((v) => !v);
                setShowDateMenu(false);
              }}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl"
            >
              <Bell className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
              {notifCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-baky-red" />
              )}
            </button>
            {showNotifMenu && (
              <div className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-baky-muted/30 bg-white p-3 shadow-lg">
                <p className="border-b border-baky-muted/20 pb-2 text-xs font-semibold text-black">
                  Alerts ({notifCount})
                </p>
                {notifCount === 0 ? (
                  <p className="py-3 text-center text-xs text-baky-muted">
                    All caught up! No pending alerts.
                  </p>
                ) : (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
                    {activeOrders.length > 0 && (
                      <button
                        onClick={() => {
                          setShowNotifMenu(false);
                          navigate({ to: "/orders" });
                        }}
                        className="flex w-full items-center justify-between rounded-lg bg-baky-card/60 px-2.5 py-2 text-left text-black hover:bg-baky-card"
                      >
                        <span>Active Orders</span>
                        <span className="font-semibold text-[#1177E5]">
                          {activeOrders.length} active
                        </span>
                      </button>
                    )}
                    {lowStock.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowNotifMenu(false);
                          navigate({ to: "/inventory" });
                        }}
                        className="flex w-full items-center justify-between rounded-lg bg-baky-card/60 px-2.5 py-2 text-left text-black hover:bg-baky-card"
                      >
                        <span className="truncate pr-2">Low: {item.name}</span>
                        <span className="shrink-0 font-semibold text-baky-red">
                          {item.current}/{item.max}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => navigate({ to: isStaff ? "/pos" : "/manage" })}
            aria-label="Settings"
            title={isStaff ? "POS" : "Manage Store"}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl"
          >
            <Settings className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setIsSwitchModalOpen(true)}
            title="Switch User / Access"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1177E5] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity lg:h-10 lg:w-10 lg:text-sm"
          >
            {isStaff ? currentUser?.staffMember?.name?.charAt(0).toUpperCase() || "S" : "A"}
          </button>
        </div>
      </header>

      <SwitchUserModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
      />
    </>
  );
}
