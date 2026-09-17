import { useStore } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, MonitorSmartphone, KeyRound } from "lucide-react";
import { useState } from "react";
import { SwitchUserModal } from "./SwitchUserModal";

export function StaffRestrictedView({ pageName }: { pageName: string }) {
  const { currentUser } = useStore();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[15px] bg-baky-surface p-6 text-center min-w-0">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-md border border-gray-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-900">
          {pageName} is Restricted
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed">
          Hello <strong>{currentUser.staffMember?.name || "Staff Member"}</strong>! Staff accounts are configured to access only <strong>POS</strong> and <strong>Orders</strong>.
        </p>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/pos"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1177E5] py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all"
          >
            <MonitorSmartphone className="h-4 w-4" /> Go to POS Register
          </Link>

          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-all"
          >
            <KeyRound className="h-4 w-4 text-emerald-600" /> Switch to Admin Mode
          </button>
        </div>
      </div>

      <SwitchUserModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
      />
    </div>
  );
}
