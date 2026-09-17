import { useState } from "react";
import { Bell, Settings, ChevronDown, UserCheck, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { SwitchUserModal } from "./SwitchUserModal";

export function Topbar({ title = "Dashboard" }: { title?: string }) {
  const { currentUser } = useStore();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const isStaff = currentUser?.role === "Staff";

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 bg-baky-surface pl-[60px] pr-3 lg:h-[72px] lg:px-6">
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
                  Staff: {currentUser.staffMember?.name || "Staff"}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Admin</span>
              </>
            )}
          </button>

          <button className="hidden h-9 items-center gap-2 rounded-[10px] bg-baky-card px-3 text-sm font-medium text-baky-muted sm:flex lg:h-10 lg:rounded-xl lg:px-4 lg:text-base">
            Last 7 Days
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl">
            <Bell className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-baky-card text-baky-muted lg:h-10 lg:w-10 lg:rounded-xl">
            <Settings className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            title="Switch User / Access"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1177E5] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity lg:h-10 lg:w-10 lg:text-sm"
          >
            {isStaff ? currentUser.staffMember?.name.charAt(0).toUpperCase() || "S" : "A"}
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
